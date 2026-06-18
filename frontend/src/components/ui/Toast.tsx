import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  onClose: (id: string) => void;
}

const iconMap: Record<ToastType, string> = {
  success: 'fas fa-check-circle text-success',
  error: 'fas fa-times-circle text-red-400',
  warning: 'fas fa-exclamation-circle text-warning',
  info: 'fas fa-info-circle text-primary',
};

const borderMap: Record<ToastType, string> = {
  success: 'border-l-success',
  error: 'border-l-red-500',
  warning: 'border-l-yellow-500',
  info: 'border-l-primary',
};

export const Toast: React.FC<ToastProps> = ({ id, type, title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={`flex items-start gap-3 bg-[#121c1e] border border-white/10 border-l-4 ${borderMap[type]} rounded-lg p-4 shadow-2xl min-w-[300px] max-w-sm animate-in slide-in-from-right duration-300`}
    >
      <i className={`${iconMap[type]} text-lg mt-0.5 flex-shrink-0`}></i>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white font-navbar">{title}</p>
        {message && <p className="text-xs text-white/60 font-navbar mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
      >
        <i className="fas fa-times text-xs"></i>
      </button>
    </div>
  );
};

// ─── Toast Container ─────────────────────────────────────────────────────────
interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={onClose} />
      ))}
    </div>
  );
};

// ─── useToast hook ────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title: string, message?: string) => addToast('success', title, message),
    error: (title: string, message?: string) => addToast('error', title, message),
    warning: (title: string, message?: string) => addToast('warning', title, message),
    info: (title: string, message?: string) => addToast('info', title, message),
  };

  return { toasts, toast, removeToast };
};
