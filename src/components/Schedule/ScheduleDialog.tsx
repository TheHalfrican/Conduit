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
      <div className="bg-hub-surface shadow-win-outset rounded-none w-full max-w-sm mx-4">
        <div className="win-titlebar px-2 py-1 flex items-center justify-between">
          <span className="font-bold text-white">
            {schedule ? "Edit Schedule" : "Add Schedule"}
          </span>
          <button
            onClick={onClose}
            className="bg-win-button-face shadow-win-button text-hub-text px-1.5 py-0 text-xs font-bold hover:shadow-win-button-pressed leading-tight"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          {/* Schedule Type */}
          <div>
            <label className="block text-xs font-medium text-hub-text mb-2">
              Type
            </label>
            <div className="flex gap-0.5">
              {(["daily", "weekly", "interval"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setScheduleType(type)}
                  className={clsx(
                    "flex-1 px-3 py-1 text-xs font-medium capitalize",
                    scheduleType === type
                      ? "shadow-win-button-pressed bg-hub-surface text-hub-text"
                      : "shadow-win-button bg-win-button-face text-hub-text hover:bg-hub-surface",
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
              <label className="block text-xs font-medium text-hub-text mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-white shadow-win-field rounded-none px-2 py-1.5 text-sm text-hub-text focus:outline-none"
              />
            </div>
          )}

          {/* Day picker for weekly */}
          {scheduleType === "weekly" && (
            <div>
              <label className="block text-xs font-medium text-hub-text mb-2">
                Day
              </label>
              <div className="flex gap-0.5">
                {WEEKDAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setWeekday(i)}
                    className={clsx(
                      "flex-1 py-1 text-xs font-medium",
                      weekday === i
                        ? "shadow-win-button-pressed bg-accent text-white"
                        : "shadow-win-button bg-win-button-face text-hub-text",
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
              <label className="block text-xs font-medium text-hub-text mb-1">
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
                  className="w-24 bg-white shadow-win-field rounded-none px-2 py-1.5 text-sm text-hub-text focus:outline-none"
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
