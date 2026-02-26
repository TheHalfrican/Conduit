import { useCallback, useMemo } from "react";
import { useRunnerStore } from "../stores/useRunnerStore";

export function useScriptRunner(scriptId: number) {
  const runScript = useRunnerStore((s) => s.runScript);
  const cancelScript = useRunnerStore((s) => s.cancelScript);
  const runningScripts = useRunnerStore((s) => s.runningScripts);
  const outputBuffers = useRunnerStore((s) => s.outputBuffers);

  const isRunning = runningScripts.has(scriptId);
  const output = useMemo(
    () => outputBuffers.get(scriptId) ?? [],
    [outputBuffers, scriptId],
  );

  const run = useCallback(async () => {
    await runScript(scriptId);
  }, [scriptId, runScript]);

  const cancel = useCallback(async () => {
    await cancelScript(scriptId);
  }, [scriptId, cancelScript]);

  return { run, cancel, isRunning, output };
}
