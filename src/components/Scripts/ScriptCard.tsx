import { clsx } from "clsx";
import type { Script } from "../../types";
import { useScriptStore } from "../../stores/useScriptStore";
import { useCategoryStore } from "../../stores/useCategoryStore";
import { useRunnerStore } from "../../stores/useRunnerStore";
import { useScheduleStore } from "../../stores/useScheduleStore";
import { useScriptRunner } from "../../hooks/useScriptRunner";
import { useToast } from "../../hooks/useToast";
import { Button } from "../UI/Button";
import { ScheduleIndicator } from "../Schedule/ScheduleIndicator";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface ScriptCardProps {
  script: Script;
}

function ScriptCard({ script }: ScriptCardProps) {
  const selectScript = useScriptStore((s) => s.selectScript);
  const categories = useCategoryStore((s) => s.categories);
  const histories = useRunnerStore((s) => s.histories);
  const schedulesMap = useScheduleStore((s) => s.schedules);
  const schedules = schedulesMap.get(script.id) ?? [];
  const { run, isRunning } = useScriptRunner(script.id);
  const toast = useToast();

  const category = categories.find((c) => c.id === script.categoryId);
  const history = histories.get(script.id);
  const lastRun = history?.[0] ?? null;

  const statusColor = lastRun
    ? {
        success: "text-status-success",
        error: "text-status-error",
        running: "text-status-running",
        cancelled: "text-hub-text-dim",
      }[lastRun.status]
    : null;

  async function handleRun(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await run();
    } catch {
      toast.error("Failed to run script");
    }
  }

  return (
    <div
      onClick={() => selectScript(script)}
      className="bg-hub-surface shadow-win-outset rounded-none p-3 hover:bg-[#d4d0c8] active:shadow-win-inset cursor-pointer group relative"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3 h-3 rounded-none shrink-0"
            style={{ backgroundColor: script.color }}
          />
          <h3 className="text-sm font-semibold text-hub-text truncate">
            {script.name}
          </h3>
        </div>
        {schedules.length > 0 && <ScheduleIndicator schedules={schedules} />}
      </div>

      {category && (
        <span
          className="inline-block text-xs px-2 py-0.5 rounded-none mb-2 border border-hub-border"
          style={{
            color: category.color,
          }}
        >
          {category.name}
        </span>
      )}

      {script.description && (
        <p className="text-xs text-hub-text-dim line-clamp-2 mb-3">
          {script.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-hub-border">
        <div className="flex items-center gap-2">
          {lastRun && (
            <>
              <span className={clsx("text-xs", statusColor)}>
                {lastRun.status === "success"
                  ? "Passed"
                  : lastRun.status === "error"
                    ? "Failed"
                    : lastRun.status === "running"
                      ? "Running"
                      : "Cancelled"}
              </span>
              <span className="text-xs text-hub-text-dim">
                {formatRelativeTime(lastRun.startedAt)}
              </span>
            </>
          )}
          {!lastRun && (
            <span className="text-xs text-hub-text-dim">Never run</span>
          )}
        </div>

        <Button
          size="sm"
          variant={isRunning ? "secondary" : "primary"}
          onClick={handleRun}
          disabled={isRunning}
        >
          {isRunning ? "Running..." : "Run"}
        </Button>
      </div>
    </div>
  );
}

interface ScriptGridProps {
  scripts: Script[];
}

export function ScriptGrid({ scripts }: ScriptGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
      {scripts.map((script) => (
        <ScriptCard key={script.id} script={script} />
      ))}
    </div>
  );
}

export { ScriptCard };
