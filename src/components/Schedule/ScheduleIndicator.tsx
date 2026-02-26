import type { Schedule } from "../../types";

interface ScheduleIndicatorProps {
  schedules: Schedule[];
}

export function ScheduleIndicator({ schedules }: ScheduleIndicatorProps) {
  const activeCount = schedules.filter((s) => s.enabled).length;
  if (activeCount === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-status-scheduled" title={`${activeCount} active schedule${activeCount > 1 ? "s" : ""}`}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {activeCount > 1 && (
        <span className="text-xs font-medium">{activeCount}</span>
      )}
    </span>
  );
}
