"use client";
import AppWrapper from "@/components/layout/app-wrapper";
import { useSocket } from "@/context/SocketContext";
import { useParams } from "next/navigation";
import useTransfer from "../hooks/useTransfer";
import { generateCompactName } from "@/utils/helpers";
import Ripple from "@/components/shared/ripple";
import RequestModal from "@/components/request-modal";
import { useEffect, useRef, useState } from "react";

interface PeerPosition {
  x: number;
  y: number;
}

const Page = () => {
  const { code } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const [peerPositions, setPeerPositions] = useState<Map<string, PeerPosition>>(
    new Map(),
  );

  const {
    peers,
    peersRef,
    warning,
    messageRequest,
    transferToPeer,
    sendingProgress,
    receivingProgress,
    messagesToSend,
    handleMessageRequest,
    sendFile,
    sendFolder,
  } = useTransfer({
    room: code as string,
  });

  const s = useSocket();
  const socket = s?.socket;

  useEffect(() => {
    const newPositions = new Map<string, PeerPosition>();

    peers.forEach((peer) => {
      if (!peerPositions.has(peer.peerID)) {
        const safeMarginPx = 90;
        const bottomSafePx = 140;

        const safeMarginPercent = (safeMarginPx / window.innerWidth) * 100;
        const bottomSafePercent = (bottomSafePx / window.innerHeight) * 100;

        const x =
          Math.random() * (100 - 2 * safeMarginPercent) + safeMarginPercent;
        const y =
          Math.random() * (100 - safeMarginPercent - bottomSafePercent) +
          safeMarginPercent;

        newPositions.set(peer.peerID, { x, y });
      } else {
        newPositions.set(peer.peerID, peerPositions.get(peer.peerID)!);
      }
    });

    setPeerPositions(newPositions);
  }, [peers.length]);

  const handlePeerClick = (peerID: string) => {
    setSelectedPeer(peerID);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedPeer) return;

    if (files.length === 1) {
      await sendFile(files[0], selectedPeer);
    } else {
      const fileArray = Array.from(files);
      await sendFolder(fileArray, "Shared Files", selectedPeer);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedPeer(null);
  };

  const getPeerProgress = (peerID: string) => {
    let activeTransferId: string | null = null;

    transferToPeer.current.forEach((peerId, transferId) => {
      if (peerId === peerID) {
        activeTransferId = transferId;
      }
    });

    if (!activeTransferId) return null;

    if (sendingProgress[activeTransferId] !== undefined) {
      return { progress: sendingProgress[activeTransferId], type: "sending" };
    }

    if (receivingProgress[activeTransferId] !== undefined) {
      return {
        progress: receivingProgress[activeTransferId],
        type: "receiving",
      };
    }

    return null;
  };

  const time = warning
    ? `${Math.floor(warning / 60)}:${(warning % 60).toString().padStart(2, "0")}`
    : null;

  console.log({ time });

  return (
    <AppWrapper>
      {messageRequest && (
        <RequestModal
          messageRequest={messageRequest}
          handleMessageRequest={handleMessageRequest}
        />
      )}

      {time && (
        <div className="fixed bottom-4 right-4 group w-max">
          <div className="rounded-full px-4 py-1 bg-white text-black font-semibold cursor-default">
            {time}
          </div>

          {/* Tooltip */}
          <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-max opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="rounded-full font-medium bg-white text-black text-xs px-4 py-1.5">
              This synq will self-destruct in{" "}
              <span className="font-semibold">{time}</span>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="fixed inset-0 pointer-events-none">
        {peersRef.current.map((peer) => {
          const position = peerPositions.get(peer.peerID);
          const progressInfo = getPeerProgress(peer.peerID);

          const waiting = messagesToSend.find((m) => m.receiver == peer.peerID);

          if (!position) return null;

          return (
            <div
              key={peer.peerID}
              className="absolute pointer-events-auto"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-12.5 h-12.5">
                  {progressInfo && (
                    <svg
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      width="62"
                      height="62"
                      style={{ overflow: "visible" }}
                    >
                      <circle
                        cx="31"
                        cy="31"
                        r="28"
                        fill="none"
                        stroke={"#f3b819"}
                        strokeWidth="3"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressInfo.progress / 100)}`}
                        transform="rotate(-90 31 31)"
                        className="transition-all duration-300"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}

                  <button
                    onClick={() => handlePeerClick(peer.peerID)}
                    disabled={
                      !peer.isReady ||
                      messageRequest != null ||
                      waiting != undefined
                    }
                    className="relative w-full h-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  >
                    <img
                      src={`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${generateCompactName(peer.peerID)}`}
                      width={50}
                      height={50}
                      className="rounded-full shadow-lg"
                      alt={generateCompactName(peer.peerID)}
                    />
                  </button>
                </div>

                <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-[#222] whitespace-nowrap">
                    {generateCompactName(peer.peerID)}
                  </p>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      peer.isReady ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  />
                </div>
                {waiting && (
                  <p className="mx-auto text-[#CCC] text-xs font-medium -mt-1.5 animate-pulse">
                    Waiting
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {socket?.id && (
        <div className="w-full flex flex-col items-center gap-1 mt-auto fixed bottom-5">
          <img
            src={`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${generateCompactName(socket.id)}`}
            width={50}
            height={50}
            className="rounded-full"
            alt={generateCompactName(socket.id)}
          />
          <p className="text-white font-semibold mx-auto">
            {generateCompactName(socket.id)}
          </p>
        </div>
      )}

      <Ripple />
    </AppWrapper>
  );
};

export default Page;
