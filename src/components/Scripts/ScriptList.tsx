import { clsx } from "clsx";
import type { Script } from "../../types";
import { useScriptStore } from "../../stores/useScriptStore";
import { useCategoryStore } from "../../stores/useCategoryStore";
import { useRunnerStore } from "../../stores/useRunnerStore";
import { useScriptRunner } from "../../hooks/useScriptRunner";
import { useScriptContextMenu } from "../../hooks/useScriptContextMenu";
import { useToast } from "../../hooks/useToast";
import { Button } from "../UI/Button";
import { ContextMenu } from "../UI/ContextMenu";
import { ConfirmDialog } from "../UI/ConfirmDialog";
import { EditScriptDialog } from "./EditScriptDialog";

function ScriptRow({ script }: { script: Script }) {
  const selectScript = useScriptStore((s) => s.selectScript);
  const categories = useCategoryStore((s) => s.categories);
  const histories = useRunnerStore((s) => s.histories);
  const { run, isRunning } = useScriptRunner(script.id);
  const toast = useToast();
  const ctx = useScriptContextMenu(script);

  const category = categories.find((c) => c.id === script.categoryId);
  const history = histories.get(script.id);
  const lastRun = history?.[0] ?? null;

  async function handleRun(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await run();
    } catch {
      toast.error("Failed to run script");
    }
  }

  return (
    <tr
      onClick={() => selectScript(script)}
      onContextMenu={ctx.handleContextMenu}
      className="border-b border-hub-border hover:bg-accent hover:text-white cursor-pointer"
    >
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-none shrink-0"
            style={{ backgroundColor: script.color }}
          />
          <span className="text-sm font-medium truncate">
            {script.name}
          </span>
        </div>
      </td>
      <td className="py-2 px-3">
        {category && (
          <span
            className="text-xs px-2 py-0.5 rounded-none border border-hub-border"
            style={{
              color: category.color,
            }}
          >
            {category.name}
          </span>
        )}
      </td>
      <td className="py-2 px-3">
        {lastRun ? (
          <span
            className={clsx(
              "text-xs",
              lastRun.status === "success" && "text-status-success",
              lastRun.status === "error" && "text-status-error",
              lastRun.status === "running" && "text-status-running",
              lastRun.status === "cancelled" && "text-hub-text-dim",
            )}
          >
            {lastRun.status}
          </span>
        ) : (
          <span className="text-xs text-hub-text-dim">--</span>
        )}
      </td>
      <td className="py-2 px-3 text-right">
        <Button
          size="sm"
          variant={isRunning ? "secondary" : "primary"}
          onClick={handleRun}
          disabled={isRunning}
        >
          {isRunning ? "Running..." : "Run"}
        </Button>
      </td>

      {ctx.contextMenu && (
        <ContextMenu
          x={ctx.contextMenu.x}
          y={ctx.contextMenu.y}
          items={ctx.menuItems}
          onClose={ctx.closeMenu}
        />
      )}
      <EditScriptDialog
        script={script}
        open={ctx.showEdit}
        onClose={() => ctx.setShowEdit(false)}
      />
      <ConfirmDialog
        open={ctx.showDelete}
        title="Delete Script"
        message={`Are you sure you want to delete "${script.name}"? This will also remove all run history and schedules.`}
        onConfirm={ctx.handleDelete}
        onCancel={() => ctx.setShowDelete(false)}
      />
    </tr>
  );
}

interface ScriptListProps {
  scripts: Script[];
}

export function ScriptList({ scripts }: ScriptListProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-hub-border text-left">
          <th className="py-1.5 px-3 text-xs font-medium text-hub-text shadow-win-button bg-win-button-face">
            Name
          </th>
          <th className="py-1.5 px-3 text-xs font-medium text-hub-text shadow-win-button bg-win-button-face">
            Category
          </th>
          <th className="py-1.5 px-3 text-xs font-medium text-hub-text shadow-win-button bg-win-button-face">
            Status
          </th>
          <th className="py-1.5 px-3 text-xs font-medium text-hub-text shadow-win-button bg-win-button-face text-right">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {scripts.map((script) => (
          <ScriptRow key={script.id} script={script} />
        ))}
      </tbody>
    </table>
  );
}
