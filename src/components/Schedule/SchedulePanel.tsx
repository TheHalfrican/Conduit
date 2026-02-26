import { useState, useEffect } from "react";
import { useScheduleStore } from "../../stores/useScheduleStore";
import { useToast } from "../../hooks/useToast";
import { Button } from "../UI/Button";
import { ScheduleDialog } from "./ScheduleDialog";
import { ConfirmDialog } from "../UI/ConfirmDialog";
import type { Schedule } from "../../types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatScheduleDescription(schedule: Schedule): string {
  if (schedule.scheduleType === "daily" && schedule.time) {
    return `Daily at ${schedule.time}`;
  }
  if (schedule.scheduleType === "weekly" && schedule.time && schedule.weekday !== null) {
    return `${WEEKDAYS[schedule.weekday]}s at ${schedule.time}`;
  }
  if (schedule.scheduleType === "interval" && schedule.intervalSeconds) {
    const mins = Math.floor(schedule.intervalSeconds / 60);
    if (mins < 60) return `Every ${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return remainMins > 0 ? `Every ${hours}h ${remainMins}m` : `Every ${hours}h`;
  }
  return schedule.scheduleType;
}

interface SchedulePanelProps {
  scriptId: number;
}

export function SchedulePanel({ scriptId }: SchedulePanelProps) {
  const loadSchedules = useScheduleStore((s) => s.loadSchedules);
  const toggleSchedule = useScheduleStore((s) => s.toggleSchedule);
  const deleteSchedule = useScheduleStore((s) => s.deleteSchedule);
  const schedulesMap = useScheduleStore((s) => s.schedules);
  const schedules = schedulesMap.get(scriptId) ?? [];
  const toast = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

  useEffect(() => {
    loadSchedules(scriptId);
  }, [scriptId, loadSchedules]);

  async function handleToggle(schedule: Schedule) {
    try {
      await toggleSchedule(schedule.id, scriptId);
    } catch {
      toast.error("Failed to toggle schedule");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSchedule(deleteTarget.id, scriptId);
      toast.success("Schedule deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete schedule");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-hub-text">Schedules</h3>
        <Button size="sm" variant="ghost" onClick={() => setShowAdd(true)}>
          + Add
        </Button>
      </div>

      {schedules.length === 0 ? (
        <p className="text-xs text-hub-text-dim py-4 text-center">
          No schedules. Add one to run this script automatically.
        </p>
      ) : (
        <div className="space-y-1">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-hub-surface border border-hub-border/50 group"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(schedule)}
                  className={`relative w-8 h-4 rounded-full transition-colors ${
                    schedule.enabled ? "bg-accent" : "bg-hub-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                      schedule.enabled ? "left-4" : "left-0.5"
                    }`}
                  />
                </button>
                <span className="text-sm text-hub-text">
                  {formatScheduleDescription(schedule)}
                </span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditSchedule(schedule)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(schedule)}
                >
                  <span className="text-status-error">Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScheduleDialog
        scriptId={scriptId}
        open={showAdd}
        onClose={() => setShowAdd(false)}
      />

      {editSchedule && (
        <ScheduleDialog
          scriptId={scriptId}
          schedule={editSchedule}
          open={!!editSchedule}
          onClose={() => setEditSchedule(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
