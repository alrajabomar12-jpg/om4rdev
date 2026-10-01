"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Tone = "success" | "error";
interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

const ToastContext = createContext<(tone: Tone, message: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

/** Success and error toasts, announced through aria-live (errors assertively). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (tone: Tone, message: string) => {
      const id = ++nextId.current;
      setToasts((all) => [...all.slice(-3), { id, tone, message }]);
      timers.current.set(id, setTimeout(() => dismiss(id), tone === "error" ? 8000 : 4000));
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const region = (tone: Tone) => (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className="flex flex-col gap-2"
    >
      {toasts
        .filter((t) => t.tone === tone)
        .map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-[0_12px_32px_-12px_rgb(0_0_0/0.8)] ${
              tone === "error" ? "border-danger/50 bg-[#2a0f12] text-[#ffd2cc]" : "border-live/40 bg-[#0c2218] text-[#c9f7d9]"
            }`}
          >
            {tone === "error" ? (
              <XCircle size={18} aria-hidden="true" className="mt-px shrink-0 text-danger" />
            ) : (
              <CheckCircle2 size={18} aria-hidden="true" className="mt-px shrink-0 text-live" />
            )}
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
    </div>
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col gap-2 sm:left-auto sm:w-96">
        {region("error")}
        {region("success")}
      </div>
    </ToastContext.Provider>
  );
}
