import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import type { RunRecord } from "../types";
import * as api from "../lib/tauri";

// Module-level subscriber map — output goes directly to xterm.js, not React state
const outputSubscribers = new Map<number, Set<(data: string) => void>>();

export function subscribeOutput(
  scriptId: number,
  callback: (data: string) => void,
): () => void {
  let subs = outputSubscribers.get(scriptId);
  if (!subs) {
    subs = new Set();
    outputSubscribers.set(scriptId, subs);
  }
  subs.add(callback);
  return () => {
    subs!.delete(callback);
    if (subs!.size === 0) {
      outputSubscribers.delete(scriptId);
    }
  };
}

interface RunnerState {
  runningScripts: Map<number, number>; // scriptId -> runRecordId
  histories: Map<number, RunRecord[]>; // scriptId -> run history

  runScript: (scriptId: number, cols?: number, rows?: number) => Promise<void>;
  cancelScript: (scriptId: number) => Promise<void>;
  isRunning: (scriptId: number) => boolean;
  loadHistory: (scriptId: number) => Promise<void>;
  clearHistory: (scriptId: number) => Promise<void>;
  initListeners: () => Promise<() => void>;
}

export const useRunnerStore = create<RunnerState>()((set, get) => ({
  runningScripts: new Map(),
  histories: new Map(),

  runScript: async (scriptId, cols, rows) => {
    const runId = await api.runScript(scriptId, cols, rows);
    set((state) => {
      const running = new Map(state.runningScripts);
      running.set(scriptId, runId);
      return { runningScripts: running };
    });

    // Reload history so the new "running" record appears immediately
    get().loadHistory(scriptId);
  },

  cancelScript: async (scriptId) => {
    await api.cancelScript(scriptId);
  },

  isRunning: (scriptId) => {
    return get().runningScripts.has(scriptId);
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
    // Rust emits base64-encoded chunks via script-output
    const unlistenOutput = await listen<{
      scriptId: number;
      data: string;
    }>("script-output", (event) => {
      const subs = outputSubscribers.get(event.payload.scriptId);
      if (subs) {
        for (const cb of subs) {
          cb(event.payload.data);
        }
      }
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
