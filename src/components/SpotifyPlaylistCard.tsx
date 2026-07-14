import { ListMusic } from "lucide-react";

interface SpotifyPlaylistCardProps {
  playlistId: string;
}

export function SpotifyPlaylistCard({ playlistId }: SpotifyPlaylistCardProps) {
  return (
    <section className="rounded-lg border border-white/70 bg-white/70 p-4 text-ink shadow-cloud backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <ListMusic className="h-5 w-5 text-spotify" aria-hidden="true" />
        <h2 className="text-base font-semibold">Team playlist</h2>
      </div>
      <div className="overflow-hidden rounded-lg border border-leaf/10 bg-white shadow-sm">
        <iframe
          title="Team Spotify playlist"
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height="352"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="block"
        />
      </div>
    </section>
  );
}
