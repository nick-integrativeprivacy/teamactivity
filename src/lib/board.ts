import type { BoardState, GameRow, GuessItem, ItemKind } from "../types";

export const createGuessItems = (rows: GameRow[]) =>
  rows.reduce<Record<string, GuessItem>>((items, row) => {
    items[row.factItemId] = {
      id: row.factItemId,
      kind: "fact",
      label: row.fact,
      value: row.factItemId,
    };
    items[row.songItemId] = {
      id: row.songItemId,
      kind: "song",
      label: row.songLabel,
      value: row.songItemId,
      trackId: row.songTrackId,
    };

    return items;
  }, {});

export const createInitialBoard = (rows: GameRow[]): BoardState => ({
  pools: {
    fact: rows.map((row) => row.factItemId),
    song: rows.map((row) => row.songItemId),
  },
  slots: rows.reduce<BoardState["slots"]>((slots, row) => {
    slots[row.id] = { fact: [], song: [] };
    return slots;
  }, {}),
});

export const cloneBoard = (board: BoardState): BoardState => ({
  pools: {
    fact: [...board.pools.fact],
    song: [...board.pools.song],
  },
  slots: Object.fromEntries(
    Object.entries(board.slots).map(([personId, slots]) => [
      personId,
      {
        fact: [...slots.fact],
        song: [...slots.song],
      },
    ]),
  ),
});

export const countPlaced = (board: BoardState, kind: ItemKind) =>
  Object.values(board.slots).reduce((count, slots) => count + slots[kind].length, 0);

export const getItemKind = (itemId: string): ItemKind | null => {
  if (itemId.startsWith("fact-")) {
    return "fact";
  }

  if (itemId.startsWith("song-")) {
    return "song";
  }

  return null;
};
