// app/room/[code]/page.tsx
"use client";

import AppWrapper from "@/components/layout/app-wrapper";
import { useSocket } from "@/context/SocketContext";
import { useParams, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import useTransfer from "../hooks/useTransfer";
import { generateCompactName } from "@/utils/helpers";
import Image from "next/image";
import Ripple from "@/components/shared/ripple";
import RequestModal from "@/components/request-modal";

const Page = () => {
  const { code } = useParams();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // const {
  //   connectionState,
  //   sendProgress,
  //   receiveProgress,
  //   isSending,
  //   isReceiving,
  //   receivingFileName,
  //   sendFile,
  // } = useFileTransfer({
  //   synqId: code as string,
  //   sender: mode === "sender",
  // });

  const {
    peers,
    peersRef,
    initMessage: sendMessage,
    handleMessageRequest,
    messageRequest,
  } = useTransfer({
    room: code as string,
  });

  const s = useSocket();
  const socket = s?.socket;

  // useEffect(() => {
  //   if (!socket) return;
  //   socket.emit("join-synq", code);
  // }, [socket, code]);

  // const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setSelectedFile(file);
  //   }
  // };

  // const handleSend = async () => {
  //   if (selectedFile) {
  //     await sendFile(selectedFile);
  //   }
  // };

  return (
    <AppWrapper>
      {messageRequest && (
        <RequestModal
          messageRequest={messageRequest}
          handleMessageRequest={handleMessageRequest}
        />
      )}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <ul>
          {peersRef.current.map((p, index) => {
            return (
              <div
                key={p.peerID + index}
                className="w-full flex items-center bg-white my-2 rounded-sm p-4 gap-1"
              >
                <h1 className="font-semibold text-sm max-w-40 truncate">
                  {generateCompactName(p.peerID)}
                </h1>
                <div
                  className={`w-2 aspect-square rounded-full ${p.isReady ? "bg-green-500" : "bg-[#EC0000]"}`}
                />
                <button
                  disabled={!p.isReady}
                  onClick={() => sendMessage("hello mate", p.peerID)}
                  className="bg-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-white text-sm font-bold ml-auto rounded-full px-2 py-1"
                >
                  SEND
                </button>
              </div>
            );
          })}
        </ul>
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
