import { FunctionsHttpError } from "@supabase/supabase-js";
import type { BoardState, GameRow, GuessItem, GuessResult, ItemKind } from "../types";
import { supabase } from "./supabaseClient";

interface SubmitGuessesInput {
  rows: GameRow[];
  board: BoardState;
  itemsById: Record<string, GuessItem>;
}

interface SubmitGuessesResponse {
  submissionId: string;
  score: number;
  maxScore: number;
  results?: GuessResult[];
}

export type SubmitResult =
  | {
      mode: "demo";
      score: number;
      maxScore: number;
      results: GuessResult[];
    }
  | ({
      mode: "submitted";
      results: GuessResult[];
      needsFunctionDeploy: boolean;
    } & SubmitGuessesResponse);

const readSlotValue = (
  board: BoardState,
  itemsById: Record<string, GuessItem>,
  personId: string,
  kind: ItemKind,
) => {
  const itemId = board.slots[personId]?.[kind][0];
  return itemId ? itemsById[itemId]?.value ?? "" : "";
};

const readFunctionErrorMessage = async (error: Error) => {
  if (!(error instanceof FunctionsHttpError)) {
    return error.message;
  }

  try {
    const body = (await error.context.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? error.message;
  } catch {
    return error.message;
  }
};

const getDemoAnswerId = (participantId: string, kind: ItemKind) => {
  const firstName = participantId.split("-")[0] ?? "";
  return `${kind}-${firstName}`;
};

const createDemoResults = (
  rows: GameRow[],
  board: BoardState,
  itemsById: Record<string, GuessItem>,
): GuessResult[] =>
  rows.map((row) => {
    const factId = readSlotValue(board, itemsById, row.id, "fact");
    const songId = readSlotValue(board, itemsById, row.id, "song");
    const correctFactId = getDemoAnswerId(row.id, "fact");
    const correctSongId = getDemoAnswerId(row.id, "song");

    return {
      participantId: row.id,
      factId,
      songId,
      correctFactId,
      correctSongId,
      factCorrect: factId === correctFactId,
      songCorrect: songId === correctSongId,
    };
  });

const createPerfectScoreResults = (
  rows: GameRow[],
  board: BoardState,
  itemsById: Record<string, GuessItem>,
): GuessResult[] =>
  rows.map((row) => {
    const factId = readSlotValue(board, itemsById, row.id, "fact");
    const songId = readSlotValue(board, itemsById, row.id, "song");

    return {
      participantId: row.id,
      factId,
      songId,
      correctFactId: factId,
      correctSongId: songId,
      factCorrect: true,
      songCorrect: true,
    };
  });

export const submitGuesses = async ({
  rows,
  board,
  itemsById,
}: SubmitGuessesInput): Promise<SubmitResult> => {
  if (!supabase) {
    const results = createDemoResults(rows, board, itemsById);
    const score = results.reduce(
      (total, result) => total + Number(result.factCorrect) + Number(result.songCorrect),
      0,
    );

    return {
      mode: "demo",
      score,
      maxScore: rows.length * 2,
      results,
    };
  }

  const guesses = rows.map((row) => ({
    participantId: row.id,
    factId: readSlotValue(board, itemsById, row.id, "fact"),
    songId: readSlotValue(board, itemsById, row.id, "song"),
  }));

  const missingGuess = guesses.some((guess) => !guess.participantId || !guess.factId || !guess.songId);

  if (missingGuess) {
    throw new Error("Place one fact and one song for every teammate before submitting.");
  }

  const { data, error } = await supabase.functions.invoke<SubmitGuessesResponse>("submit-guesses", {
    body: {
      guesses,
    },
  });

  if (error) {
    throw new Error(await readFunctionErrorMessage(error));
  }

  if (!data) {
    throw new Error("Submission completed without a score response.");
  }

  const responseResults = data.results ?? [];
  const results =
    responseResults.length || data.score !== data.maxScore
      ? responseResults
      : createPerfectScoreResults(rows, board, itemsById);

  return {
    mode: "submitted",
    submissionId: data.submissionId,
    score: data.score,
    maxScore: data.maxScore,
    results,
    needsFunctionDeploy: !responseResults.length && data.score !== data.maxScore,
  };
};
