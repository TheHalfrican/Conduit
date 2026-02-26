import { clsx } from "clsx";
import { useToastStore } from "../../hooks/useToast";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            "px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg border animate-in slide-in-from-right transition-all cursor-pointer",
            toast.type === "success" &&
              "bg-status-success/10 text-status-success border-status-success/30",
            toast.type === "error" &&
              "bg-status-error/10 text-status-error border-status-error/30",
          )}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
