/**
 * Client-safe SoundCloud types.
 *
 * Anything that touches the SoundCloud network lives in `lib/soundcloud-stats.ts`
 * (which is `server-only`); this file holds only data shapes so it can be
 * imported from both server and client components.
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
  /** ISO timestamp (UTC). */
  fetchedAt: string;
  /** Pre-formatted UTC label safe to render in SSR + hydration. */
  fetchedAtLabel: string;
};

/**
 * Slim three-number bundle that the `SoundcloudStats` UI component consumes.
 * Mirrors `SpotifyStatsBundle` in shape so the two panels can stay visually
 * parallel without leaking the full server-side record to the client.
 */
export type SoundcloudStatsBundle = {
  followers: number;
  totalPlays: number;
  trackCount: number;
};
