import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import confetti from "canvas-confetti";
import { CheckCircle2, FileText, Loader2, Music2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured } from "./config";
import { DroppableList } from "./components/DroppableList";
import { IconWallpaper } from "./components/IconWallpaper";
import { LeaderboardPanel } from "./components/LeaderboardPanel";
import { PlayerPanel } from "./components/PlayerPanel";
import { SpotifyPlaylistCard } from "./components/SpotifyPlaylistCard";
import { deriveDisplayNameFromEmail, type AuthPlayer } from "./lib/auth";
import {
  cloneBoard,
  countPlaced,
  createGuessItems,
  createInitialBoard,
  getItemKind,
} from "./lib/board";
import { loadGameData, loadLeaderboard } from "./lib/supabaseData";
import { submitGuesses } from "./lib/formSubmission";
import { supabase } from "./lib/supabaseClient";
import type {
  BoardState,
  GameRow,
  GuessResult,
  ItemKind,
  ItemVisualState,
  LeaderboardEntry,
} from "./types";

type DroppableLocation =
  | { scope: "pool"; kind: ItemKind }
  | { scope: "slot"; kind: ItemKind; personId: string };

const FACT_POOL_ID = "pool:fact";
const SONG_POOL_ID = "pool:song";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RETURN_ANIMATION_MS = 420;
const FLY_IN_ANIMATION_MS = 560;
const REVEAL_PAUSE_MS = 180;
const personStaggerClasses = [
  "xl:col-span-2 xl:col-start-1 xl:row-start-1",
  "xl:col-span-2 xl:col-start-3 xl:row-start-1",
  "xl:col-span-2 xl:col-start-5 xl:row-start-1",
  "xl:col-span-2 xl:col-start-7 xl:row-start-1",
  "xl:col-span-2 xl:col-start-9 xl:row-start-1",
  "xl:col-span-2 xl:col-start-2 xl:row-start-2",
  "xl:col-span-2 xl:col-start-4 xl:row-start-2",
  "xl:col-span-2 xl:col-start-6 xl:row-start-2",
  "xl:col-span-2 xl:col-start-8 xl:row-start-2",
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const toAuthPlayer = (user: { id: string; email?: string | null } | null | undefined): AuthPlayer | null => {
  const email = user?.email?.trim().toLowerCase();

  if (!user?.id || !email) {
    return null;
  }

  return {
    id: user.id,
    email,
    displayName: deriveDisplayNameFromEmail(email),
  };
};

const parseDroppableId = (droppableId: string): DroppableLocation | null => {
  const [scope, first, second] = droppableId.split(":");

  if (scope === "pool" && (first === "fact" || first === "song")) {
    return { scope: "pool", kind: first };
  }

  if (scope === "slot" && (second === "fact" || second === "song")) {
    return { scope: "slot", personId: first, kind: second };
  }

  return null;
};

const getList = (board: BoardState, location: DroppableLocation) => {
  if (location.scope === "pool") {
    return board.pools[location.kind];
  }

  return board.slots[location.personId]?.[location.kind] ?? null;
};

const moveDraggable = (board: BoardState, result: DropResult) => {
  const destination = result.destination;

  if (!destination) {
    return board;
  }

  const itemKind = getItemKind(result.draggableId);
  const source = parseDroppableId(result.source.droppableId);
  const target = parseDroppableId(destination.droppableId);

  if (!itemKind || !source || !target || source.kind !== itemKind || target.kind !== itemKind) {
    return board;
  }

  const next = cloneBoard(board);
  const sourceList = getList(next, source);
  const targetList = getList(next, target);

  if (!sourceList || !targetList) {
    return board;
  }

  if (result.source.droppableId === destination.droppableId) {
    if (source.scope === "slot") {
      return board;
    }

    const [moved] = sourceList.splice(result.source.index, 1);

    if (!moved) {
      return board;
    }

    sourceList.splice(destination.index, 0, moved);
    return next;
  }

  const [moved] = sourceList.splice(result.source.index, 1);

  if (!moved) {
    return board;
  }

  if (target.scope === "slot") {
    const displaced = targetList[0];
    targetList.splice(0, targetList.length, moved);

    if (displaced) {
      if (source.scope === "slot") {
        sourceList.splice(0, sourceList.length, displaced);
      } else {
        sourceList.splice(result.source.index, 0, displaced);
      }
    }

    return next;
  }

  targetList.splice(destination.index, 0, moved);
  return next;
};

type CorrectionStep = {
  participantId: string;
  kind: ItemKind;
  guessedItemId: string;
  correctItemId: string;
};

const removeItemEverywhere = (board: BoardState, kind: ItemKind, itemId: string) => {
  board.pools[kind] = board.pools[kind].filter((id) => id !== itemId);

  Object.values(board.slots).forEach((slots) => {
    slots[kind] = slots[kind].filter((id) => id !== itemId);
  });
};

const returnSlotItemToPool = (
  board: BoardState,
  kind: ItemKind,
  participantId: string,
  itemId: string,
) => {
  const next = cloneBoard(board);
  const targetSlot = next.slots[participantId]?.[kind];

  if (!targetSlot?.includes(itemId)) {
    return next;
  }

  next.slots[participantId][kind] = targetSlot.filter((id) => id !== itemId);

  if (!next.pools[kind].includes(itemId)) {
    next.pools[kind].push(itemId);
  }

  return next;
};

const placeCorrectItem = (
  board: BoardState,
  kind: ItemKind,
  participantId: string,
  itemId: string,
) => {
  const next = cloneBoard(board);

  removeItemEverywhere(next, kind, itemId);

  if (next.slots[participantId]) {
    next.slots[participantId][kind] = [itemId];
  }

  return next;
};

const buildCorrectionSteps = (results: GuessResult[]) =>
  results.flatMap<CorrectionStep>((result) => {
    const steps: CorrectionStep[] = [];

    if (!result.factCorrect) {
      steps.push({
        participantId: result.participantId,
        kind: "fact",
        guessedItemId: result.factId,
        correctItemId: result.correctFactId,
      });
    }

    if (!result.songCorrect) {
      steps.push({
        participantId: result.participantId,
        kind: "song",
        guessedItemId: result.songId,
        correctItemId: result.correctSongId,
      });
    }

    return steps;
  });

const getInitialVisualState = (results: GuessResult[]) =>
  results.reduce<Record<string, ItemVisualState>>((states, result) => {
    if (result.factCorrect) {
      states[result.factId] = "correct";
    }

    if (result.songCorrect) {
      states[result.songId] = "correct";
    }

    return states;
  }, {});

const shuffleItems = <T,>(items: T[]) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

const createRandomBoard = (rows: GameRow[]): BoardState => {
  const facts = shuffleItems(rows.map((row) => row.factItemId));
  const songs = shuffleItems(rows.map((row) => row.songItemId));

  return {
    pools: {
      fact: [],
      song: [],
    },
    slots: rows.reduce<BoardState["slots"]>((slots, row, index) => {
      slots[row.id] = {
        fact: facts[index] ? [facts[index]] : [],
        song: songs[index] ? [songs[index]] : [],
      };
      return slots;
    }, {}),
  };
};

const getBoardStorageKey = (playerId: string) => `teamactivity:board:${playerId}`;

const restoreBoard = (rows: GameRow[], playerId: string): BoardState | null => {
  try {
    const saved = window.localStorage.getItem(getBoardStorageKey(playerId));

    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved) as Partial<BoardState>;
    const expectedPeople = new Set(rows.map((row) => row.id));
    const expectedFacts = new Set(rows.map((row) => row.factItemId));
    const expectedSongs = new Set(rows.map((row) => row.songItemId));

    if (!parsed.pools || !parsed.slots || !Array.isArray(parsed.pools.fact) || !Array.isArray(parsed.pools.song)) {
      return null;
    }

    if (Object.keys(parsed.slots).length !== expectedPeople.size) {
      return null;
    }

    const factLocations = [...parsed.pools.fact];
    const songLocations = [...parsed.pools.song];

    for (const row of rows) {
      const slot = parsed.slots[row.id];

      if (!slot || !Array.isArray(slot.fact) || !Array.isArray(slot.song)) {
        return null;
      }

      factLocations.push(...slot.fact);
      songLocations.push(...slot.song);
    }

    const hasExpectedItems = (locations: unknown[], expected: Set<string>) =>
      locations.length === expected.size &&
      new Set(locations).size === expected.size &&
      locations.every((item) => typeof item === "string" && expected.has(item));

    if (!hasExpectedItems(factLocations, expectedFacts) || !hasExpectedItems(songLocations, expectedSongs)) {
      return null;
    }

    return parsed as BoardState;
  } catch {
    return null;
  }
};

function App() {
  const [gameRows, setGameRows] = useState<GameRow[]>([]);
  const [board, setBoard] = useState<BoardState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardSource, setLeaderboardSource] = useState<"configured" | "sample">("sample");
  const [loadingGame, setLoadingGame] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [authPlayer, setAuthPlayer] = useState<AuthPlayer | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authWorking, setAuthWorking] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [correctionRunning, setCorrectionRunning] = useState(false);
  const [itemVisualState, setItemVisualState] = useState<Record<string, ItemVisualState>>({});
  const correctionRunRef = useRef(0);
  const correctionTimersRef = useRef<number[]>([]);
  const hydratedPlayerRef = useRef<string | null>(null);
  const authPlayerId = authPlayer?.id ?? null;

  const itemsById = useMemo(() => createGuessItems(gameRows), [gameRows]);

  const clearCorrectionTimers = useCallback(() => {
    correctionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    correctionTimersRef.current = [];
  }, []);

  const waitForCorrection = useCallback((duration: number) => {
    return new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => {
        correctionTimersRef.current = correctionTimersRef.current.filter((id) => id !== timer);
        resolve();
      }, duration);

      correctionTimersRef.current.push(timer);
    });
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    const result = await loadLeaderboard();
    setLeaderboard(result.data);
    setLeaderboardSource(result.source);
    setWarningMessage((current) => result.warning ?? current);
    setLoadingLeaderboard(false);
  }, []);

  const runCorrectionReveal = useCallback(
    async (results: GuessResult[]) => {
      clearCorrectionTimers();
      correctionRunRef.current += 1;

      const runId = correctionRunRef.current;
      const steps = buildCorrectionSteps(results).filter(
        (step) => step.guessedItemId && step.correctItemId,
      );

      setItemVisualState(getInitialVisualState(results));

      if (!steps.length) {
        setCorrectionRunning(false);
        return;
      }

      setCorrectionRunning(true);
      await waitForCorrection(REVEAL_PAUSE_MS);

      for (const step of steps) {
        if (runId !== correctionRunRef.current) {
          return;
        }

        setItemVisualState((current) => ({
          ...current,
          [step.guessedItemId]: "returning",
        }));

        await waitForCorrection(RETURN_ANIMATION_MS);

        if (runId !== correctionRunRef.current) {
          return;
        }

        setBoard((current) =>
          current
            ? returnSlotItemToPool(current, step.kind, step.participantId, step.guessedItemId)
            : current,
        );
        setItemVisualState((current) => {
          const next = { ...current };
          delete next[step.guessedItemId];
          return next;
        });

        await waitForCorrection(80);
      }

      for (const step of steps) {
        if (runId !== correctionRunRef.current) {
          return;
        }

        setItemVisualState((current) => ({
          ...current,
          [step.correctItemId]: "flying-in",
        }));
        setBoard((current) =>
          current ? placeCorrectItem(current, step.kind, step.participantId, step.correctItemId) : current,
        );

        await waitForCorrection(FLY_IN_ANIMATION_MS);

        if (runId !== correctionRunRef.current) {
          return;
        }

        setItemVisualState((current) => {
          const next = { ...current };
          delete next[step.correctItemId];
          return next;
        });

        await waitForCorrection(80);
      }

      if (runId === correctionRunRef.current) {
        setCorrectionRunning(false);
      }
    },
    [clearCorrectionTimers, waitForCorrection],
  );

  useEffect(() => () => {
    clearCorrectionTimers();
    correctionRunRef.current += 1;
  }, [clearCorrectionTimers]);

  useEffect(() => {
    if (!authPlayer || !authPlayerId) {
      clearCorrectionTimers();
      correctionRunRef.current += 1;
      setGameRows([]);
      setBoard(null);
      hydratedPlayerRef.current = null;
      setLeaderboard([]);
      setLeaderboardSource("sample");
      setLoadingGame(false);
      setLoadingLeaderboard(false);
      setHasSubmitted(false);
      setCorrectionRunning(false);
      setItemVisualState({});
      return;
    }

    const playerId = authPlayerId;
    let active = true;

    const load = async () => {
      setLoadingGame(true);
      const [gameResult, leaderboardResult] = await Promise.all([
        loadGameData(),
        loadLeaderboard(),
      ]);

      if (!active) {
        return;
      }

      setGameRows(gameResult.data);
      setBoard(restoreBoard(gameResult.data, playerId) ?? createInitialBoard(gameResult.data));
      hydratedPlayerRef.current = playerId;
      setLeaderboard(leaderboardResult.data);
      setLeaderboardSource(leaderboardResult.source);
      setWarningMessage(gameResult.warning ?? leaderboardResult.warning ?? "");
      setHasSubmitted(false);
      setCorrectionRunning(false);
      setItemVisualState({});
      setLoadingGame(false);
      setLoadingLeaderboard(false);
    };

    load();

    return () => {
      active = false;
    };
  }, [authPlayerId, clearCorrectionTimers]);

  useEffect(() => {
    if (!board || !authPlayerId || hydratedPlayerRef.current !== authPlayerId) {
      return;
    }

    try {
      window.localStorage.setItem(getBoardStorageKey(authPlayerId), JSON.stringify(board));
    } catch {
      // Storage can be unavailable in private browsing or restrictive browser settings.
    }
  }, [authPlayerId, board]);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    const client = supabase;
    let active = true;

    const readSession = async () => {
      const { data, error } = await client.auth.getSession();

      if (!active) {
        return;
      }

      if (error) {
        setAuthError(error.message);
      }

      const player = toAuthPlayer(data.session?.user);
      setAuthPlayer(player);

      if (player) {
        setLoginEmail(player.email);
      }

      setAuthLoading(false);
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const player = toAuthPlayer(session?.user);
      setAuthPlayer(player);

      if (player) {
        setLoginEmail(player.email);
        setStatusMessage("");
      }

      setAuthLoading(false);
      setAuthError("");
    });

    readSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const interactionLocked = submitting || correctionRunning || hasSubmitted;

  const onDragEnd = useCallback((result: DropResult) => {
    if (interactionLocked) {
      return;
    }

    setBoard((current) => (current ? moveDraggable(current, result) : current));
  }, [interactionLocked]);

  const placedFacts = board ? countPlaced(board, "fact") : 0;
  const placedSongs = board ? countPlaced(board, "song") : 0;
  const totalSlots = gameRows.length;
  const isComplete = totalSlots > 0 && placedFacts === totalSlots && placedSongs === totalSlots;
  const canSubmit = Boolean(board && isComplete && authPlayer && !interactionLocked);
  const canRandomFill = Boolean(board && gameRows.length && !submitting && !correctionRunning);

  const validateLoginFields = () => {
    const email = loginEmail.trim().toLowerCase();

    if (!supabase) {
      return { email, error: "Supabase env vars are not configured yet." };
    }

    if (!EMAIL_PATTERN.test(email)) {
      return { email, error: "Enter a valid email address." };
    }

    if (!loginPassword) {
      return { email, error: "Enter your password." };
    }

    return { email, error: "" };
  };

  const handleSignIn = async () => {
    const { email, error } = validateLoginFields();

    if (error || !supabase) {
      setAuthError(error);
      return;
    }

    setAuthWorking(true);
    setAuthError("");
    setStatusMessage("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: loginPassword,
    });

    if (signInError) {
      setAuthError(signInError.message);
    } else {
      setLoginPassword("");
    }

    setAuthWorking(false);
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    setAuthWorking(true);
    setAuthError("");
    setStatusMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthPlayer(null);
      setLoginPassword("");
    }

    setAuthWorking(false);
  };

  const handleSubmit = async () => {
    if (!board || !canSubmit) {
      return;
    }

    setSubmitting(true);
    setStatusMessage("");

    try {
      const result = await submitGuesses({
        rows: gameRows,
        board,
        itemsById,
      });
      setHasSubmitted(true);
      void runCorrectionReveal(result.results);

      confetti({
        particleCount: 110,
        spread: 72,
        origin: { y: 0.74 },
        colors: ["#1DB954", "#ffffff", "#7dd3fc", "#fca5a5"],
      });

      setStatusMessage(
        result.mode === "demo"
          ? `Demo score: ${result.score} / ${result.maxScore}.`
          : [
              `Submitted. Score: ${result.score} / ${result.maxScore}.`,
              result.needsFunctionDeploy
                ? "Deploy the updated submit-guesses function to reveal missed answers."
                : "",
            ]
              .filter(Boolean)
              .join(" "),
      );

      window.setTimeout(() => {
        refreshLeaderboard();
      }, 1500);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (!gameRows.length) {
      return;
    }

    clearCorrectionTimers();
    correctionRunRef.current += 1;
    setBoard(createInitialBoard(gameRows));
    setHasSubmitted(false);
    setCorrectionRunning(false);
    setItemVisualState({});
    setStatusMessage("");
  };

  const handleRandomFill = () => {
    if (!gameRows.length) {
      return;
    }

    clearCorrectionTimers();
    correctionRunRef.current += 1;
    setBoard(createRandomBoard(gameRows));
    setHasSubmitted(false);
    setCorrectionRunning(false);
    setItemVisualState({});
    setStatusMessage("");
  };

  const authStatusMessage =
    statusMessage ||
    (isSupabaseConfigured()
      ? ""
      : "Supabase env vars are not configured yet; login and submissions are disabled.");

  if (authLoading) {
    return (
      <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(135deg,#f5fff3_0%,#d7f3d2_46%,#b9e8d8_100%)] px-4 text-ink">
        <IconWallpaper />
        <div className="relative z-10 flex items-center gap-3 rounded-lg border border-white/70 bg-white/75 px-5 py-4 shadow-cloud backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin text-spotify" aria-hidden="true" />
          <span className="text-sm font-medium">Checking login</span>
        </div>
      </main>
    );
  }

  if (!authPlayer) {
    return (
      <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(135deg,#f7fff4_0%,#dcf6d8_48%,#fff0df_100%)] px-4 text-ink">
        <IconWallpaper />
        <div className="relative z-10 w-full max-w-sm">
          <PlayerPanel
            authPlayer={null}
            authLoading={authLoading}
            authWorking={authWorking}
            authError={authError}
            loginEmail={loginEmail}
            loginPassword={loginPassword}
            canSubmit={false}
            canRandomFill={false}
            submitting={false}
            statusMessage={authStatusMessage}
            onLoginEmailChange={setLoginEmail}
            onLoginPasswordChange={setLoginPassword}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onSubmit={handleSubmit}
            onReset={handleReset}
            onRandomFill={handleRandomFill}
          />
        </div>
      </main>
    );
  }

  if (loadingGame || !board) {
    return (
      <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(135deg,#f5fff3_0%,#d7f3d2_46%,#b9e8d8_100%)] px-4 text-ink">
        <IconWallpaper />
        <div className="relative z-10 flex items-center gap-3 rounded-lg border border-white/70 bg-white/75 px-5 py-4 shadow-cloud backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin text-spotify" aria-hidden="true" />
          <span className="text-sm font-medium">Loading game data</span>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f7fff4_0%,#dcf6d8_34%,#bfe9d9_68%,#fff0df_100%)] text-ink">
      <IconWallpaper />
      <div className="relative z-10 flex w-full max-w-none flex-col gap-5 px-2 py-4 sm:px-3 lg:px-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[240px_minmax(0,1.25fr)_minmax(0,1.85fr)_280px]">
            <PlayerPanel
              authPlayer={authPlayer}
              authLoading={authLoading}
              authWorking={authWorking}
              authError={authError}
              loginEmail={loginEmail}
              loginPassword={loginPassword}
              canSubmit={canSubmit}
              canRandomFill={canRandomFill}
              submitting={submitting}
              statusMessage={statusMessage || warningMessage}
              onLoginEmailChange={setLoginEmail}
              onLoginPasswordChange={setLoginPassword}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
              onSubmit={handleSubmit}
              onReset={handleReset}
              onRandomFill={handleRandomFill}
            />

            {hasSubmitted ? (
              <SpotifyPlaylistCard playlistId="2zgpFDaWv6PVkrlBC9VYKJ" />
            ) : (
              <section className="rounded-lg border border-white/70 bg-white/70 p-4 text-ink shadow-cloud backdrop-blur">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-spotify" aria-hidden="true" />
                  <h2 className="text-base font-semibold">Facts</h2>
                </div>
                <DroppableList
                  droppableId={FACT_POOL_ID}
                  kind="fact"
                  itemIds={board.pools.fact}
                  itemsById={itemsById}
                  emptyLabel="All facts placed"
                  layout="horizontal"
                  itemClassName="w-[340px] shrink-0"
                  className="min-h-[180px] overflow-x-auto"
                  disabled={interactionLocked}
                  itemVisualState={itemVisualState}
                />
              </section>
            )}

            <section className="rounded-lg border border-white/70 bg-white/70 p-4 text-ink shadow-cloud backdrop-blur">
              <div className="mb-3 flex items-center gap-2">
                <Music2 className="h-5 w-5 text-spotify" aria-hidden="true" />
                <h2 className="text-base font-semibold">Songs</h2>
              </div>
              <DroppableList
                droppableId={SONG_POOL_ID}
                kind="song"
                itemIds={board.pools.song}
                itemsById={itemsById}
                emptyLabel="All songs placed"
                layout="horizontal"
                itemClassName="w-[560px] shrink-0"
                className="min-h-[260px] overflow-x-auto"
                disabled={interactionLocked}
                itemVisualState={itemVisualState}
              />
            </section>

            <LeaderboardPanel
              entries={leaderboard}
              loading={loadingLeaderboard}
              source={leaderboardSource}
            />
          </section>

          <section className="grid auto-rows-min justify-items-center gap-x-4 gap-y-6 pb-4 md:grid-cols-2 xl:grid-cols-10">
            {gameRows.map((row, index) => (
              <article
                key={row.id}
                className={[
                  "w-full max-w-[290px] rounded-lg border border-white/75 bg-white/68 p-2 text-ink shadow-cloud backdrop-blur-xl transition-colors hover:bg-white/82 hover:shadow-glow",
                  personStaggerClasses[index % personStaggerClasses.length],
                ].join(" ")}
              >
                <div className="mb-2 flex min-h-10 items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/80 bg-[linear-gradient(135deg,#d8f7cc,#fff4df)] text-xs font-black text-leaf shadow-sm">
                      {row.imageUrl ? (
                        <img
                          src={row.imageUrl}
                          alt={`${row.name} profile`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span aria-hidden="true">{getInitials(row.name)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-bold text-ink">{row.name}</h2>
                    </div>
                  </div>
                  {board.slots[row.id].fact.length && board.slots[row.id].song.length ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-spotify" aria-label="Complete" />
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase leading-3 text-leaf/50">
                      <FileText className="h-3 w-3" aria-hidden="true" />
                      Fact
                    </div>
                    <DroppableList
                      droppableId={`slot:${row.id}:fact`}
                      kind="fact"
                      itemIds={board.slots[row.id].fact}
                      itemsById={itemsById}
                      emptyLabel="Drop fact"
                      compact
                      className="min-h-[124px]"
                      disabled={interactionLocked}
                      itemVisualState={itemVisualState}
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase leading-3 text-leaf/50">
                      <Music2 className="h-3 w-3" aria-hidden="true" />
                      Song
                    </div>
                    <DroppableList
                      droppableId={`slot:${row.id}:song`}
                      kind="song"
                      itemIds={board.slots[row.id].song}
                      itemsById={itemsById}
                      emptyLabel="Drop song"
                      compact
                      className="min-h-[124px]"
                      disabled={interactionLocked}
                      itemVisualState={itemVisualState}
                    />
                  </div>
                </div>
              </article>
            ))}
          </section>
        </DragDropContext>
      </div>
    </main>
  );
}

export default App;
