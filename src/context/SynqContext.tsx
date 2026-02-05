"use client";
import { randomUUID } from "crypto";
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
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

  useEffect(() => {
    if (!synq) return;
    localStorage.setItem("synq-code", synq.id);
  }, [synq]);

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
