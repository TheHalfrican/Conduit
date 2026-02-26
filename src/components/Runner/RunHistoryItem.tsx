import { clsx } from "clsx";
import type { RunRecord } from "../../types";

interface RunHistoryItemProps {
  record: RunRecord;
}

function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "running...";
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  const diffMs = end - start;

  if (diffMs < 1000) return `${diffMs}ms`;
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins}m ${remainingSecs}s`;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RunHistoryItem({ record }: RunHistoryItemProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-hub-bg/50 transition-colors">
      <div className="flex items-center gap-3">
        <span
          className={clsx(
            "w-2 h-2 rounded-full",
            record.status === "success" && "bg-status-success",
            record.status === "error" && "bg-status-error",
            record.status === "running" && "bg-status-running animate-pulse",
            record.status === "cancelled" && "bg-hub-text-dim",
          )}
        />
        <div>
          <span className="text-xs text-hub-text">
            {formatTimestamp(record.startedAt)}
          </span>
          <span className="text-xs text-hub-text-dim ml-2">
            {formatDuration(record.startedAt, record.finishedAt)}
          </span>
        </div>
      </div>

      <div>
        {record.exitCode !== null && (
          <span
            className={clsx(
              "text-xs px-2 py-0.5 rounded-full font-mono",
              record.exitCode === 0
                ? "bg-status-success/10 text-status-success"
                : "bg-status-error/10 text-status-error",
            )}
          >
            exit {record.exitCode}
          </span>
        )}
        {record.status === "running" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-status-running/10 text-status-running">
            running
          </span>
        )}
        {record.status === "cancelled" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-hub-text-dim/10 text-hub-text-dim">
            cancelled
          </span>
        )}
      </div>
    </div>
  );
}
