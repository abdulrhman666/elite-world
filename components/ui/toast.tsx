"use client";

import { CheckCircle2, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastItem = { id: number; message: string };
type ToastContextValue = { showToast: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string) => {
      const id = Date.now();
      setToasts((items) => [...items, { id, message }]);
      window.setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-24 z-[80] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-3 sm:bottom-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="text-brand-ink pointer-events-auto flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-medium shadow-xl"
          >
            <CheckCircle2
              className="size-5 shrink-0 text-emerald-600"
              aria-hidden
            />
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-lg hover:bg-slate-100"
              onClick={() => dismiss(toast.id)}
              aria-label="إغلاق التنبيه"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
