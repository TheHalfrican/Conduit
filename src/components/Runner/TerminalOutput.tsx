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
  isRunning?: boolean;
}

export function TerminalOutput({ lines, isRunning }: TerminalOutputProps) {
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
      <div className="bg-black shadow-win-inset rounded-none p-4 h-64 flex items-center justify-center">
        {isRunning ? (
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#00ff41]">Running...</span>
          </div>
        ) : (
          <span className="text-sm text-[#808080]">
            No output yet. Run the script to see output here.
          </span>
        )}
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
        className="bg-black shadow-win-inset rounded-none h-64 overflow-auto font-mono text-xs terminal-scroll"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize() + (isRunning ? 24 : 0)}px`,
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
                    : "text-[#00ff41]",
                )}
              >
                {line.text}
              </div>
            );
          })}
          {isRunning && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "20px",
                transform: `translateY(${virtualizer.getTotalSize()}px)`,
              }}
              className="px-3 py-0.5 flex items-center gap-2"
            >
              <span className="inline-block w-3 h-3 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#00ff41] text-xs animate-pulse">
                running...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
