import { useEffect, useRef } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="bg-hub-surface shadow-win-outset rounded-none p-0 backdrop:bg-black/60 max-w-sm w-full"
      onClose={onCancel}
    >
      <div className="win-titlebar px-2 py-1">
        <span className="font-bold text-white">{title}</span>
      </div>
      <div className="p-4">
        <p className="text-sm text-hub-text">{message}</p>
      </div>
      <div className="flex justify-end gap-2 px-4 pb-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
