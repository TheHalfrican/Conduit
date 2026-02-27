import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { useToast } from "../../hooks/useToast";
import { Button } from "./Button";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open: isOpen, onClose }: SettingsDialogProps) {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const toast = useToast();

  const [editorPath, setEditorPath] = useState("");

  useEffect(() => {
    if (isOpen && settings) {
      setEditorPath(settings.editorPath);
    }
  }, [isOpen, settings]);

  async function handleBrowse() {
    try {
      const selected = await open({
        filters: [
          { name: "Applications", extensions: ["app", "exe"] },
          { name: "All Files", extensions: ["*"] },
        ],
        multiple: false,
      });

      if (typeof selected === "string") {
        setEditorPath(selected);
      }
    } catch (err) {
      console.error("File picker error:", err);
    }
  }

  async function handleSave() {
    try {
      await updateSettings({ editorPath: editorPath.trim() });
      toast.success("Settings saved");
      onClose();
    } catch {
      toast.error("Failed to save settings");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-hub-surface shadow-win-outset rounded-none w-full max-w-md mx-4">
        <div className="win-titlebar px-2 py-1 flex items-center justify-between">
          <span className="font-bold text-white">Settings</span>
          <button
            onClick={onClose}
            className="bg-win-button-face shadow-win-button text-hub-text px-1.5 py-0 text-xs font-bold hover:shadow-win-button-pressed leading-tight"
          >
            X
          </button>
        </div>

        <div className="p-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-hub-text mb-1">
              Editor Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editorPath}
                onChange={(e) => setEditorPath(e.target.value)}
                placeholder="e.g. code, notepad++, /usr/local/bin/code"
                className="flex-1 bg-white shadow-win-field rounded-none px-2 py-1.5 text-sm text-hub-text placeholder:text-hub-text-dim focus:outline-none"
              />
              <Button type="button" variant="secondary" onClick={handleBrowse}>
                Browse
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
