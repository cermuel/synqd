"use client";
import { ReactNode, useEffect, useState } from "react";
import Navbar from "./navbar";
import { useSocket } from "@/context/SocketContext";
import { usePathname, useRouter } from "next/navigation";
import { useSynq } from "@/context/SynqContext";
import { uuidToShareCode } from "@/utils/helpers";

const AppWrapper = ({ children }: { children: ReactNode }) => {
  const { synq } = useSynq();
  const router = useRouter();
  const pathname = usePathname();
  const s = useSocket();
  const socket = s?.socket;

  useEffect(() => {
    if (!socket || !synq) return;
    socket.on("user-joined", ({ synqId }) => {
      const code = uuidToShareCode(synqId);
      if (pathname.includes(code)) return;
      if (synq.id == code) {
        router.push(`/${code}`);
      }
    });
  }, [socket, synq]);

  return (
    <main className="h-dvh w-dvw flex flex-col items-center justify-center bg-[#111] pt-12">
      <Navbar />
      <div className="flex-1 w-full h-full overflow-y-scroll relative">
        {children}
      </div>
    </main>
  );
};

export default AppWrapper;
