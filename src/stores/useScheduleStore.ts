import { create } from "zustand";
import type { Schedule, NewSchedule } from "../types";
import * as api from "../lib/tauri";

interface ScheduleState {
  schedules: Map<number, Schedule[]>; // scriptId -> schedules

  loadSchedules: (scriptId: number) => Promise<void>;
  createSchedule: (schedule: NewSchedule) => Promise<Schedule>;
  deleteSchedule: (id: number, scriptId: number) => Promise<void>;
  toggleSchedule: (id: number, scriptId: number) => Promise<void>;
  getSchedulesForScript: (scriptId: number) => Schedule[];
  syncSchedules: () => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>()((set, get) => ({
  schedules: new Map(),

  loadSchedules: async (scriptId) => {
    const schedules = await api.getSchedules(scriptId);
    set((state) => {
      const map = new Map(state.schedules);
      map.set(scriptId, schedules);
      return { schedules: map };
    });
  },

  createSchedule: async (schedule) => {
    const created = await api.createSchedule(
      schedule.scriptId,
      schedule.scheduleType,
      schedule.time,
      schedule.weekday,
      schedule.intervalSeconds,
    );
    set((state) => {
      const map = new Map(state.schedules);
      const existing = map.get(schedule.scriptId) ?? [];
      map.set(schedule.scriptId, [...existing, created]);
      return { schedules: map };
    });
    return created;
  },

  deleteSchedule: async (id, scriptId) => {
    await api.deleteSchedule(id);
    set((state) => {
      const map = new Map(state.schedules);
      const existing = map.get(scriptId) ?? [];
      map.set(
        scriptId,
        existing.filter((s) => s.id !== id),
      );
      return { schedules: map };
    });
  },

  toggleSchedule: async (id, scriptId) => {
    const newEnabled = await api.toggleSchedule(id);
    set((state) => {
      const map = new Map(state.schedules);
      const existing = map.get(scriptId) ?? [];
      map.set(
        scriptId,
        existing.map((s) =>
          s.id === id ? { ...s, enabled: newEnabled } : s,
        ),
      );
      return { schedules: map };
    });
  },

  getSchedulesForScript: (scriptId) => {
    return get().schedules.get(scriptId) ?? [];
  },

  syncSchedules: async () => {
    await api.syncSchedules();
  },
}));
