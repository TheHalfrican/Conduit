import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import type { RunRecord } from "../types";
import * as api from "../lib/tauri";

interface OutputLine {
  text: string;
  stream: "stdout" | "stderr";
  timestamp: number;
}

interface RunnerState {
  runningScripts: Map<number, number>; // scriptId -> runRecordId
  outputBuffers: Map<number, OutputLine[]>; // scriptId -> output lines
  histories: Map<number, RunRecord[]>; // scriptId -> run history

  runScript: (scriptId: number) => Promise<void>;
  cancelScript: (scriptId: number) => Promise<void>;
  isRunning: (scriptId: number) => boolean;
  getOutput: (scriptId: number) => OutputLine[];
  loadHistory: (scriptId: number) => Promise<void>;
  clearHistory: (scriptId: number) => Promise<void>;
  initListeners: () => Promise<() => void>;
}

export const useRunnerStore = create<RunnerState>()((set, get) => ({
  runningScripts: new Map(),
  outputBuffers: new Map(),
  histories: new Map(),

  runScript: async (scriptId) => {
    // Clear previous output
    set((state) => {
      const buffers = new Map(state.outputBuffers);
      buffers.set(scriptId, []);
      return { outputBuffers: buffers };
    });

    const runId = await api.runScript(scriptId);
    set((state) => {
      const running = new Map(state.runningScripts);
      running.set(scriptId, runId);
      return { runningScripts: running };
    });
  },

  cancelScript: async (scriptId) => {
    await api.cancelScript(scriptId);
  },

  isRunning: (scriptId) => {
    return get().runningScripts.has(scriptId);
  },

  getOutput: (scriptId) => {
    return get().outputBuffers.get(scriptId) ?? [];
  },

  loadHistory: async (scriptId) => {
    const history = await api.getRunHistory(scriptId);
    set((state) => {
      const histories = new Map(state.histories);
      histories.set(scriptId, history);
      return { histories };
    });
  },

  clearHistory: async (scriptId) => {
    await api.clearHistory(scriptId);
    set((state) => {
      const histories = new Map(state.histories);
      histories.set(scriptId, []);
      return { histories };
    });
  },

  initListeners: async () => {
    // Rust emits camelCase due to #[serde(rename_all = "camelCase")]
    const unlistenOutput = await listen<{
      scriptId: number;
      line: string;
      stream: "stdout" | "stderr";
    }>("script-output", (event) => {
      set((state) => {
        const buffers = new Map(state.outputBuffers);
        const lines = buffers.get(event.payload.scriptId) ?? [];
        buffers.set(event.payload.scriptId, [
          ...lines,
          {
            text: event.payload.line,
            stream: event.payload.stream,
            timestamp: Date.now(),
          },
        ]);
        return { outputBuffers: buffers };
      });
    });

    const unlistenFinished = await listen<{
      scriptId: number;
      exitCode: number;
      recordId: number;
    }>("script-finished", (event) => {
      set((state) => {
        const running = new Map(state.runningScripts);
        running.delete(event.payload.scriptId);
        return { runningScripts: running };
      });

      // Reload history for this script to get the updated record
      get().loadHistory(event.payload.scriptId);
    });

    return () => {
      unlistenOutput();
      unlistenFinished();
    };
  },
}));
