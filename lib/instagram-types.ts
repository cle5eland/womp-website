/**
 * Client-safe Instagram types + pure helpers.
 *
 * Anything that touches the Instagram Graph API lives in
 * `lib/instagram-stats.ts` (which is `"server-only"`); this file holds only
 * data shapes and pure formatting so it can be imported from both server
 * and client components.
 */

export type InstagramStats = {
  userId: string;
  username: string;
  name: string | null;
  /** "PERSONAL" | "BUSINESS" | "CREATOR" — only the latter two expose stats. */
  accountType: string | null;
  biography: string | null;
  profilePictureUrl: string | null;
  profileUrl: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  /** ISO timestamp (UTC). */
  fetchedAt: string;
  /** Pre-formatted UTC label safe to render in SSR + hydration. */
  fetchedAtLabel: string;
};

/**
 * Slim three-number bundle consumed by the streaming snapshot UI.
 * Mirrors `SpotifyStatsBundle` and `SoundcloudStatsBundle` in shape so the
 * three panels stay visually parallel without leaking the full server-side
 * record to the client. Numbers are nullable so the UI can render "—" for
 * "no data" versus a real `0`.
 */
export type InstagramStatsBundle = {
  followers: number | null;
  following: number | null;
  posts: number | null;
};
