import { useState, useCallback, useMemo } from "react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import type { Script } from "../types";
import type { ContextMenuItem } from "../components/UI/ContextMenu";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useScriptStore } from "../stores/useScriptStore";
import { useScriptRunner } from "./useScriptRunner";
import { useToast } from "./useToast";

export function useScriptContextMenu(script: Script) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const openInEditor = useSettingsStore((s) => s.openInEditor);
  const editorPath = useSettingsStore((s) => s.settings?.editorPath);
  const deleteScript = useScriptStore((s) => s.deleteScript);
  const { run, isRunning } = useScriptRunner(script.id);
  const toast = useToast();

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  async function handleDelete() {
    try {
      await deleteScript(script.id);
      toast.success("Script deleted");
    } catch {
      toast.error("Failed to delete script");
    }
  }

  const menuItems: ContextMenuItem[] = useMemo(
    () => [
      {
        label: "Run Script",
        disabled: isRunning,
        onClick: async () => {
          try {
            await run();
          } catch {
            toast.error("Failed to run script");
          }
        },
      },
      {
        label: "Open in Editor",
        onClick: async () => {
          if (!editorPath) {
            toast.error("Set an editor in Settings first");
            return;
          }
          try {
            await openInEditor(script.path);
          } catch {
            toast.error("Failed to open editor");
          }
        },
      },
      "separator",
      {
        label: "Edit Script",
        onClick: () => setShowEdit(true),
      },
      {
        label: "Show in Finder",
        onClick: async () => {
          try {
            await revealItemInDir(script.path);
          } catch {
            toast.error("Failed to reveal in Finder");
          }
        },
      },
      "separator",
      {
        label: "Delete",
        danger: true,
        onClick: () => setShowDelete(true),
      },
    ],
    [isRunning, editorPath, script.path, run, openInEditor, toast],
  );

  return {
    contextMenu,
    showEdit,
    setShowEdit,
    showDelete,
    setShowDelete,
    handleContextMenu,
    closeMenu,
    menuItems,
    handleDelete,
  };
}
