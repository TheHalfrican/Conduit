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
          className="px-4 py-2.5 rounded-none shadow-win-outset border-none bg-hub-surface text-hub-text text-sm font-medium animate-in slide-in-from-right cursor-pointer flex items-center gap-2"
          onClick={() => removeToast(toast.id)}
        >
          {toast.type === "success" && (
            <span className="text-status-success font-bold">&#10003;</span>
          )}
          {toast.type === "error" && (
            <span className="text-status-error font-bold">&#10007;</span>
          )}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
