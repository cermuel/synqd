"use client";
import { randomUUID } from "crypto";
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useState,
} from "react";

interface SynqContextType {
  synq: {
    duration: number;
    createdAt: Date;
    id: string;
    devices: string[];
  } | null;
  setSynq?: Dispatch<SynqContextType["synq"]>;
}

export const SynqContextProvider = createContext<SynqContextType>({
  synq: null,
});

const SynqContext = ({ children }: { children: ReactNode }) => {
  const [synq, setSynq] = useState<SynqContextType["synq"]>(null);

  if (!synq) {
    setSynq({
      duration: 60,
      id: "shadyqrcodeinit",
      createdAt: new Date(),
      devices: [],
    });
  }
  return (
    <SynqContextProvider.Provider value={{ synq, setSynq }}>
      {children}
    </SynqContextProvider.Provider>
  );
};

export const useSynq = () => {
  const context = useContext(SynqContextProvider);
  return context;
};

export default SynqContext;
