"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;
const MAX_STACK_VISIBLE = 3; // số toast "lộ mép" khi thu gọn
const ITEM_HEIGHT = 52; // chiều cao ước lượng 1 toast (px)
const GAP = 8;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const counterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = ++counterRef.current;
      setToasts((list) => [...list, { id, message, variant }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string) => push(message, "success"),
    [push],
  );
  const error = useCallback(
    (message: string) => push(message, "error"),
    [push],
  );

  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded]);

  // toast mới nhất -> index 0, luôn neo ở đáy container
  const displayList = useMemo(() => [...toasts].reverse(), [toasts]);

  const containerHeight = expanded
    ? displayList.length * ITEM_HEIGHT +
      Math.max(0, displayList.length - 1) * GAP
    : ITEM_HEIGHT + Math.min(displayList.length - 1, MAX_STACK_VISIBLE) * 10;

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}

      <div
        ref={containerRef}
        className="fixed bottom-4 right-4 z-100 w-full max-w-sm"
        style={{
          height: displayList.length ? containerHeight : 0,
          transition: "height 300ms ease",
        }}
      >
        <div className="relative h-full w-full">
          {displayList.map((t, index) => {
            const isTop = index === 0;
            const depth = Math.min(index, MAX_STACK_VISIBLE);

            // luôn neo đáy = 0, item càng "cũ" (index lớn) càng đẩy lên cao
            const bottom = expanded ? index * (ITEM_HEIGHT + GAP) : 0;
            const translateY = expanded ? 0 : -depth * 10;
            const scale = expanded ? 1 : 1 - depth * 0.05;
            const opacity = !expanded && index >= MAX_STACK_VISIBLE ? 0 : 1;

            return (
              <button
                key={t.id}
                onClick={() => {
                  if (!expanded) {
                    setExpanded(true);
                    return;
                  }
                  dismiss(t.id);
                }}
                className={cn(
                  "absolute left-0 right-0 rounded-lg border px-4 py-3 text-left text-sm shadow-lg transition-all duration-300 ease-out",
                  t.variant === "success"
                    ? "border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                    : "border-destructive/30 bg-destructive/10 text-destructive",
                  !expanded && !isTop && "pointer-events-none",
                )}
                style={{
                  bottom,
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  zIndex: displayList.length - index,
                  opacity,
                }}
              >
                {t.message}
              </button>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast phải dùng bên trong ToastProvider");
  }
  return ctx;
}
