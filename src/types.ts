export type ItemKind = "fact" | "song";

export interface GameRow {
  id: string;
  name: string;
  imageUrl?: string;
  factItemId: string;
  fact: string;
  songItemId: string;
  songLabel: string;
  songTrackId: string;
}

export interface GuessItem {
  id: string;
  kind: ItemKind;
  label: string;
  value: string;
  trackId?: string;
}

export type ItemVisualState = "correct" | "returning" | "flying-in";

export interface BoardState {
  pools: Record<ItemKind, string[]>;
  slots: Record<string, Record<ItemKind, string[]>>;
}

export interface GuessResult {
  participantId: string;
  factId: string;
  songId: string;
  correctFactId: string;
  correctSongId: string;
  factCorrect: boolean;
  songCorrect: boolean;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  createdAt?: string;
}

export interface DataLoadResult<T> {
  data: T;
  source: "configured" | "sample";
  warning?: string;
}
