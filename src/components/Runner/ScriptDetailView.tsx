import { useState, useEffect } from "react";
import type { Script } from "../../types";
import { useScriptStore } from "../../stores/useScriptStore";
import { useCategoryStore } from "../../stores/useCategoryStore";
import { useRunnerStore } from "../../stores/useRunnerStore";
import { useScriptRunner } from "../../hooks/useScriptRunner";
import { useToast } from "../../hooks/useToast";
import { Button } from "../UI/Button";
import { ConfirmDialog } from "../UI/ConfirmDialog";
import { TerminalOutput } from "./TerminalOutput";
import { RunHistoryItem } from "./RunHistoryItem";
import { SchedulePanel } from "../Schedule/SchedulePanel";
import { EditScriptDialog } from "../Scripts/EditScriptDialog";

interface ScriptDetailViewProps {
  script: Script;
}

export function ScriptDetailView({ script }: ScriptDetailViewProps) {
  const selectScript = useScriptStore((s) => s.selectScript);
  const deleteScript = useScriptStore((s) => s.deleteScript);
  const categories = useCategoryStore((s) => s.categories);
  const loadHistory = useRunnerStore((s) => s.loadHistory);
  const clearHistory = useRunnerStore((s) => s.clearHistory);
  const histories = useRunnerStore((s) => s.histories);
  const { run, cancel, isRunning, output } = useScriptRunner(script.id);
  const toast = useToast();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const category = categories.find((c) => c.id === script.categoryId);
  const history = histories.get(script.id) ?? [];

  useEffect(() => {
    loadHistory(script.id);
  }, [script.id, loadHistory]);

  async function handleRun() {
    try {
      await run();
    } catch {
      toast.error("Failed to run script");
    }
  }

  async function handleCancel() {
    try {
      await cancel();
    } catch {
      toast.error("Failed to cancel script");
    }
  }

  async function handleDelete() {
    try {
      await deleteScript(script.id);
      toast.success("Script deleted");
    } catch {
      toast.error("Failed to delete script");
    }
  }

  async function handleClearHistory() {
    try {
      await clearHistory(script.id);
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-hub-bg/95 backdrop-blur-sm border-b border-hub-border px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => selectScript(null)}
              className="text-hub-text-dim hover:text-hub-text transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: script.color }}
            />
            <h2 className="text-lg font-semibold text-hub-text">
              {script.name}
            </h2>
            {category && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: category.color + "20",
                  color: category.color,
                }}
              >
                {category.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEdit(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              Delete
            </Button>
            {isRunning ? (
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            ) : (
              <Button onClick={handleRun}>Run Script</Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Script Info */}
        <div className="space-y-2">
          {script.description && (
            <p className="text-sm text-hub-text-dim">{script.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-hub-text-dim">
            <span className="font-mono bg-hub-surface px-2 py-1 rounded">
              {script.path}
            </span>
            {!script.isExecutable && (
              <span className="text-status-error">Not executable</span>
            )}
          </div>
        </div>

        {/* Terminal Output */}
        <div>
          <h3 className="text-sm font-medium text-hub-text mb-2">Output</h3>
          <TerminalOutput lines={output} />
        </div>

        {/* Schedule Panel */}
        <SchedulePanel scriptId={script.id} />

        {/* Run History */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-hub-text">Run History</h3>
            {history.length > 0 && (
              <Button size="sm" variant="ghost" onClick={handleClearHistory}>
                Clear
              </Button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-hub-text-dim py-4 text-center">
              No run history yet
            </p>
          ) : (
            <div className="space-y-0.5">
              {history.map((record) => (
                <RunHistoryItem key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <EditScriptDialog
        script={script}
        open={showEdit}
        onClose={() => setShowEdit(false)}
      />
      <ConfirmDialog
        open={showDelete}
        title="Delete Script"
        message={`Are you sure you want to delete "${script.name}"? This will also remove all run history and schedules.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
