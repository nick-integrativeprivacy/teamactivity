import { Draggable } from "@hello-pangea/dnd";
import { FileText, GripVertical, Music2 } from "lucide-react";
import { createPortal } from "react-dom";
import type { GuessItem, ItemVisualState } from "../types";
import { MusicCard } from "./MusicCard";

interface ItemCardProps {
  item: GuessItem;
  index: number;
  compact?: boolean;
  className?: string;
  disabled?: boolean;
  visualState?: ItemVisualState;
}

export function ItemCard({
  item,
  index,
  compact = false,
  className = "",
  disabled = false,
  visualState,
}: ItemCardProps) {
  const Icon = item.kind === "fact" ? FileText : Music2;
  const isTemporarilyLocked = visualState === "returning" || visualState === "flying-in";

  return (
    <Draggable draggableId={item.id} index={index} isDragDisabled={disabled || isTemporarilyLocked}>
      {(provided, snapshot) => {
        const card = (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={[
              "rounded-lg border bg-white/90 shadow-sm",
              compact ? "overflow-hidden" : "",
              visualState === "correct" ? "guess-card-correct" : "",
              visualState === "returning" ? "guess-card-returning" : "",
              visualState === "flying-in" ? "guess-card-flying-in" : "",
              snapshot.isDragging
                ? "border-spotify/80 shadow-glow"
                : visualState
                  ? "transition"
                  : "border-leaf/10 transition hover:border-leaf/25 hover:bg-white",
              className,
            ].join(" ")}
            style={{
              ...provided.draggableProps.style,
              ...(snapshot.isDragging ? { zIndex: 9999, pointerEvents: "none" as const } : {}),
            }}
          >
            <div
              {...provided.dragHandleProps}
              className={[
                "flex items-center gap-2",
                disabled || isTemporarilyLocked
                  ? "cursor-default"
                  : "cursor-grab active:cursor-grabbing",
                compact ? "min-h-8 px-2 py-1.5" : "min-h-10 px-3 py-2",
              ].join(" ")}
            >
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-leaf/35" aria-hidden="true" />
              <Icon className="h-3.5 w-3.5 shrink-0 text-spotify" aria-hidden="true" />
              <span className="min-w-0 flex-1 break-words text-xs font-semibold text-ink">
                {item.kind === "fact" ? "Fact" : "Song"}
              </span>
            </div>

            {item.kind === "fact" ? (
              <p
                className={[
                  "text-leaf/80",
                  compact
                    ? "max-h-[4.75rem] overflow-hidden px-2 pb-2 text-xs leading-4"
                    : "px-3 pb-3 text-sm leading-5",
                ].join(" ")}
              >
                {item.label}
              </p>
            ) : (
              <div className={compact ? "px-3 pb-3" : "px-2 pb-2"}>
                <MusicCard trackId={item.trackId ?? ""} label={item.label} compact={compact} />
              </div>
            )}
          </div>
        );

        if (snapshot.isDragging && typeof document !== "undefined") {
          return createPortal(card, document.body);
        }

        return card;
      }}
    </Draggable>
  );
}
