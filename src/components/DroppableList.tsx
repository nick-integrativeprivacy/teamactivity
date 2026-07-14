import { Droppable } from "@hello-pangea/dnd";
import type { GuessItem, ItemKind, ItemVisualState } from "../types";
import { ItemCard } from "./ItemCard";

interface DroppableListProps {
  droppableId: string;
  kind: ItemKind;
  itemIds: string[];
  itemsById: Record<string, GuessItem>;
  emptyLabel: string;
  compact?: boolean;
  layout?: "vertical" | "horizontal";
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
  itemVisualState?: Record<string, ItemVisualState>;
}

export function DroppableList({
  droppableId,
  kind,
  itemIds,
  itemsById,
  emptyLabel,
  compact = false,
  layout = "vertical",
  className = "",
  itemClassName = "",
  disabled = false,
  itemVisualState = {},
}: DroppableListProps) {
  return (
    <Droppable
      droppableId={droppableId}
      type={kind.toUpperCase()}
      direction={layout === "horizontal" ? "horizontal" : "vertical"}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={[
            "rounded-lg border transition-colors",
            snapshot.isDraggingOver
              ? "border-dashed border-spotify bg-spotify/10"
              : "border-dashed border-leaf/15 bg-white/35",
            className,
          ].join(" ")}
        >
          <div
            className={[
              "flex gap-2 p-2",
              layout === "horizontal" ? "min-w-max flex-row" : "flex-col",
            ].join(" ")}
          >
            {itemIds.map((itemId, index) => {
              const item = itemsById[itemId];

              if (!item) {
                return null;
              }

              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  compact={compact}
                  className={itemClassName}
                  disabled={disabled}
                  visualState={itemVisualState[item.id]}
                />
              );
            })}
            {provided.placeholder}
            {!itemIds.length ? (
              <div
                className={[
                  "grid place-items-center text-center font-medium text-leaf/45",
                  compact
                    ? "min-h-[5.25rem] min-w-0 px-2 py-3 text-xs"
                    : "min-h-20 min-w-44 px-3 py-4 text-sm",
                ].join(" ")}
              >
                {emptyLabel}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Droppable>
  );
}
