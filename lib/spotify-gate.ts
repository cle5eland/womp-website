/**
 * Client-safe Spotify helpers for download-gate steps.
 *
 * Fan follow is honor-system (we open this URL; we never request a user
 * grant). These helpers only parse an admin-pasted artist link and build the
 * public page we send the fan to. The official Web API lives in `lib/spotify.ts`.
 */

/** WOMP. Same default as `SPOTIFY_ARTIST_ID` / `lib/spotify.ts`. */
export const DEFAULT_SPOTIFY_ARTIST_ID = "64XV9aZxwoLuxf9tgvu9Pb";

export function spotifyArtistOpenUrl(artistId: string): string {
  return `https://open.spotify.com/artist/${artistId}`;
}

/**
 * Accepts an open.spotify.com/artist URL, a `spotify:artist:` URI, or a bare
 * id. Returns null for empty input (meaning "use the site default") and
 * `{ error }` when the value is present but not an artist link.
 */
export function parseSpotifyArtistId(
  input: string,
): { id: string } | { empty: true } | { error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { empty: true };

  const fromUrl = trimmed.match(
    /(?:open\.spotify\.com\/artist\/|spotify:artist:)([a-zA-Z0-9]+)(?:[/?]|$)/i,
  );
  if (fromUrl) return { id: fromUrl[1] };

  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return { id: trimmed };

  return {
    error: "Paste a Spotify artist URL, e.g. https://open.spotify.com/artist/…",
  };
}
