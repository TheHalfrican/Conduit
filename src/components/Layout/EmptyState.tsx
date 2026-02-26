import { Button } from "../UI/Button";

interface EmptyStateProps {
  onAddScript: () => void;
}

export function EmptyState({ onAddScript }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-none bg-hub-surface shadow-win-outset flex items-center justify-center">
          <svg
            className="w-8 h-8 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-hub-text mb-1">
          Welcome to Conduit
        </h2>
        <p className="text-sm text-hub-text-dim mb-6">
          Manage, run, and schedule your shell scripts from one place. Add your
          first script to get started.
        </p>
        <Button onClick={onAddScript} size="lg">
          + Add Your First Script
        </Button>
        <p className="text-xs text-hub-text-dim mt-3">
          Or press Cmd+N to add a script
        </p>
      </div>
    </div>
  );
}
