import { useEffect } from "react";
import { useScriptStore } from "../stores/useScriptStore";

interface ShortcutHandlers {
  onAddScript: () => void;
  onRunScript: () => void;
  onFocusSearch: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const selectScript = useScriptStore((s) => s.selectScript);
  const selectedScript = useScriptStore((s) => s.selectedScript);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === "n") {
        e.preventDefault();
        handlers.onAddScript();
      }

      if (meta && e.key === "r") {
        e.preventDefault();
        handlers.onRunScript();
      }

      if (meta && e.key === "f") {
        e.preventDefault();
        handlers.onFocusSearch();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        if (selectedScript) {
          selectScript(null);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers, selectScript, selectedScript]);
}
