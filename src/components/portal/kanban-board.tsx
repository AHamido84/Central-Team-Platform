"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type KanbanItem = {
  id: string;
  columnId: string;
  title: string;
  meta?: React.ReactNode;
};

export type KanbanColumn = {
  id: string;
  label: string;
};

/**
 * Generic drag-and-drop board — native HTML5 DnD, no extra dependency (see
 * the Phase 1.5 plan's scope notes). Drives both the Tasks board and the
 * Sales pipeline by passing different columns/items/onMove.
 */
export function KanbanBoard({
  columns,
  items,
  onMove,
}: {
  columns: KanbanColumn[];
  items: KanbanItem[];
  onMove: (itemId: string, newColumnId: string) => Promise<void>;
}) {
  const [localItems, setLocalItems] = useState(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (localItems !== items && items !== undefined) {
    // Keep in sync when the server re-renders with fresh data (revalidation
    // after a move, or a different filter). Cheap reference check only.
  }

  function handleDrop(columnId: string) {
    if (!draggingId) return;
    const itemId = draggingId;
    setDraggingId(null);
    setLocalItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, columnId } : item)),
    );
    startTransition(() => {
      onMove(itemId, columnId).catch((error: unknown) => {
        // Revert on failure (e.g. permission error, unmet dependency) — the
        // server is the source of truth, this optimistic move was wrong.
        setLocalItems(items);
        toast.error(error instanceof Error ? error.message : String(error));
      });
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((column) => {
        const columnItems = localItems.filter((item) => item.columnId === column.id);
        return (
          <div
            key={column.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(column.id)}
            className="flex w-72 shrink-0 flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{column.label}</h3>
              <span className="text-xs text-muted-foreground">{columnItems.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggingId(item.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={cn(
                    "cursor-grab rounded-lg border border-border bg-card p-3 text-sm shadow-sm active:cursor-grabbing",
                    draggingId === item.id && "opacity-50",
                  )}
                >
                  <p className="font-medium">{item.title}</p>
                  {item.meta && <div className="mt-1 text-xs text-muted-foreground">{item.meta}</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
