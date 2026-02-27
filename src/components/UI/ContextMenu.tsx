import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type ContextMenuItem =
  | { label: string; onClick: () => void; danger?: boolean; disabled?: boolean }
  | "separator";

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const clampedX = Math.min(x, window.innerWidth - rect.width - 4);
    const clampedY = Math.min(y, window.innerHeight - rect.height - 4);
    el.style.left = `${Math.max(0, clampedX)}px`;
    el.style.top = `${Math.max(0, clampedY)}px`;
  }, [x, y]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    function handleScroll() {
      onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 bg-hub-surface shadow-win-outset py-0.5 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) =>
        item === "separator" ? (
          <div
            key={`sep-${i}`}
            className="my-0.5 mx-1 border-t border-hub-border"
          />
        ) : (
          <button
            key={item.label}
            onClick={() => {
              onClose();
              item.onClick();
            }}
            disabled={item.disabled}
            className={
              "w-full text-left px-4 py-1 text-sm " +
              (item.disabled
                ? "text-hub-text-dim cursor-default"
                : item.danger
                  ? "text-status-error hover:bg-[var(--list-hover)] hover:text-white"
                  : "text-hub-text hover:bg-[var(--list-hover)] hover:text-white")
            }
          >
            {item.label}
          </button>
        ),
      )}
    </div>,
    document.body,
  );
}
