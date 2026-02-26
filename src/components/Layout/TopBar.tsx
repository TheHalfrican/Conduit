import { clsx } from "clsx";
import { useScriptStore } from "../../stores/useScriptStore";
import { Button } from "../UI/Button";

interface TopBarProps {
  onAddScript: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function TopBar({ onAddScript, searchInputRef }: TopBarProps) {
  const searchQuery = useScriptStore((s) => s.searchQuery);
  const setSearchQuery = useScriptStore((s) => s.setSearchQuery);
  const viewMode = useScriptStore((s) => s.viewMode);
  const setViewMode = useScriptStore((s) => s.setViewMode);

  return (
    <header className="h-14 bg-hub-surface border-b border-hub-border flex items-center gap-3 px-4 shrink-0">
      <div className="relative flex-1 max-w-sm">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-dim"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search scripts... (Cmd+F)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-hub-bg border border-hub-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-hub-text placeholder:text-hub-text-dim focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="flex items-center gap-1 bg-hub-bg rounded-lg p-0.5 border border-hub-border">
        <button
          onClick={() => setViewMode("card")}
          className={clsx(
            "px-2.5 py-1 rounded-md text-xs transition-colors",
            viewMode === "card"
              ? "bg-hub-surface text-hub-text"
              : "text-hub-text-dim hover:text-hub-text",
          )}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={clsx(
            "px-2.5 py-1 rounded-md text-xs transition-colors",
            viewMode === "list"
              ? "bg-hub-surface text-hub-text"
              : "text-hub-text-dim hover:text-hub-text",
          )}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <Button onClick={onAddScript}>+ Add Script</Button>
    </header>
  );
}
