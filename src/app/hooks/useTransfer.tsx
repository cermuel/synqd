import { useSocket } from "@/context/SocketContext";
import { useEffect, useRef, useState } from "react";
import { EVENTS } from "../constants/events";
import { Socket } from "socket.io-client";
import {
  TransferMessage,
  MessageRequest,
  FileMetadata,
  FolderMetadata,
  ActiveTransfer,
  ChunkMessage,
} from "../../types/context";

import { config } from "../constants";
import { generatePreview, generateUUID } from "@/utils/helpers";

interface Peer {
  peerID: string;
  peer: RTCPeerConnection;
  channel: RTCDataChannel | null;
  isReady: boolean;
}

const CHUNK_SIZE = 16384;

const useTransfer = ({ room }: { room: string }) => {
  const s = useSocket();
  const socket = s?.socket;
  const peersRef = useRef<Peer[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map(),
  );
  const [messageRequest, setMessageRequest] = useState<MessageRequest | null>(
    null,
  );
  const [sendingProgress, setSendingProgress] = useState<{
    [key: string]: number;
  }>({});
  const [receivingProgress, setReceivingProgress] = useState<{
    [key: string]: number;
  }>({});
  const receivedChunks = useRef<Map<string, ArrayBuffer[]>>(new Map());
  const fileMetadata = useRef<Map<string, FileMetadata>>(new Map());
  const activeTransfers = useRef<Map<string, ActiveTransfer>>(new Map());
  const pendingFiles = useRef<Map<string, File>>(new Map());
  const activeReceivingTransferId = useRef<string | null>(null);

  useEffect(() => {
    if (!socket) return;
    socket.emit(EVENTS.EMIT.JOIN_ROOM, room);
  }, [socket]);

  const handlePendingQueue = async (from: string, peer: RTCPeerConnection) => {
    const queue = pendingCandidates.current.get(from) || [];

    for (const candidate of queue) {
      await peer
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch((err) => console.error("Error adding queued candidate:", err));
    }
    pendingCandidates.current.delete(from);
  };

  const handleCreatePeer = async (userId: string, socket: Socket) => {
    if (!socket.id || userId === socket.id) return;
    if (peersRef.current.find((p) => p.peerID === userId)) return;

    const initiator: boolean = socket.id > userId;

    const peer = await createPeer(userId, initiator);

    peersRef.current.push(peer);
    setPeers((prev) => [...prev, peer]);
  };

  useEffect(() => {
    if (!socket) return;

    const handleReceiveIceCandidate = ({
      candidate,
      userId,
    }: {
      candidate: RTCIceCandidateInit;
      userId: string;
    }) => {
      const peer = peersRef.current.find((p) => p.peerID == userId);
      if (!peer) return;

      if (peer.peer.remoteDescription) {
        peer.peer
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch((err) => console.error("Error adding ICE candidate:", err));
      } else {
        const queue = pendingCandidates.current.get(userId) || [];
        queue.push(candidate);
        pendingCandidates.current.set(userId, queue);
      }
    };

    const handleReceivedOffer = async ({
      offer,
      from,
    }: {
      offer: RTCSessionDescription;
      from: string;
    }) => {
      const peer = peersRef.current.find((p) => p.peerID == from);
      if (!peer) return;

      if (peer.peer.signalingState !== "stable") return;

      await peer.peer.setRemoteDescription(new RTCSessionDescription(offer));
      await handlePendingQueue(from, peer.peer);

      const answer = await peer.peer.createAnswer();
      await peer.peer.setLocalDescription(answer);

      socket.emit(EVENTS.EMIT.SEND_ANSWER, {
        userId: from,
        answer: peer.peer.localDescription,
      });
    };

    const handleReceivedAnswer = async ({
      answer,
      from,
    }: {
      answer: RTCSessionDescription;
      from: string;
    }) => {
      const peer = peersRef.current.find((p) => p.peerID == from);
      if (!peer) return;

      if (peer.peer.signalingState !== "have-local-offer") return;

      await peer.peer.setRemoteDescription(new RTCSessionDescription(answer));
      await handlePendingQueue(from, peer.peer);
    };

    const handleMessageRequest = (data: { sender: string; message: any }) => {
      setMessageRequest(data);
    };

    const handleNewMessage = (data: {
      receiver: string;
      message: any;
      status: "approved" | "rejected";
    }) => {
      if (data.status == "rejected") return;
      sendMessage(data.message, data.receiver);
    };

    socket.on(EVENTS.ON.USER_JOINED_SYNQ, ({ userId }) => {
      handleCreatePeer(userId, socket);
    });
    socket.on(EVENTS.ON.USER_LEFT, ({ userId }) => {
      peersRef.current = peersRef.current.filter((p) => p.peerID !== userId);
      setPeers(peersRef.current);
    });
    socket.on(EVENTS.ON.SYNQ_USERS, (users: string[]) =>
      users.forEach((id) => {
        handleCreatePeer(id, socket);
      }),
    );
    socket.on(EVENTS.ON.ICE_CANDIDATE_RECEIVED, handleReceiveIceCandidate);
    socket.on(EVENTS.ON.RECEIVED_OFFER, handleReceivedOffer);
    socket.on(EVENTS.ON.RECEIVED_ANSWER, handleReceivedAnswer);
    socket.on(EVENTS.ON.MESSAGE_INITATED, handleMessageRequest);
    socket.on(EVENTS.ON.MESSAGE_COMPLETED, handleNewMessage);

    return () => {
      socket.off(EVENTS.ON.SYNQ_USERS);
      socket.off(EVENTS.ON.USER_JOINED_SYNQ);
      socket.off(EVENTS.ON.ICE_CANDIDATE_RECEIVED);
      socket.off(EVENTS.ON.RECEIVED_OFFER);
      socket.off(EVENTS.ON.RECEIVED_ANSWER);
      socket.off(EVENTS.ON.USER_LEFT);
      socket.off(EVENTS.ON.MESSAGE_INITATED);
      socket.off(EVENTS.ON.MESSAGE_COMPLETED);
      peersRef.current.forEach((p) => {
        p.channel?.close();
        p.peer.close();
      });
      peersRef.current = [];
      setPeers([]);
    };
  }, [room, socket]);

  const setupChannel = (channel: RTCDataChannel, userID: string) => {
    channel.binaryType = "arraybuffer";

    channel.onopen = () => {
      const peerIndex = peersRef.current.findIndex((p) => p.peerID === userID);
      if (peerIndex !== -1) {
        peersRef.current[peerIndex].isReady = true;
        setPeers([...peersRef.current]);
      }
    };

    channel.onclose = () => {
      const peerIndex = peersRef.current.findIndex((p) => p.peerID === userID);
      if (peerIndex !== -1) {
        peersRef.current[peerIndex].isReady = false;
        setPeers([...peersRef.current]);
      }
    };

    channel.onmessage = (event) => {
      handleMessage(event, userID);
    };
  };

  const handleMessage = async (event: MessageEvent, userID: string) => {
    if (typeof event.data === "string") {
      const data: ChunkMessage = JSON.parse(event.data);

      if (data.type === "metadata") {
        activeReceivingTransferId.current = data.transferId;

        fileMetadata.current.set(data.transferId, {
          name: data.fileName!,
          size: data.fileSize!,
          type: data.fileType!,
        });
        receivedChunks.current.set(data.transferId, []);
        setReceivingProgress((prev) => ({ ...prev, [data.transferId]: 0 }));

        const peer = peersRef.current.find((p) => p.peerID === userID);
        const ackMsg: ChunkMessage = {
          type: "ack",
          transferId: data.transferId,
        };
        peer?.channel?.send(JSON.stringify(ackMsg));
      } else if (data.type === "complete") {
        const chunks = receivedChunks.current.get(data.transferId);
        const metadata = fileMetadata.current.get(data.transferId);

        if (chunks && metadata) {
          const blob = new Blob(chunks, { type: metadata.type });

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = metadata.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          activeReceivingTransferId.current = null;

          receivedChunks.current.delete(data.transferId);
          fileMetadata.current.delete(data.transferId);

          setReceivingProgress((prev) => ({ ...prev, [data.transferId]: 100 }));
          setTimeout(() => {
            setReceivingProgress((prev) => {
              const newProg = { ...prev };
              delete newProg[data.transferId];
              return newProg;
            });
          }, 3000);
        }
      } else if (data.type === "ack") {
        const file = pendingFiles.current.get(data.transferId);
        if (file) {
          await sendFileChunks(file, data.transferId, userID);
          pendingFiles.current.delete(data.transferId);
        }
      }
    } else {
      const transferId = activeReceivingTransferId.current;

      if (!transferId) {
        console.error("❌ Received chunk but no active transfer!");
        return;
      }

      const chunkData = event.data as ArrayBuffer;
      const chunks = receivedChunks.current.get(transferId);
      const metadata = fileMetadata.current.get(transferId);

      if (chunks && metadata) {
        chunks.push(chunkData);

        const received = chunks.reduce((acc, buf) => acc + buf.byteLength, 0);
        const progress = Math.min((received / metadata.size) * 100, 100);

        setReceivingProgress((prev) => ({ ...prev, [transferId]: progress }));
      }
    }
  };

  const sendFileChunks = async (
    file: File,
    transferId: string,
    userID: string,
  ) => {
    const peer = peersRef.current.find((p) => p.peerID === userID);
    const channel = peer?.channel;

    if (!channel || channel.readyState !== "open") return;

    const arrayBuffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(arrayBuffer.byteLength / CHUNK_SIZE);

    activeTransfers.current.set(transferId, {
      file,
      totalChunks,
      sentChunks: 0,
    });

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, arrayBuffer.byteLength);
      const chunk = arrayBuffer.slice(start, end);

      while (channel.bufferedAmount > CHUNK_SIZE * 10) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      channel.send(chunk);

      const progress = Math.min(((i + 1) / totalChunks) * 100, 100);
      setSendingProgress((prev) => ({ ...prev, [transferId]: progress }));
    }

    const completeMsg: ChunkMessage = { type: "complete", transferId };
    channel.send(JSON.stringify(completeMsg));

    activeTransfers.current.delete(transferId);
    setTimeout(() => {
      setSendingProgress((prev) => {
        const newProg = { ...prev };
        delete newProg[transferId];
        return newProg;
      });
    }, 3000);
  };
  const initMessage = (message: string, userID: string) => {
    if (!socket) return;
    socket.emit(EVENTS.EMIT.INITIATE_MESSAGE, {
      message,
      receiver: userID,
    });
  };
  const handleMessageRequest = (status: "approved" | "rejected") => {
    if (!socket || !messageRequest) return;

    socket.emit(EVENTS.EMIT.COMPLETE_MESSAGE, {
      message: messageRequest.message,
      sender: messageRequest.sender,
      status,
    });
    setMessageRequest(null);
  };

  const sendMessage = (message: TransferMessage, userID: string) => {
    const peer = peersRef.current.find((p) => p.peerID === userID);
    const channel = peer?.channel;

    if (!channel || channel.readyState !== "open") {
      console.error(
        `Cannot send to ${userID}: Channel is ${channel?.readyState || "missing"}`,
      );
      return;
    }

    try {
      if (
        message.type === "file" ||
        message.type === "image" ||
        message.type === "video"
      ) {
        const metadata = message.metadata as FileMetadata;
        const chunkMsg: ChunkMessage = {
          type: "metadata",
          transferId: message.id,
          fileName: metadata.name,
          fileSize: metadata.size,
          fileType: metadata.type,
        };
        channel.send(JSON.stringify(chunkMsg));
      } else {
        channel.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error("Send failure:", error);
    }
  };

  const sendFile = async (file: File, userID: string) => {
    const preview = await generatePreview(file);
    const transferId = generateUUID();

    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      preview,
    };

    const message: TransferMessage = {
      id: transferId,
      type: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : "file",
      metadata,
      preview,
    };

    pendingFiles.current.set(transferId, file);

    if (!socket) return;
    socket.emit(EVENTS.EMIT.INITIATE_MESSAGE, {
      message,
      receiver: userID,
    });
  };
  const sendFolder = async (
    files: File[],
    folderName: string,
    userID: string,
  ) => {
    const fileMetadataList: FileMetadata[] = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        preview: await generatePreview(file),
      })),
    );

    const folderMetadata: FolderMetadata = {
      name: folderName,
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      files: fileMetadataList,
    };

    const message: TransferMessage = {
      id: generateUUID(),
      type: "folder",
      metadata: folderMetadata,
    };

    if (!socket) return;
    socket.emit(EVENTS.EMIT.INITIATE_MESSAGE, {
      message,
      receiver: userID,
    });
  };

  const sendText = (text: string, userID: string) => {
    const message: TransferMessage = {
      id: generateUUID(),
      type: "text",
      metadata: null,
      data: text,
    };

    if (!socket) return;
    socket.emit(EVENTS.EMIT.INITIATE_MESSAGE, {
      message,
      receiver: userID,
    });
  };

  const createPeer = async (
    userId: string,
    isSender: boolean,
  ): Promise<Peer> => {
    const peer = new RTCPeerConnection(config);
    let channel = null;

    peer.onicecandidate = (event) => {
      if (!socket || !event.candidate) return;

      socket?.emit(EVENTS.EMIT.SEND_ICE_CANDIDATE, {
        synqId: room,
        userId: userId,
        candidate: event.candidate,
      });
    };

    if (isSender) {
      channel = peer.createDataChannel("fileTransfer");
      setupChannel(channel, userId);

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      if (socket) {
        socket.emit(EVENTS.EMIT.SEND_OFFER, {
          userId,
          offer: peer.localDescription,
        });
      }
    } else {
      peer.ondatachannel = (event) => {
        const incomingChannel = event.channel;

        const peerIdx = peersRef.current.findIndex((p) => p.peerID === userId);
        if (peerIdx !== -1) {
          peersRef.current[peerIdx].channel = incomingChannel;
          setupChannel(incomingChannel, userId);
          setPeers([...peersRef.current]);
        }
      };
    }

    return {
      peerID: userId,
      peer,
      channel,
      isReady: false,
    };
  };

  return {
    peers,
    peersRef,
    sendingProgress,
    receivingProgress,
    messageRequest,
    initMessage,
    sendText,
    sendFile,
    sendFolder,
    handleMessageRequest,
  };
};

export default useTransfer;
