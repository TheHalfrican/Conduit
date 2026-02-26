import { useState } from "react";
import { clsx } from "clsx";
import { useScriptStore } from "../../stores/useScriptStore";
import { useCategoryStore } from "../../stores/useCategoryStore";
import { useToast } from "../../hooks/useToast";
import { ColorPicker } from "../UI/ColorPicker";
import { Button } from "../UI/Button";

export function Sidebar() {
  const scripts = useScriptStore((s) => s.scripts);
  const activeCategory = useScriptStore((s) => s.activeCategory);
  const setActiveCategory = useScriptStore((s) => s.setActiveCategory);
  const categories = useCategoryStore((s) => s.categories);
  const addCategory = useCategoryStore((s) => s.addCategory);
  const deleteCategory = useCategoryStore((s) => s.deleteCategory);
  const toast = useToast();

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#0054e3");

  const totalScripts = scripts.length;

  function scriptCountForCategory(categoryId: number) {
    return scripts.filter((s) => s.categoryId === categoryId).length;
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    try {
      await addCategory(newCatName.trim(), newCatColor);
      setNewCatName("");
      setNewCatColor("#0054e3");
      setShowAddCategory(false);
      toast.success("Category added");
    } catch {
      toast.error("Failed to add category");
    }
  }

  async function handleDeleteCategory(id: number) {
    try {
      await deleteCategory(id);
      if (activeCategory === id) {
        setActiveCategory(null);
      }
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  }

  return (
    <aside className="w-56 bg-hub-surface shadow-win-outset flex flex-col h-full shrink-0">
      <div className="win-titlebar py-1.5 px-3">
        <h1 className="text-sm font-bold tracking-wide">
          Conduit
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="bg-white shadow-win-inset m-1 p-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={clsx(
              "w-full flex items-center justify-between px-2 py-1 text-sm",
              activeCategory === null
                ? "bg-accent text-white"
                : "text-hub-text hover:bg-[#316ac5] hover:text-white",
            )}
          >
            <span>All Scripts</span>
            <span className="text-xs opacity-70">{totalScripts}</span>
          </button>

          <div className="mt-2 mb-1 px-2 flex items-center justify-between">
            <span className="text-xs font-medium text-hub-text-dim">
              Categories
            </span>
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="text-hub-text-dim hover:text-accent text-lg leading-none"
            >
              +
            </button>
          </div>

          {showAddCategory && (
            <div className="mx-1 mb-1 p-2 bg-hub-surface shadow-win-outset">
              <input
                type="text"
                placeholder="Category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                className="w-full bg-white shadow-win-field rounded-none px-2 py-1 text-sm text-hub-text placeholder:text-hub-text-dim focus:outline-none mb-2"
                autoFocus
              />
              <ColorPicker value={newCatColor} onChange={setNewCatColor} />
              <div className="flex gap-1.5 mt-2">
                <Button size="sm" onClick={handleAddCategory}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddCategory(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {categories.map((cat) => (
            <div key={cat.id} className="group relative">
              <button
                onClick={() =>
                  setActiveCategory(activeCategory === cat.id ? null : cat.id)
                }
                className={clsx(
                  "w-full flex items-center gap-2 px-2 py-1 text-sm",
                  activeCategory === cat.id
                    ? "bg-accent text-white"
                    : "text-hub-text hover:bg-[#316ac5] hover:text-white",
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-none shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate flex-1 text-left">{cat.name}</span>
                <span className="text-xs opacity-70">
                  {scriptCountForCategory(cat.id)}
                </span>
              </button>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-hub-text-dim hover:text-status-error text-xs px-1.5 py-0.5 transition-opacity"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
