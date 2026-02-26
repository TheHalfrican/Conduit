import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useScriptStore } from "../../stores/useScriptStore";
import { useCategoryStore } from "../../stores/useCategoryStore";
import { useToast } from "../../hooks/useToast";
import { Button } from "../UI/Button";
import { ColorPicker } from "../UI/ColorPicker";

interface AddScriptDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddScriptDialog({ open: isOpen, onClose }: AddScriptDialogProps) {
  const addScript = useScriptStore((s) => s.addScript);
  const categories = useCategoryStore((s) => s.categories);
  const toast = useToast();

  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [color, setColor] = useState("#00d4aa");

  useEffect(() => {
    if (isOpen && categories.length > 0 && categoryId === 0) {
      setCategoryId(categories[0].id);
    }
  }, [isOpen, categories, categoryId]);

  function reset() {
    setName("");
    setPath("");
    setDescription("");
    setCategoryId(categories[0]?.id ?? 0);
    setColor("#00d4aa");
  }

  async function handlePickFile() {
    try {
      const selected = await open({
        filters: [
          { name: "Scripts", extensions: ["sh", "command", "bash", "zsh"] },
        ],
        multiple: false,
      });

      if (typeof selected === "string") {
        setPath(selected);
        if (!name) {
          const filename = selected.split("/").pop() ?? "";
          setName(filename.replace(/\.(sh|command|bash|zsh)$/, ""));
        }
      }
    } catch (err) {
      console.error("File picker error:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !path.trim() || categoryId === 0) return;

    try {
      await addScript({
        name: name.trim(),
        path: path.trim(),
        description: description.trim() || null,
        categoryId,
        color,
      });
      toast.success(`Script "${name}" added`);
      reset();
      onClose();
    } catch {
      toast.error("Failed to add script");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-hub-surface border border-hub-border rounded-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub-border">
          <h2 className="text-base font-semibold text-hub-text">Add Script</h2>
          <button
            onClick={onClose}
            className="text-hub-text-dim hover:text-hub-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-hub-text-dim mb-1">
              Script File
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={path}
                readOnly
                placeholder="Select a script file..."
                className="flex-1 bg-hub-bg border border-hub-border rounded-lg px-3 py-2 text-sm text-hub-text placeholder:text-hub-text-dim focus:outline-none"
              />
              <Button type="button" variant="secondary" onClick={handlePickFile}>
                Browse
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-hub-text-dim mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Script name"
              className="w-full bg-hub-bg border border-hub-border rounded-lg px-3 py-2 text-sm text-hub-text placeholder:text-hub-text-dim focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-hub-text-dim mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full bg-hub-bg border border-hub-border rounded-lg px-3 py-2 text-sm text-hub-text placeholder:text-hub-text-dim focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-hub-text-dim mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full bg-hub-bg border border-hub-border rounded-lg px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-accent"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-hub-text-dim mb-1.5">
              Color
            </label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !path.trim() || categoryId === 0}>
              Add Script
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
