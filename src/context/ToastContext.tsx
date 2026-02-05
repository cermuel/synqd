"use client";

import Toast from "@/components/shared/Toast";
import { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "default" | "success" | "error";

type ToastContextType = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("Wrap your app in <ToastProvider>");
  return ctx;
};

let globalToastFunc: ((message: string, type?: ToastType) => void) | null =
  null;

export const toast = (message: string, type?: ToastType) => {
  if (globalToastFunc) globalToastFunc(message, type);
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toastState, setToastState] = useState<{
    message: string;
    type: ToastType;
    show: boolean;
  }>({ message: "", type: "default", show: false });

  const toastFunc = (message: string, type: ToastType = "default") => {
    setToastState({ message, type, show: true });
    setTimeout(() => setToastState((s) => ({ ...s, show: false })), 3000);
  };

  globalToastFunc = toastFunc;

  return (
    <ToastContext.Provider value={{ toast: toastFunc }}>
      {children}
      <Toast {...toastState} />
    </ToastContext.Provider>
  );
};
