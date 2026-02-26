import { useState, useEffect } from "react";
import type { Schedule, NewSchedule } from "../../types";
import { useScheduleStore } from "../../stores/useScheduleStore";
import { useToast } from "../../hooks/useToast";
import { Button } from "../UI/Button";
import { clsx } from "clsx";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ScheduleDialogProps {
  scriptId: number;
  schedule?: Schedule;
  open: boolean;
  onClose: () => void;
}

export function ScheduleDialog({
  scriptId,
  schedule,
  open: isOpen,
  onClose,
}: ScheduleDialogProps) {
  const createSchedule = useScheduleStore((s) => s.createSchedule);
  const deleteSchedule = useScheduleStore((s) => s.deleteSchedule);
  const toast = useToast();

  const [scheduleType, setScheduleType] = useState<"daily" | "weekly" | "interval">(
    schedule?.scheduleType ?? "daily",
  );
  const [time, setTime] = useState(schedule?.time ?? "09:00");
  const [weekday, setWeekday] = useState(schedule?.weekday ?? 1);
  const [intervalSeconds, setIntervalSeconds] = useState(
    schedule?.intervalSeconds ?? 3600,
  );

  useEffect(() => {
    if (schedule) {
      setScheduleType(schedule.scheduleType);
      setTime(schedule.time ?? "09:00");
      setWeekday(schedule.weekday ?? 1);
      setIntervalSeconds(schedule.intervalSeconds ?? 3600);
    } else {
      setScheduleType("daily");
      setTime("09:00");
      setWeekday(1);
      setIntervalSeconds(3600);
    }
  }, [schedule, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: NewSchedule = {
      scriptId,
      scheduleType,
      time: scheduleType !== "interval" ? time : null,
      weekday: scheduleType === "weekly" ? weekday : null,
      intervalSeconds: scheduleType === "interval" ? intervalSeconds : null,
    };

    try {
      if (schedule) {
        // Delete old and create new (Rust backend doesn't have a full update)
        await deleteSchedule(schedule.id, scriptId);
        await createSchedule(payload);
        toast.success("Schedule updated");
      } else {
        await createSchedule(payload);
        toast.success("Schedule created");
      }
      onClose();
    } catch {
      toast.error("Failed to save schedule");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-hub-surface border border-hub-border rounded-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub-border">
          <h2 className="text-base font-semibold text-hub-text">
            {schedule ? "Edit Schedule" : "Add Schedule"}
          </h2>
          <button
            onClick={onClose}
            className="text-hub-text-dim hover:text-hub-text transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Schedule Type */}
          <div>
            <label className="block text-xs font-medium text-hub-text-dim mb-2">
              Type
            </label>
            <div className="flex gap-1 bg-hub-bg rounded-lg p-0.5 border border-hub-border">
              {(["daily", "weekly", "interval"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setScheduleType(type)}
                  className={clsx(
                    "flex-1 px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                    scheduleType === type
                      ? "bg-hub-surface text-hub-text"
                      : "text-hub-text-dim hover:text-hub-text",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Time picker for daily/weekly */}
          {scheduleType !== "interval" && (
            <div>
              <label className="block text-xs font-medium text-hub-text-dim mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-hub-bg border border-hub-border rounded-lg px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-accent"
              />
            </div>
          )}

          {/* Day picker for weekly */}
          {scheduleType === "weekly" && (
            <div>
              <label className="block text-xs font-medium text-hub-text-dim mb-2">
                Day
              </label>
              <div className="flex gap-1">
                {WEEKDAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setWeekday(i)}
                    className={clsx(
                      "flex-1 py-1.5 rounded-md text-xs font-medium transition-colors",
                      weekday === i
                        ? "bg-accent text-hub-bg"
                        : "bg-hub-bg text-hub-text-dim hover:text-hub-text border border-hub-border",
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interval picker */}
          {scheduleType === "interval" && (
            <div>
              <label className="block text-xs font-medium text-hub-text-dim mb-1">
                Interval
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={1}
                  value={Math.floor(intervalSeconds / 60)}
                  onChange={(e) =>
                    setIntervalSeconds(Math.max(60, Number(e.target.value) * 60))
                  }
                  className="w-24 bg-hub-bg border border-hub-border rounded-lg px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-accent"
                />
                <span className="text-sm text-hub-text-dim">minutes</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {schedule ? "Save" : "Create Schedule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
