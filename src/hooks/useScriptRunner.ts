import { useCallback } from "react";
import { useRunnerStore, subscribeOutput } from "../stores/useRunnerStore";
import * as api from "../lib/tauri";

export function useScriptRunner(scriptId: number) {
  const runScript = useRunnerStore((s) => s.runScript);
  const cancelScript = useRunnerStore((s) => s.cancelScript);
  const runningScripts = useRunnerStore((s) => s.runningScripts);

  const isRunning = runningScripts.has(scriptId);

  const run = useCallback(
    async (cols?: number, rows?: number) => {
      await runScript(scriptId, cols, rows);
    },
    [scriptId, runScript],
  );

  const cancel = useCallback(async () => {
    await cancelScript(scriptId);
  }, [scriptId, cancelScript]);

  const writeInput = useCallback(
    async (data: string) => {
      await api.writeScriptInput(scriptId, data);
    },
    [scriptId],
  );

  const resize = useCallback(
    async (cols: number, rows: number) => {
      await api.resizeScriptPty(scriptId, cols, rows);
    },
    [scriptId],
  );

  const subscribe = useCallback(
    (callback: (data: string) => void) => {
      return subscribeOutput(scriptId, callback);
    },
    [scriptId],
  );

  return { run, cancel, isRunning, writeInput, resize, subscribe };
}
