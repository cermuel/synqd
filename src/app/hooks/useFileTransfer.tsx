// hooks/useFileTransfer.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/SocketContext";

interface UseFileTransferProps {
  synqId: string;
  sender: boolean;
}

const CHUNK_SIZE = 16384; // 16KB chunks

const useFileTransfer = ({ synqId, sender }: UseFileTransferProps) => {
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");
  const [sendProgress, setSendProgress] = useState(0);
  const [receiveProgress, setReceiveProgress] = useState(0);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [receivingFileName, setReceivingFileName] = useState("");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const makingOfferRef = useRef(false);
  const isInitializedRef = useRef(false);

  // For receiving files in real-time
  const receivedBuffersRef = useRef<ArrayBuffer[]>([]);
  const fileMetadataRef = useRef<{
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);

  const s = useSocket();
  const socket = s?.socket;

  useEffect(() => {
    if (!socket) {
      console.log("No socket available yet");
      return;
    }

    if (isInitializedRef.current) {
      console.log("⚠️ Already initialized, skipping");
      return;
    }

    isInitializedRef.current = true;
    console.log(
      `🚀 Initializing WebRTC - Role: ${sender ? "SENDER" : "RECEIVER"}`,
    );

    const config: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    };

    const pc = new RTCPeerConnection(config);
    peerConnectionRef.current = pc;

    pc.onconnectionstatechange = () => {
      console.log("📡 Connection state:", pc.connectionState);
      setConnectionState(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE connection state:", pc.iceConnectionState);
    };

    pc.onicegatheringstatechange = () => {
      console.log("🔍 ICE gathering state:", pc.iceGatheringState);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("📤 Sending ICE candidate");
        socket.emit("ice-candidate", {
          synqId,
          candidate: event.candidate,
        });
      } else {
        console.log("✅ All ICE candidates sent");
      }
    };

    const setupDataChannel = (channel: RTCDataChannel) => {
      console.log("🔧 Setting up data channel");
      dataChannelRef.current = channel;
      channel.binaryType = "arraybuffer";

      channel.onopen = () => {
        console.log("✅ Data channel opened - Ready for two-way transfer!");
      };

      channel.onclose = () => {
        console.log("🔴 Data channel closed");
      };

      channel.onerror = (error) => {
        console.error("❌ Data channel error:", error);
      };

      channel.onmessage = (event) => {
        if (typeof event.data === "string") {
          const message = JSON.parse(event.data);
          console.log("📨 Received metadata:", message);

          if (message.type === "metadata") {
            // File transfer starting - reset everything
            fileMetadataRef.current = {
              name: message.name,
              size: message.size,
              mimeType: message.mimeType,
            };
            receivedBuffersRef.current = [];
            setReceiveProgress(0);
            setIsReceiving(true);
            setReceivingFileName(message.name);
            console.log(
              `📥 Receiving file: ${message.name} (${message.size} bytes)`,
            );
          } else if (message.type === "done") {
            // File transfer complete - trigger download
            console.log("✅ File transfer complete! Downloading...");

            const blob = new Blob(receivedBuffersRef.current, {
              type:
                fileMetadataRef.current?.mimeType || "application/octet-stream",
            });

            // Auto-download the file
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileMetadataRef.current?.name || "received_file";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setReceiveProgress(100);
            setIsReceiving(false);

            // Reset after a delay
            setTimeout(() => {
              setReceiveProgress(0);
              setReceivingFileName("");
            }, 3000);
          }
        } else {
          // Binary data chunk received - update progress immediately
          receivedBuffersRef.current.push(event.data);

          const received = receivedBuffersRef.current.reduce(
            (acc, buf) => acc + buf.byteLength,
            0,
          );
          const total = fileMetadataRef.current?.size || 1;
          const progress = (received / total) * 100;

          setReceiveProgress(progress);
          console.log(`📦 Receiving: ${progress.toFixed(1)}%`);
        }
      };
    };

    const handleIceCandidate = async (data: {
      candidate: RTCIceCandidateInit;
    }) => {
      try {
        console.log("📥 Received ICE candidate");
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log("✅ ICE candidate added");
        } else {
          console.log("⏳ Queuing ICE candidate");
        }
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    };

    const handleOffer = async (data: { offer: RTCSessionDescriptionInit }) => {
      try {
        console.log("📥 Received offer from sender");

        if (pc.signalingState !== "stable") {
          console.log("⚠️ Not in stable state, ignoring offer");
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        console.log("✅ Remote description set");

        console.log("📝 Creating answer");
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log("📤 Sending answer to sender");
        socket.emit("answer", {
          synqId,
          answer: pc.localDescription,
        });
      } catch (error) {
        console.error("❌ Error handling offer:", error);
      }
    };

    const handleAnswer = async (data: {
      answer: RTCSessionDescriptionInit;
    }) => {
      try {
        console.log("📥 Received answer from receiver");

        if (pc.signalingState !== "have-local-offer") {
          console.log(
            "⚠️ Not expecting answer, current state:",
            pc.signalingState,
          );
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log("✅ Connection established!");
      } catch (error) {
        console.error("❌ Error setting remote description:", error);
      }
    };

    socket.on("ice-candidate", handleIceCandidate);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);

    if (sender) {
      console.log("🎯 SENDER: Creating data channel");

      const dataChannel = pc.createDataChannel("fileTransfer");
      setupDataChannel(dataChannel);

      const createOffer = async () => {
        if (makingOfferRef.current) {
          console.log("⚠️ Already making offer, skipping");
          return;
        }

        try {
          makingOfferRef.current = true;
          console.log("📝 Creating offer");

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          console.log("📤 Sending offer to receiver");
          socket.emit("offer", {
            synqId,
            offer: pc.localDescription,
          });
        } catch (error) {
          console.error("❌ Error creating offer:", error);
        } finally {
          makingOfferRef.current = false;
        }
      };

      createOffer();
    } else {
      console.log("👂 RECEIVER: Waiting for data channel");

      pc.ondatachannel = (event) => {
        console.log("📥 Data channel received from sender");
        setupDataChannel(event.channel);
      };
    }

    return () => {
      console.log("🧹 Cleaning up WebRTC connection");
      isInitializedRef.current = false;
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);

      if (dataChannelRef.current) {
        dataChannelRef.current.close();
      }
      pc.close();
    };
  }, [socket, synqId, sender]);

  // Function to send a file with real-time progress
  const sendFile = async (file: File) => {
    const channel = dataChannelRef.current;

    if (!channel || channel.readyState !== "open") {
      console.error("❌ Data channel not ready");
      alert("Connection not ready. Please wait.");
      return;
    }

    console.log(`📤 Sending file: ${file.name} (${file.size} bytes)`);
    setIsSending(true);
    setSendProgress(0);

    // Step 1: Send metadata
    const metadata = {
      type: "metadata",
      name: file.name,
      size: file.size,
      mimeType: file.type,
    };

    channel.send(JSON.stringify(metadata));

    // Step 2: Read file and send in chunks with real-time progress
    const arrayBuffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(arrayBuffer.byteLength / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, arrayBuffer.byteLength);
      const chunk = arrayBuffer.slice(start, end);

      // Wait if buffer is getting full (backpressure)
      while (channel.bufferedAmount > CHUNK_SIZE * 10) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      channel.send(chunk);

      // Update progress immediately after each chunk
      const progress = ((i + 1) / totalChunks) * 100;
      setSendProgress(progress);
      console.log(`📦 Sending: ${progress.toFixed(1)}%`);
    }

    // Step 3: Send completion message
    channel.send(JSON.stringify({ type: "done" }));
    console.log("✅ File sent successfully!");

    setIsSending(false);

    // Reset after a delay
    setTimeout(() => {
      setSendProgress(0);
    }, 3000);
  };

  return {
    connectionState,
    sendProgress,
    receiveProgress,
    isSending,
    isReceiving,
    receivingFileName,
    sendFile,
  };
};

export default useFileTransfer;
