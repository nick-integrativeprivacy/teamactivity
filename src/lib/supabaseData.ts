import { sampleGameRows, sampleLeaderboardEntries } from "../data/sampleGameData";
import type { DataLoadResult, GameRow, LeaderboardEntry } from "../types";
import { cleanSpotifyTrackId } from "./spotify";
import { supabase } from "./supabaseClient";

interface ParticipantRow {
  id: string;
  display_name: string;
}

interface FactOptionRow {
  id: string;
  label: string;
}

interface SongOptionRow {
  id: string;
  label?: string | null;
  spotify_track_id: string | null;
}

interface LeaderboardRow {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

const requireExpectedCount = <T>(rows: T[], label: string) => {
  if (rows.length !== 9) {
    throw new Error(`Expected 9 ${label}, found ${rows.length}.`);
  }
};

export const loadGameData = async (): Promise<DataLoadResult<GameRow[]>> => {
  if (!supabase) {
    return {
      data: sampleGameRows,
      source: "sample",
      warning: "Using sample game data until VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are configured.",
    };
  }

  try {
    const [participantsResult, factsResult, songsResult] = await Promise.all([
      supabase
        .from("participants")
        .select("id, display_name")
        .order("sort_order", { ascending: true }),
      supabase
        .from("fact_options")
        .select("id, label")
        .order("display_order", { ascending: true }),
      supabase
        .from("song_options")
        .select("id, label, spotify_track_id")
        .order("display_order", { ascending: true }),
    ]);

    if (participantsResult.error) {
      throw participantsResult.error;
    }

    if (factsResult.error) {
      throw factsResult.error;
    }

    if (songsResult.error) {
      throw songsResult.error;
    }

    const participants = (participantsResult.data ?? []) as ParticipantRow[];
    const facts = (factsResult.data ?? []) as FactOptionRow[];
    const songs = (songsResult.data ?? []) as SongOptionRow[];

    requireExpectedCount(participants, "participants");
    requireExpectedCount(facts, "facts");
    requireExpectedCount(songs, "songs");

    const rows = participants.map((participant, index) => ({
      id: participant.id,
      name: participant.display_name,
      factItemId: facts[index].id,
      fact: facts[index].label,
      songItemId: songs[index].id,
      songLabel: songs[index].label?.trim() || cleanSpotifyTrackId(songs[index].spotify_track_id ?? ""),
      songTrackId: cleanSpotifyTrackId(songs[index].spotify_track_id ?? ""),
    }));

    return { data: rows, source: "configured" };
  } catch (error) {
    return {
      data: sampleGameRows,
      source: "sample",
      warning:
        error instanceof Error
          ? `Supabase game data unavailable: ${error.message}. Showing sample data.`
          : "Supabase game data unavailable. Showing sample data.",
    };
  }
};

export const loadLeaderboard = async (): Promise<DataLoadResult<LeaderboardEntry[]>> => {
  if (!supabase) {
    return {
      data: sampleLeaderboardEntries,
      source: "sample",
      warning: "Using sample leaderboard until VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are configured.",
    };
  }

  try {
    const { data, error } = await supabase
      .from("leaderboard_entries")
      .select("id, player_name, score, created_at")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(12);

    if (error) {
      throw error;
    }

    const entries = ((data ?? []) as LeaderboardRow[]).map((entry) => ({
      id: entry.id,
      playerName: entry.player_name,
      score: entry.score,
      createdAt: entry.created_at,
    }));

    return { data: entries, source: "configured" };
  } catch (error) {
    return {
      data: sampleLeaderboardEntries,
      source: "sample",
      warning:
        error instanceof Error
          ? `Supabase leaderboard unavailable: ${error.message}. Showing sample leaderboard.`
          : "Supabase leaderboard unavailable. Showing sample leaderboard.",
    };
  }
};
