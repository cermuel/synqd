"use client";
import { ReactNode, useEffect } from "react";
import Navbar from "./navbar";
import { useSocket } from "@/context/SocketContext";
import { usePathname, useRouter } from "next/navigation";

const AppWrapper = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const s = useSocket();
  const socket = s?.socket;

  useEffect(() => {
    if (!socket) return;
    socket.on("user-joined", ({ synqId }) => {
      if (pathname.includes(synqId)) return;
      router.push(`/${synqId}`);
    });
  }, [socket]);

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
