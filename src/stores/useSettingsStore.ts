import { create } from "zustand";
import type { Settings, UpdateSettings } from "../types";
import * as api from "../lib/tauri";

interface SettingsState {
  settings: Settings | null;

  loadSettings: () => Promise<void>;
  updateSettings: (update: UpdateSettings) => Promise<void>;
  openInEditor: (scriptPath: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: null,

  loadSettings: async () => {
    try {
      const settings = await api.getSettings();
      set({ settings });
    } catch {
      // Settings will be created on first access
    }
  },

  updateSettings: async (update) => {
    const settings = await api.updateSettings(update);
    set({ settings });
  },

  openInEditor: async (scriptPath) => {
    await api.openInEditor(scriptPath);
  },
}));
