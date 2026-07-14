import { Music2 } from "lucide-react";
import { cleanSpotifyTrackId } from "../lib/spotify";

interface MusicCardProps {
  trackId: string;
  label?: string;
  compact?: boolean;
}

export function MusicCard({ trackId, label, compact = false }: MusicCardProps) {
  const cleanedId = cleanSpotifyTrackId(trackId);

  if (!cleanedId) {
    return (
      <div className="rounded-lg border border-leaf/10 bg-white px-3 py-3 text-sm font-semibold leading-5 text-ink shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-leaf/55">
          <Music2 className="h-3.5 w-3.5 text-spotify" aria-hidden="true" />
          Song
        </div>
        <p className={compact ? "text-xs leading-4" : ""}>{label || "Song link coming soon"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-leaf/10 bg-white shadow-sm">
      <iframe
        title={`Spotify track ${cleanedId}`}
        src={`https://open.spotify.com/embed/track/${cleanedId}?utm_source=generator&theme=0`}
        width="100%"
        height={compact ? "80" : "152"}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block opacity-90 transition-opacity hover:opacity-100"
      />
      {!compact ? (
        <div className="flex min-h-8 items-center gap-2 border-t border-leaf/10 px-3 text-xs font-medium text-leaf/60">
          <Music2 className="h-3.5 w-3.5 text-spotify" aria-hidden="true" />
          <span className="truncate">{label || cleanedId}</span>
        </div>
      ) : null}
    </div>
  );
}
