import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { useToast } from "../../hooks/useToast";
import { Button } from "./Button";
import type { Theme } from "../../types";

const THEMES: { id: Theme; name: string; description: string }[] = [
  { id: "win98", name: "Windows 98", description: "Classic gray bevels" },
  { id: "macos8", name: "Mac OS 8", description: "Platinum elegance" },
  { id: "xp", name: "Windows XP", description: "Luna blue chrome" },
  { id: "vista", name: "Windows Vista", description: "Aero glass" },
];

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open: isOpen, onClose }: SettingsDialogProps) {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const toast = useToast();

  const [editorPath, setEditorPath] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<Theme>("win98");
  const [originalTheme, setOriginalTheme] = useState<Theme>("win98");

  useEffect(() => {
    if (isOpen && settings) {
      setEditorPath(settings.editorPath);
      setSelectedTheme(settings.theme);
      setOriginalTheme(settings.theme);
    }
  }, [isOpen, settings]);

  function handleThemeSelect(theme: Theme) {
    setSelectedTheme(theme);
    // Live preview: apply immediately
    setTheme(theme);
  }

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
      await updateSettings({ editorPath: editorPath.trim(), theme: selectedTheme });
      toast.success("Settings saved");
      onClose();
    } catch {
      toast.error("Failed to save settings");
    }
  }

  function handleCancel() {
    // Revert theme to original if changed
    if (selectedTheme !== originalTheme) {
      setTheme(originalTheme);
    }
    onClose();
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-hub-surface shadow-win-outset rounded-none w-full max-w-md mx-4">
        <div className="win-titlebar px-2 py-1 flex items-center justify-between">
          <span className="font-bold">Settings</span>
          <button
            onClick={handleCancel}
            className="bg-win-button-face shadow-win-button text-hub-text px-1.5 py-0 text-xs font-bold hover:shadow-win-button-pressed leading-tight"
          >
            X
          </button>
        </div>

        <div className="p-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-hub-text mb-1.5">
              Theme
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={
                    "text-left px-2.5 py-2 text-sm shadow-win-button " +
                    (selectedTheme === theme.id
                      ? "bg-accent text-white shadow-win-button-pressed"
                      : "bg-win-button-face text-hub-text hover:shadow-win-button-pressed")
                  }
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  <div className="font-semibold text-xs">{theme.name}</div>
                  <div
                    className={
                      "text-[10px] mt-0.5 " +
                      (selectedTheme === theme.id
                        ? "text-white/80"
                        : "text-hub-text-dim")
                    }
                  >
                    {theme.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

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
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
