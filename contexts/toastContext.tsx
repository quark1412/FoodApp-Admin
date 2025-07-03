import React, { createContext, useContext, useRef } from "react";
import { Toast } from "@/components/toast";

interface ToastContextType {
  showToast: (
    message: string,
    type?: "success" | "error" | "info" | "warning"
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const toastRef = useRef<{
    show: (message: string, type: string) => void;
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    if (toastRef.current) {
      toastRef.current.show(message, type);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast ref={toastRef} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
