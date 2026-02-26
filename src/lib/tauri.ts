import { invoke } from "@tauri-apps/api/core";
import type {
  Script,
  Category,
  RunRecord,
  Schedule,
  NewScript,
  UpdateScript,
} from "../types";

// Script commands
export async function addScript(script: NewScript): Promise<Script> {
  return invoke("add_script", { script });
}

export async function getScripts(
  categoryId?: number | null,
): Promise<Script[]> {
  return invoke("get_scripts", { categoryId: categoryId ?? null });
}

export async function updateScript(
  id: number,
  update: UpdateScript,
): Promise<Script> {
  return invoke("update_script", { id, update });
}

export async function deleteScript(id: number): Promise<void> {
  return invoke("delete_script", { id });
}

// Category commands
export async function getCategories(): Promise<Category[]> {
  return invoke("get_categories");
}

export async function addCategory(
  name: string,
  color: string,
): Promise<Category> {
  return invoke("add_category", { name, color });
}

export async function updateCategory(
  id: number,
  name: string,
  color: string,
): Promise<Category> {
  return invoke("update_category", { id, name, color });
}

export async function deleteCategory(id: number): Promise<void> {
  return invoke("delete_category", { id });
}

export async function reorderCategories(ids: number[]): Promise<void> {
  return invoke("reorder_categories", { ids });
}

// Runner commands
export async function runScript(scriptId: number): Promise<number> {
  return invoke("run_script", { scriptId });
}

export async function cancelScript(scriptId: number): Promise<void> {
  return invoke("cancel_script", { scriptId });
}

export async function isScriptRunning(scriptId: number): Promise<boolean> {
  return invoke("is_script_running", { scriptId });
}

// History commands
export async function getRunHistory(
  scriptId: number,
  limit?: number,
): Promise<RunRecord[]> {
  return invoke("get_run_history", { scriptId, limit: limit ?? null });
}

export async function getLatestRun(
  scriptId: number,
): Promise<RunRecord | null> {
  return invoke("get_latest_run", { scriptId });
}

export async function clearHistory(scriptId: number): Promise<void> {
  return invoke("clear_history", { scriptId });
}

// Schedule commands
export async function createSchedule(
  scriptId: number,
  scheduleType: string,
  time: string | null,
  weekday: number | null,
  intervalSeconds: number | null,
): Promise<Schedule> {
  return invoke("create_schedule", {
    scriptId,
    scheduleType,
    time,
    weekday,
    intervalSeconds,
  });
}

export async function updateSchedule(
  scheduleId: number,
  enabled: boolean,
): Promise<void> {
  return invoke("update_schedule", { scheduleId, enabled });
}

export async function deleteSchedule(scheduleId: number): Promise<void> {
  return invoke("delete_schedule", { scheduleId });
}

export async function toggleSchedule(scheduleId: number): Promise<boolean> {
  return invoke("toggle_schedule", { scheduleId });
}

export async function getSchedules(scriptId: number): Promise<Schedule[]> {
  return invoke("get_schedules", { scriptId });
}

export async function syncSchedules(): Promise<void> {
  return invoke("sync_schedules");
}
