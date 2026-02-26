import { create } from "zustand";
import type { Category } from "../types";
import * as api from "../lib/tauri";

interface CategoryState {
  categories: Category[];
  loading: boolean;

  loadCategories: () => Promise<void>;
  addCategory: (name: string, color: string) => Promise<Category>;
  updateCategory: (id: number, name: string, color: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  reorderCategories: (ids: number[]) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>()((set) => ({
  categories: [],
  loading: false,

  loadCategories: async () => {
    set({ loading: true });
    try {
      const categories = await api.getCategories();
      set({ categories, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addCategory: async (name, color) => {
    const created = await api.addCategory(name, color);
    set((state) => ({ categories: [...state.categories, created] }));
    return created;
  },

  updateCategory: async (id, name, color) => {
    const updated = await api.updateCategory(id, name, color);
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? updated : c)),
    }));
  },

  deleteCategory: async (id) => {
    await api.deleteCategory(id);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },

  reorderCategories: async (ids) => {
    await api.reorderCategories(ids);
    set((state) => {
      const reordered = ids
        .map((id, index) => {
          const cat = state.categories.find((c) => c.id === id);
          return cat ? { ...cat, sortOrder: index } : null;
        })
        .filter((c): c is Category => c !== null);
      return { categories: reordered };
    });
  },
}));
