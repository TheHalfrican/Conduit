import { useEffect, useRef, useState, useCallback } from "react";
import { Sidebar } from "./components/Layout/Sidebar";
import { TopBar } from "./components/Layout/TopBar";
import { MainContent } from "./components/Layout/MainContent";
import { AddScriptDialog } from "./components/Scripts/AddScriptDialog";
import { ToastContainer } from "./components/UI/Toast";
import { ErrorBoundary } from "./components/UI/ErrorBoundary";
import { useScriptStore } from "./stores/useScriptStore";
import { useCategoryStore } from "./stores/useCategoryStore";
import { useRunnerStore } from "./stores/useRunnerStore";
import { useScheduleStore } from "./stores/useScheduleStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export default function App() {
  const loadScripts = useScriptStore((s) => s.loadScripts);
  const selectedScript = useScriptStore((s) => s.selectedScript);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const initListeners = useRunnerStore((s) => s.initListeners);
  const runScript = useRunnerStore((s) => s.runScript);
  const syncSchedules = useScheduleStore((s) => s.syncSchedules);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize data on mount
  useEffect(() => {
    loadCategories();
    loadScripts();
    syncSchedules();
    loadSettings();

    const cleanupPromise = initListeners();
    return () => {
      cleanupPromise.then((cleanup) => cleanup());
    };
  }, [loadCategories, loadScripts, syncSchedules, loadSettings, initListeners]);

  const handleAddScript = useCallback(() => {
    setShowAddDialog(true);
  }, []);

  const handleRunScript = useCallback(() => {
    if (selectedScript) {
      runScript(selectedScript.id);
    }
  }, [selectedScript, runScript]);

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  useKeyboardShortcuts({
    onAddScript: handleAddScript,
    onRunScript: handleRunScript,
    onFocusSearch: handleFocusSearch,
  });

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-hub-bg shadow-win-outset">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar onAddScript={handleAddScript} searchInputRef={searchInputRef} />
            <MainContent onAddScript={handleAddScript} />
          </div>
        </div>

        <AddScriptDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
        />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
