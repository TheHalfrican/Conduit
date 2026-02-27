import { create } from "zustand";
import type { Settings, Theme, UpdateSettings } from "../types";
import * as api from "../lib/tauri";

const THEME_CACHE_KEY = "conduit-theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_CACHE_KEY, theme);
}

interface SettingsState {
  settings: Settings | null;

  loadSettings: () => Promise<void>;
  updateSettings: (update: UpdateSettings) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  openInEditor: (scriptPath: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: null,

  loadSettings: async () => {
    try {
      const settings = await api.getSettings();
      set({ settings });
      applyTheme(settings.theme);
    } catch {
      // Settings will be created on first access
    }
  },

  updateSettings: async (update) => {
    const settings = await api.updateSettings(update);
    set({ settings });
    applyTheme(settings.theme);
  },

  setTheme: async (theme) => {
    applyTheme(theme);
    const settings = await api.updateSettings({
      editorPath: null,
      theme,
    });
    set({ settings });
  },

  openInEditor: async (scriptPath) => {
    await api.openInEditor(scriptPath);
  },
}));
