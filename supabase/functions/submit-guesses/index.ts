import { createClient } from "npm:@supabase/supabase-js@2.110.2";

type GuessPayload = {
  participantId: string;
  factId: string;
  songId: string;
};

type SubmitPayload = {
  guesses: GuessPayload[];
};

type AnswerKeyRow = {
  participant_id: string;
  fact_id: string;
  song_id: string;
};

type SubmissionRow = {
  id: string;
  created_at: string;
};

const MAX_GUESSES = 9;
const MAX_SCORE = MAX_GUESSES * 2;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const readJsonSecret = (name: string) => {
  const raw = Deno.env.get(name);

  if (!raw) {
    return "";
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? "";
  } catch {
    return raw;
  }
};

const getSupabaseSecretKey = () =>
  readJsonSecret("SUPABASE_SECRET_KEYS") ||
  Deno.env.get("SUPABASE_SECRET_KEY") ||
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const deriveDisplayNameFromEmail = (email: string) => {
  const username = email.split("@")[0]?.trim() || "Player";
  const words = username
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "Player";
  }

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .slice(0, 80);
};

const parsePayload = (value: unknown): SubmitPayload | null => {
  if (!isRecord(value)) {
    return null;
  }

  const guesses = Array.isArray(value.guesses)
    ? value.guesses.map((guess) => {
        if (!isRecord(guess)) {
          return null;
        }

        return {
          participantId: asString(guess.participantId),
          factId: asString(guess.factId),
          songId: asString(guess.songId),
        };
      })
    : [];

  if (guesses.some((guess) => guess === null)) {
    return null;
  }

  return {
    guesses: guesses as GuessPayload[],
  };
};

const validatePayload = (payload: SubmitPayload) => {
  if (payload.guesses.length !== MAX_GUESSES) {
    return `Submit exactly ${MAX_GUESSES} teammate guesses.`;
  }

  const hasMissingGuess = payload.guesses.some(
    (guess) => !guess.participantId || !guess.factId || !guess.songId,
  );

  if (hasMissingGuess) {
    return "Every guess needs a participant, fact, and song.";
  }

  if (new Set(payload.guesses.map((guess) => guess.participantId)).size !== MAX_GUESSES) {
    return "Each participant can only be guessed once.";
  }

  if (new Set(payload.guesses.map((guess) => guess.factId)).size !== MAX_GUESSES) {
    return "Each fact can only be used once.";
  }

  if (new Set(payload.guesses.map((guess) => guess.songId)).size !== MAX_GUESSES) {
    return "Each song can only be used once.";
  }

  return "";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  let payload: SubmitPayload | null = null;

  try {
    payload = parsePayload(await req.json());
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  if (!payload) {
    return json({ error: "Request body is not a valid submission." }, 400);
  }

  const validationError = validatePayload(payload);

  if (validationError) {
    return json({ error: validationError }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseSecretKey = getSupabaseSecretKey();

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error("Missing Supabase server credentials for submit-guesses.");
    return json({ error: "Submission service is not configured." }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const authHeader = req.headers.get("Authorization") ?? "";

  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Log in before submitting guesses." }, 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);
  const playerEmail = user?.email?.trim().toLowerCase() ?? "";

  if (userError || !user?.id || !playerEmail) {
    console.error("Unable to verify submitting user.", userError);
    return json({ error: "Log in before submitting guesses." }, 401);
  }

  const playerName = deriveDisplayNameFromEmail(playerEmail);
  const participantIds = payload.guesses.map((guess) => guess.participantId);
  const { data: answerRows, error: answerError } = await supabaseAdmin
    .from("answer_key")
    .select("participant_id, fact_id, song_id")
    .in("participant_id", participantIds);

  if (answerError) {
    console.error("Unable to read answer key.", answerError);
    return json({ error: "Unable to score submission." }, 500);
  }

  const answers = ((answerRows ?? []) as AnswerKeyRow[]).reduce<Record<string, AnswerKeyRow>>(
    (index, row) => {
      index[row.participant_id] = row;
      return index;
    },
    {},
  );

  if (Object.keys(answers).length !== MAX_GUESSES) {
    return json({ error: "Submission includes unknown participants." }, 400);
  }

  const validFactIds = new Set(Object.values(answers).map((answer) => answer.fact_id));
  const validSongIds = new Set(Object.values(answers).map((answer) => answer.song_id));

  if (payload.guesses.some((guess) => !validFactIds.has(guess.factId))) {
    return json({ error: "Submission includes unknown facts." }, 400);
  }

  if (payload.guesses.some((guess) => !validSongIds.has(guess.songId))) {
    return json({ error: "Submission includes unknown songs." }, 400);
  }

  const scoredGuesses = payload.guesses.map((guess) => {
    const answer = answers[guess.participantId];
    const factCorrect = answer.fact_id === guess.factId;
    const songCorrect = answer.song_id === guess.songId;

    return {
      participant_id: guess.participantId,
      fact_id: guess.factId,
      song_id: guess.songId,
      fact_correct: factCorrect,
      song_correct: songCorrect,
      correct_fact_id: answer.fact_id,
      correct_song_id: answer.song_id,
      points: Number(factCorrect) + Number(songCorrect),
    };
  });

  const score = scoredGuesses.reduce((total, guess) => total + guess.points, 0);
  let submissionId = "";

  try {
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("submissions")
      .insert({
        player_user_id: user.id,
        player_name: playerName,
        player_email: playerEmail,
        score,
      })
      .select("id, created_at")
      .single<SubmissionRow>();

    if (submissionError || !submission) {
      throw submissionError ?? new Error("Submission insert failed.");
    }

    submissionId = submission.id;

    const { error: guessesError } = await supabaseAdmin.from("submission_guesses").insert(
      scoredGuesses.map(
        ({
          points: _points,
          correct_fact_id: _correctFactId,
          correct_song_id: _correctSongId,
          ...guess
        }) => ({
          ...guess,
          submission_id: submission.id,
        }),
      ),
    );

    if (guessesError) {
      throw guessesError;
    }

    const { error: leaderboardError } = await supabaseAdmin.from("leaderboard_entries").insert({
      id: submission.id,
      player_name: playerName,
      score,
      created_at: submission.created_at,
    });

    if (leaderboardError) {
      throw leaderboardError;
    }

    return json({
      submissionId: submission.id,
      score,
      maxScore: MAX_SCORE,
      results: scoredGuesses.map((guess) => ({
        participantId: guess.participant_id,
        factId: guess.fact_id,
        songId: guess.song_id,
        correctFactId: guess.correct_fact_id,
        correctSongId: guess.correct_song_id,
        factCorrect: guess.fact_correct,
        songCorrect: guess.song_correct,
      })),
    });
  } catch (error) {
    console.error("Unable to save submission.", error);

    if (submissionId) {
      await supabaseAdmin.from("submissions").delete().eq("id", submissionId);
    }

    return json({ error: "Unable to save submission." }, 500);
  }
});
