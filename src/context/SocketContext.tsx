"use client";
import { API_URI } from "@/app/constants";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import io, { Socket } from "socket.io-client";

interface SocketProviderInterface {
  socket: Socket | null;
  socketError: Error | null;
  isConnected: boolean;
}

export const SocketContextProvider = createContext<
  SocketProviderInterface | undefined
>(undefined);

const SocketContext = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketError, setSocketError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(API_URI, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000,
      //   auth: { token },
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected!", socketInstance.id);
      setSocket(socketInstance);
      setSocketError(null);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      setSocketError(error);
      setIsConnected(false);
    });

    socketInstance.on("error", (error) => setSocketError(error));

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setSocketError(null);
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContextProvider.Provider
      value={{ socket, socketError, isConnected }}
    >
      {children}
    </SocketContextProvider.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContextProvider);
  if (context) return context;
};

export default SocketContext;
