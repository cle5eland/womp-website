/**
 * Client-safe SoundCloud types + pure helpers.
 *
 * Anything that touches the SoundCloud network lives in `lib/soundcloud-stats.ts`
 * (which is `server-only`); this file holds only data shapes and pure
 * formatting so it can be imported from both server and client components.
 */

export type SoundcloudTrack = {
  id: number;
  title: string;
  permalinkUrl: string;
  artworkUrl: string | null;
  playbackCount: number;
  likesCount: number;
  repostsCount: number;
  commentCount: number;
  durationMs: number;
  createdAt: string | null;
};

export type SoundcloudStats = {
  permalink: string;
  username: string;
  fullName: string | null;
  description: string | null;
  city: string | null;
  countryCode: string | null;
  verified: boolean;
  avatarUrl: string | null;
  profileUrl: string;
  followersCount: number;
  followingsCount: number;
  trackCount: number;
  playlistCount: number;
  /** Likes the artist has given to other tracks/playlists. */
  likesGivenCount: number;
  /** Sum of `playback_count` across the artist's own tracks. */
  totalPlays: number;
  /** Sum of `likes_count` across the artist's own tracks. */
  totalTrackLikes: number;
  /** Sum of `reposts_count` across the artist's own tracks. */
  totalTrackReposts: number;
  topTrack: SoundcloudTrack | null;
  recentTracks: SoundcloudTrack[];
  fetchedAt: string;
};

/**
 * Compact number formatter — e.g. 1,585 / 102.8K / 1.4M. Always returns a
 * stable string for SSR rendering (locale-pinned to en-US).
 */
export function formatStatNumber(
  value: number,
  opts?: { compact?: boolean },
): string {
  if (!Number.isFinite(value)) return "—";
  if (opts?.compact && value >= 1000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US").format(value);
}
