import { useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";
import { Button } from "../UI/Button";
import { useToast } from "../../hooks/useToast";

interface OutputLine {
  text: string;
  stream: "stdout" | "stderr";
  timestamp: number;
}

interface TerminalOutputProps {
  lines: OutputLine[];
}

export function TerminalOutput({ lines }: TerminalOutputProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 20,
  });

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (lines.length > 0) {
      virtualizer.scrollToIndex(lines.length - 1, { align: "end" });
    }
  }, [lines.length, virtualizer]);

  const handleCopy = useCallback(async () => {
    const text = lines.map((l) => l.text).join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Output copied");
  }, [lines, toast]);

  if (lines.length === 0) {
    return (
      <div className="bg-hub-bg border border-hub-border rounded-lg p-4 h-64 flex items-center justify-center">
        <span className="text-sm text-hub-text-dim">
          No output yet. Run the script to see output here.
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button size="sm" variant="ghost" onClick={handleCopy}>
          Copy
        </Button>
      </div>
      <div
        ref={parentRef}
        className="bg-hub-bg border border-hub-border rounded-lg h-64 overflow-auto font-mono text-xs terminal-scroll"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const line = lines[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className={clsx(
                  "px-3 py-0.5 whitespace-pre-wrap break-all",
                  line.stream === "stderr"
                    ? "text-status-error"
                    : "text-hub-text",
                )}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
