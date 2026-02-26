import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import type { Script } from "../../types";
import { useScriptStore } from "../../stores/useScriptStore";
import { useCategoryStore } from "../../stores/useCategoryStore";
import { useToast } from "../../hooks/useToast";
import { Button } from "../UI/Button";
import { ColorPicker } from "../UI/ColorPicker";

interface EditScriptDialogProps {
  script: Script;
  open: boolean;
  onClose: () => void;
}

export function EditScriptDialog({
  script,
  open: isOpen,
  onClose,
}: EditScriptDialogProps) {
  const updateScript = useScriptStore((s) => s.updateScript);
  const categories = useCategoryStore((s) => s.categories);
  const toast = useToast();

  const [name, setName] = useState(script.name);
  const [path, setPath] = useState(script.path);
  const [description, setDescription] = useState(script.description ?? "");
  const [categoryId, setCategoryId] = useState(script.categoryId);
  const [color, setColor] = useState(script.color);

  useEffect(() => {
    setName(script.name);
    setPath(script.path);
    setDescription(script.description ?? "");
    setCategoryId(script.categoryId);
    setColor(script.color);
  }, [script]);

  async function handlePickFile() {
    const selected = await open({
      filters: [
        { name: "Scripts", extensions: ["sh", "command", "bash", "zsh"] },
      ],
      multiple: false,
    });

    if (selected) {
      setPath(selected as string);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !path.trim()) return;

    try {
      await updateScript(script.id, {
        name: name.trim() !== script.name ? name.trim() : null,
        path: path.trim() !== script.path ? path.trim() : null,
        description:
          description.trim() !== (script.description ?? "")
            ? description.trim() || null
            : null,
        categoryId: categoryId !== script.categoryId ? categoryId : null,
        color: color !== script.color ? color : null,
      });
      toast.success("Script updated");
      onClose();
    } catch {
      toast.error("Failed to update script");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-hub-surface shadow-win-outset rounded-none w-full max-w-md mx-4">
        <div className="win-titlebar px-2 py-1 flex items-center justify-between">
          <span className="font-bold text-white">Edit Script</span>
          <button
            onClick={onClose}
            className="bg-win-button-face shadow-win-button text-hub-text px-1.5 py-0 text-xs font-bold hover:shadow-win-button-pressed leading-tight"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-hub-text mb-1">
              Script File
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={path}
                readOnly
                className="flex-1 bg-white shadow-win-field rounded-none px-2 py-1.5 text-sm text-hub-text focus:outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handlePickFile}
              >
                Browse
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-hub-text mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white shadow-win-field rounded-none px-2 py-1.5 text-sm text-hub-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-hub-text mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full bg-white shadow-win-field rounded-none px-2 py-1.5 text-sm text-hub-text placeholder:text-hub-text-dim focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-hub-text mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full bg-white shadow-win-field rounded-none px-2 py-1.5 text-sm text-hub-text focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-hub-text mb-1.5">
              Color
            </label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !path.trim()}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
