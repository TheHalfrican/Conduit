import { create } from "zustand";
import type { Script, NewScript, UpdateScript } from "../types";
import * as api from "../lib/tauri";

interface ScriptState {
  scripts: Script[];
  selectedScript: Script | null;
  searchQuery: string;
  activeCategory: number | null;
  viewMode: "card" | "list";
  loading: boolean;

  // Computed
  filteredScripts: () => Script[];

  // Actions
  loadScripts: () => Promise<void>;
  addScript: (script: NewScript) => Promise<Script>;
  updateScript: (id: number, updates: UpdateScript) => Promise<void>;
  deleteScript: (id: number) => Promise<void>;
  selectScript: (script: Script | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (categoryId: number | null) => void;
  setViewMode: (mode: "card" | "list") => void;
}

export const useScriptStore = create<ScriptState>()((set, get) => ({
  scripts: [],
  selectedScript: null,
  searchQuery: "",
  activeCategory: null,
  viewMode: "card",
  loading: false,

  filteredScripts: () => {
    const { scripts, searchQuery, activeCategory } = get();
    let filtered = scripts;

    if (activeCategory !== null) {
      filtered = filtered.filter((s) => s.categoryId === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)),
      );
    }

    return filtered;
  },

  loadScripts: async () => {
    set({ loading: true });
    try {
      const scripts = await api.getScripts();
      set({ scripts, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addScript: async (script) => {
    const created = await api.addScript(script);
    set((state) => ({ scripts: [...state.scripts, created] }));
    return created;
  },

  updateScript: async (id, updates) => {
    const updated = await api.updateScript(id, updates);
    set((state) => ({
      scripts: state.scripts.map((s) => (s.id === id ? updated : s)),
      selectedScript:
        state.selectedScript?.id === id ? updated : state.selectedScript,
    }));
  },

  deleteScript: async (id) => {
    await api.deleteScript(id);
    set((state) => ({
      scripts: state.scripts.filter((s) => s.id !== id),
      selectedScript:
        state.selectedScript?.id === id ? null : state.selectedScript,
    }));
  },

  selectScript: (script) => set({ selectedScript: script }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveCategory: (categoryId) => set({ activeCategory: categoryId }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
