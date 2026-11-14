import React, { useState, useEffect, useRef, useCallback } from "react";

// Toast
type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let _toastId = 0;
let _addToast: ((message: string, type: ToastType) => void) | null = null;

export const toast = {
  success: (msg: string) => _addToast?.(msg, "success"),
  error: (msg: string) => _addToast?.(msg, "error"),
  info: (msg: string) => _addToast?.(msg, "info"),
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: "😻",
  error: "🙀",
  info: "🐾",
};

const TOAST_STYLES: Record<ToastType, string> = {
  success: "border-[#00aaaa]/40 bg-[#0d2020]",
  error: "border-[#ff8888]/40 bg-[#200d0d]",
  info: "border-[#f5bccb]/30 bg-[#1e1424]",
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = ++_toastId;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    _addToast = add;
    return () => { _addToast = null; };
  }, [add]);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg border text-[13px] text-[#c8c8d0] shadow-xl
            backdrop-blur-sm min-w-[260px] max-w-[360px] pointer-events-auto
            animate-[slideIn_0.2s_ease-out]
            ${TOAST_STYLES[t.type]}`}
        >
          <span className="leading-relaxed break-words">
            <span className="text-[15px] leading-none">{TOAST_ICONS[t.type]}&nbsp;&nbsp;</span>
            {t.message}
          </span>
        </div>
      ))}
    </div>
  );
};

// Confirm Modal
interface ConfirmOptions {
  message: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmResolver = (value: boolean) => void;

let _openConfirm: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

export const confirm = (opts: ConfirmOptions | string): Promise<boolean> => {
  const options: ConfirmOptions =
    typeof opts === "string" ? { message: opts } : opts;
  if (_openConfirm) return _openConfirm(options);
  return Promise.resolve(window.confirm(options.message));
};

export const ConfirmModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({ message: "" });
  const resolverRef = useRef<ConfirmResolver | null>(null);

  const open = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setOpts(options);
    setVisible(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    _openConfirm = open;
    return () => { _openConfirm = null; };
  }, [open]);

  const handleResolve = (value: boolean) => {
    setVisible(false);
    resolverRef.current?.(value);
    resolverRef.current = null;
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-[3px]"
      onClick={() => handleResolve(false)}
    >
      <div
        className="relative bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl shadow-2xl p-6 w-[340px] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{opts.danger ? "🙀" : "🐾"}</span>
          <p className="text-[14px] font-semibold text-[#c8c8d0] leading-snug">{opts.message}</p>
        </div>
        {opts.description && (
          <p className="text-[12px] text-[#6a6a74] leading-relaxed -mt-1">{opts.description}</p>
        )}
        <div className="h-px bg-[#2a2a2e]" />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handleResolve(false)}
            className="h-9 px-4 rounded-md bg-[#1c1c1f] text-[#c8c8d0] text-[12px] font-semibold border border-[#2a2a2e] hover:border-[#f5bccb] hover:text-white transition-colors duration-150"
          >
            {opts.cancelLabel ?? "CANCEL"}
          </button>
          <button
            onClick={() => handleResolve(true)}
            className={`h-9 px-4 rounded-md text-[12px] font-bold transition-colors duration-150 ${
              opts.danger
                ? "bg-[#3a1f1f] text-[#ff8888] border border-[#ff8888]/30 hover:bg-[#4a2525] hover:border-[#ff8888]/60"
                : "bg-[#f5bccb] text-[#141416] hover:bg-white"
            }`}
          >
            {opts.confirmLabel ?? "CONFIRM"}
          </button>
        </div>
      </div>
    </div>
  );
};
