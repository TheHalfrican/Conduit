export interface Script {
  id: number;
  name: string;
  path: string;
  description: string | null;
  categoryId: number;
  color: string;
  isExecutable: boolean;
  runAsAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
}

export interface RunRecord {
  id: number;
  scriptId: number;
  startedAt: string;
  finishedAt: string | null;
  exitCode: number | null;
  output: string | null;
  status: "running" | "success" | "error" | "cancelled";
}

export interface Schedule {
  id: number;
  scriptId: number;
  scheduleType: "daily" | "weekly" | "interval";
  time: string | null;
  weekday: number | null;
  intervalSeconds: number | null;
  enabled: boolean;
  plistLabel: string;
  createdAt: string;
}

export interface NewScript {
  name: string;
  path: string;
  description: string | null;
  categoryId: number;
  color: string;
  runAsAdmin: boolean;
}

export interface UpdateScript {
  name: string | null;
  path: string | null;
  description: string | null;
  categoryId: number | null;
  color: string | null;
  runAsAdmin: boolean | null;
}

export interface NewSchedule {
  scriptId: number;
  scheduleType: "daily" | "weekly" | "interval";
  time: string | null;
  weekday: number | null;
  intervalSeconds: number | null;
}

export interface Settings {
  id: number;
  editorPath: string;
}

export interface UpdateSettings {
  editorPath: string | null;
}
