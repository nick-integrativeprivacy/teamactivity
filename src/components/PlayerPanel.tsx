import { LockKeyhole, LogIn, LogOut, Mail, RefreshCw, Send, Shuffle, UserRound } from "lucide-react";
import type { FormEvent } from "react";
import type { AuthPlayer } from "../lib/auth";

interface PlayerPanelProps {
  authPlayer: AuthPlayer | null;
  authLoading: boolean;
  authWorking: boolean;
  authError: string;
  loginEmail: string;
  loginPassword: string;
  canSubmit: boolean;
  canRandomFill: boolean;
  submitting: boolean;
  statusMessage: string;
  onLoginEmailChange: (value: string) => void;
  onLoginPasswordChange: (value: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSubmit: () => void;
  onReset: () => void;
  onRandomFill: () => void;
}

export function PlayerPanel({
  authPlayer,
  authLoading,
  authWorking,
  authError,
  loginEmail,
  loginPassword,
  canSubmit,
  canRandomFill,
  submitting,
  statusMessage,
  onLoginEmailChange,
  onLoginPasswordChange,
  onSignIn,
  onSignOut,
  onSubmit,
  onReset,
  onRandomFill,
}: PlayerPanelProps) {
  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSignIn();
  };

  return (
    <section className="rounded-lg border border-white/70 bg-white/70 p-4 text-ink shadow-cloud backdrop-blur">
      {authPlayer ? (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-leaf/10 bg-white/65 p-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,#d8f7cc,#fff4df)] text-sm font-black text-leaf">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{authPlayer.displayName}</p>
              <p className="truncate text-xs text-leaf/55">{authPlayer.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-ink bg-ink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/15 disabled:text-ink/55"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {submitting ? "Submitting" : "Submit guesses"}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-leaf/10 bg-white/50 px-4 text-sm font-semibold text-leaf/70 transition hover:border-leaf/25 hover:text-leaf"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>

          <button
            type="button"
            onClick={onReset}
            className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-leaf/10 bg-white/50 px-4 text-sm font-semibold text-leaf/70 transition hover:border-leaf/25 hover:text-leaf"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>

          {/*
          <button
            type="button"
            onClick={onRandomFill}
            disabled={!canRandomFill}
            className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-leaf/10 bg-white/50 px-4 text-sm font-semibold text-leaf/70 transition hover:border-leaf/25 hover:text-leaf disabled:cursor-not-allowed disabled:border-leaf/10 disabled:bg-white/35 disabled:text-leaf/35"
          >
            <Shuffle className="h-4 w-4" aria-hidden="true" />
            Random fill
          </button>
          */}
        </>
      ) : (
        <form onSubmit={handleLoginSubmit}>
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-leaf/55">Email</span>
              <span className="flex min-h-11 items-center gap-2 rounded-lg border border-leaf/10 bg-white/75 px-3 focus-within:border-spotify/70">
                <Mail className="h-4 w-4 shrink-0 text-leaf/45" aria-hidden="true" />
                <input
                  value={loginEmail}
                  onChange={(event) => onLoginEmailChange(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-leaf/35"
                  placeholder="name@integrativeprivacy.com"
                  autoComplete="email"
                  inputMode="email"
                  disabled={authLoading || authWorking}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-leaf/55">Password</span>
              <span className="flex min-h-11 items-center gap-2 rounded-lg border border-leaf/10 bg-white/75 px-3 focus-within:border-spotify/70">
                <LockKeyhole className="h-4 w-4 shrink-0 text-leaf/45" aria-hidden="true" />
                <input
                  value={loginPassword}
                  onChange={(event) => onLoginPasswordChange(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-leaf/35"
                  placeholder="Password"
                  type="password"
                  autoComplete="current-password"
                  disabled={authLoading || authWorking}
                />
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={authLoading || authWorking}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-leaf/25 bg-[#a7f3b5] px-4 text-sm font-bold text-ink shadow-sm transition hover:bg-[#8ee6a0] disabled:cursor-not-allowed disabled:bg-[#ccefd2] disabled:text-ink/65"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {authWorking ? "Working" : "Log in"}
          </button>
        </form>
      )}

      {authError ? <p className="mt-3 text-sm leading-5 text-red-700">{authError}</p> : null}
      {statusMessage ? <p className="mt-3 text-sm leading-5 text-leaf/70">{statusMessage}</p> : null}
    </section>
  );
}
