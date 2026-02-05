import { useSocket } from "@/context/SocketContext";
import { useEffect, useRef, useState } from "react";
import { EVENTS } from "../constants/events";
import { Socket } from "socket.io-client";
// import { config } from "../constants";

interface Peer {
  peerID: string;
  peer: RTCPeerConnection;
  channel: RTCDataChannel | null;
  isReady: boolean;
}

const config: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:global.turn.twilio.com:3478?transport=udp",
      username: "your-twilio-username",
      credential: "your-twilio-credential",
    },
    {
      urls: "turn:global.turn.twilio.com:3478?transport=tcp",
      username: "your-twilio-username",
      credential: "your-twilio-credential",
    },
    {
      urls: "turn:global.turn.twilio.com:443?transport=tcp",
      username: "your-twilio-username",
      credential: "your-twilio-credential",
    },
  ],
  iceTransportPolicy: "all",
  iceCandidatePoolSize: 10,
};

const useTransfer = ({ room }: { room: string }) => {
  const s = useSocket();
  const socket = s?.socket;
  const peersRef = useRef<Peer[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map(),
  );
  const [messageRequest, setMessageRequest] = useState<{
    sender: string;
    message: any;
  } | null>(null);

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
  const handleMessage = (event: MessageEvent, userID: string) => {
    console.log(`📨 RECEIVED from ${userID}:`, event.data);
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

  const sendMessage = (message: string, userID: string) => {
    const peer = peersRef.current.find((p) => p.peerID == userID);
    const channel = peer?.channel;

    if (!channel || channel.readyState !== "open") {
      console.error(
        `Cannot send to ${userID}: Channel is ${channel?.readyState || "missing"}`,
      );
      return;
    }

    try {
      channel.send(message);
      console.log("Message passed to browser buffer successfully");
    } catch (error) {
      console.error("Immediate send failure:", error);
    }
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

  return { peers, peersRef, initMessage, messageRequest, handleMessageRequest };
};

export default useTransfer;
