import { useMemo } from "react";
import { useScriptStore } from "../../stores/useScriptStore";
import { ScriptGrid } from "../Scripts/ScriptCard";
import { ScriptList } from "../Scripts/ScriptList";
import { ScriptDetailView } from "../Runner/ScriptDetailView";
import { EmptyState } from "./EmptyState";

interface MainContentProps {
  onAddScript: () => void;
}

export function MainContent({ onAddScript }: MainContentProps) {
  const scripts = useScriptStore((s) => s.scripts);
  const selectedScript = useScriptStore((s) => s.selectedScript);
  const viewMode = useScriptStore((s) => s.viewMode);
  const searchQuery = useScriptStore((s) => s.searchQuery);
  const activeCategory = useScriptStore((s) => s.activeCategory);

  const filtered = useMemo(() => {
    let result = scripts;
    if (activeCategory !== null) {
      result = result.filter((s) => s.categoryId === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [scripts, searchQuery, activeCategory]);

  if (selectedScript) {
    return <ScriptDetailView script={selectedScript} />;
  }

  if (scripts.length === 0) {
    return <EmptyState onAddScript={onAddScript} />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white shadow-win-inset m-1 p-2">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-hub-text-dim text-sm">
            No scripts match your search
          </div>
        ) : viewMode === "card" ? (
          <ScriptGrid scripts={filtered} />
        ) : (
          <ScriptList scripts={filtered} />
        )}
      </div>
    </div>
  );
}
