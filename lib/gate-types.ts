/**
 * Client-safe download-gate types.
 *
 * Everything that touches the database or the SoundCloud network lives in
 * `server-only` modules; this file holds only data shapes so it can be
 * imported from both server and client components.
 *
 * Note the split between `GateRecord` (the full row, including where the
 * deliverable file lives) and `PublicGate` (what a gate page is allowed to send
 * to the browser). `toPublicGate` in `lib/gate-store.ts` is the only bridge
 * between them, so a download URL cannot reach the client by accident.
 */

/**
 * SoundCloud writes plus Spotify honor-system steps. Spotify kinds are
 * fulfilled by opening Spotify and attesting; they never call a fan token.
 */
export type GateActionKind =
  | "like"
  | "repost"
  | "comment"
  | "follow"
  | "spotify_follow";

export const GATE_ACTION_KINDS: readonly GateActionKind[] = [
  "like",
  "repost",
  "comment",
  "follow",
  "spotify_follow",
] as const;

export type GateActionProvider = "soundcloud" | "spotify";

export function actionProvider(kind: GateActionKind): GateActionProvider {
  return kind.startsWith("spotify_") ? "spotify" : "soundcloud";
}

export function isSpotifyAction(kind: GateActionKind): boolean {
  return actionProvider(kind) === "spotify";
}

export type GateStatus = "draft" | "published" | "archived";

export type GateDeliveryKind = "blob" | "external_url";

/** Which actions this gate requires before the download unlocks. */
export type GateRequirements = Record<GateActionKind, boolean>;

/**
 * New gates require the SoundCloud actions and leave Spotify off until an
 * admin ticks it. `parseRequirements` starts from this object.
 */
export const DEFAULT_GATE_REQUIREMENTS: GateRequirements = {
  like: true,
  repost: true,
  comment: true,
  follow: true,
  spotify_follow: false,
};

/** Full database row. Server-side only in practice — see `PublicGate`. */
export type GateRecord = {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  description: string | null;
  status: GateStatus;
  /** The SoundCloud track URL as pasted by the admin. */
  soundcloudUrl: string;
  trackUrn: string;
  trackId: number;
  trackTitle: string;
  trackPermalinkUrl: string;
  artworkUrl: string | null;
  /** Track owner — the follow target when `requirements.follow` is set. */
  artistUserUrn: string;
  artistUsername: string;
  /** Null means the site default (WOMP). */
  spotifyArtistId: string | null;
  spotifyArtistName: string | null;
  requirements: GateRequirements;
  deliveryKind: GateDeliveryKind;
  /** Vercel Blob URL. Never sent to the client. */
  deliveryBlobUrl: string | null;
  /** Artist-hosted URL. Never sent to the client. */
  deliveryExternalUrl: string | null;
  deliveryFilename: string | null;
  deliveryContentType: string | null;
  deliverySizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
};

/** The projection of a gate that is safe to render into the page. */
export type PublicGate = {
  slug: string;
  title: string;
  description: string | null;
  trackTitle: string;
  trackPermalinkUrl: string;
  artworkUrl: string | null;
  artistUsername: string;
  trackId: number;
  requirements: GateRequirements;
  /** Present so the UI can label the download button. */
  deliveryFilename: string | null;
  /** Public Spotify artist page the follow step opens. */
  spotifyArtistName: string;
  spotifyArtistUrl: string;
};

/** The connected SoundCloud fan, as returned by `GET /me`. */
export type GateFanIdentity = {
  userUrn: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  permalinkUrl: string | null;
};

/** Name + email from the claim cookie / contact form. */
export type GateClaimIdentity = {
  firstName: string;
  email: string;
};

/**
 * Per-action completion state. ISO timestamps rather than booleans so the UI
 * can show when something happened, and so the non-idempotent comment endpoint
 * has a durable guard against duplicate posts.
 */
export type GateProgress = {
  like: string | null;
  repost: string | null;
  comment: string | null;
  follow: string | null;
  spotifyFollow: string | null;
  emailCapturedAt: string | null;
  unlockedAt: string | null;
};

export const EMPTY_PROGRESS: GateProgress = {
  like: null,
  repost: null,
  comment: null,
  follow: null,
  spotifyFollow: null,
  emailCapturedAt: null,
  unlockedAt: null,
};

/** Unlock row, including the details we collect from the fan. */
export type GateUnlockRecord = {
  id: string;
  gateId: string;
  soundcloudUserUrn: string | null;
  soundcloudUsername: string | null;
  firstName: string | null;
  email: string | null;
  marketingConsentAt: string | null;
  progress: GateProgress;
  downloadCount: number;
  lastDownloadAt: string | null;
  createdAt: string;
};

/** What `/gate/[slug]` hands to the interactive client component. */
export type GateViewState = {
  gate: PublicGate;
  /** Present once the fan has submitted (or resumed) name + email. */
  claim: GateClaimIdentity | null;
  fan: GateFanIdentity | null;
  progress: GateProgress;
  /** True once every required action is done AND we have an email. */
  unlocked: boolean;
  /** Set when SoundCloud is stubbed for local development. */
  mockMode: boolean;
};

/** Discriminated result shape shared by every gate mutation endpoint. */
export type GateActionResponse =
  | {
      ok: true;
      progress: GateProgress;
      unlocked: boolean;
    }
  | {
      ok: false;
      error: string;
      /** True when the fan needs to reconnect their SoundCloud account. */
      reconnect?: boolean;
    };

/** Human-readable labels, colocated so admin and gate UIs cannot drift. */
export const GATE_ACTION_LABELS: Record<
  GateActionKind,
  { title: string; helper: string; cta: string; done: string }
> = {
  like: {
    title: "Like the track",
    helper: "Adds this track to your SoundCloud likes.",
    cta: "Like",
    done: "Liked",
  },
  repost: {
    title: "Repost to your followers",
    helper: "Shares the track with everyone who follows you.",
    cta: "Repost",
    done: "Reposted",
  },
  comment: {
    title: "Leave a comment",
    helper: "Write your own words — say whatever you actually think.",
    cta: "Post comment",
    done: "Commented",
  },
  follow: {
    title: "Follow on SoundCloud",
    helper: "Get new releases in your SoundCloud feed.",
    cta: "Follow",
    done: "Following",
  },
  spotify_follow: {
    title: "Follow on Spotify",
    helper: "Opens the artist on Spotify. Follow there, then come back.",
    cta: "I followed",
    done: "Followed",
  },
};

/**
 * Minimum comment length. The API terms only permit comments that the fan
 * "specifically and deliberately" writes, so the UI never pre-fills the box and
 * the server rejects anything too short to be a real comment.
 */
export const MIN_COMMENT_LENGTH = 3;
export const MAX_COMMENT_LENGTH = 1000;

/** Slugs are hand-set by the admin and form the public `/gate/<slug>` URL. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_SLUG_LENGTH = 64;

/** Best-effort tidy-up of admin input; the caller still validates the result. */
export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(slug);
}

/** Returns the actions this gate requires, in display order. */
export function requiredActions(
  requirements: GateRequirements,
): GateActionKind[] {
  return GATE_ACTION_KINDS.filter((kind) => requirements[kind]);
}

/** Progress field for a given action kind. */
export function progressKey(
  kind: GateActionKind,
): Exclude<keyof GateProgress, "emailCapturedAt" | "unlockedAt"> {
  return kind === "spotify_follow" ? "spotifyFollow" : kind;
}

/** SoundCloud / Spotify actions plus the contact form, which is always first. */
export type GateFlowStep = GateActionKind | "contact";

/**
 * The next incomplete step in the one-at-a-time flow, or `null` once
 * everything is done and the thank-you / download screen should show.
 */
export function incompleteStep(
  requirements: GateRequirements,
  progress: GateProgress,
): GateFlowStep | null {
  if (!progress.emailCapturedAt) return "contact";
  for (const kind of requiredActions(requirements)) {
    if (progress[progressKey(kind)] === null) return kind;
  }
  return null;
}

/** How many flow steps are done vs remaining, including the contact form. */
export function gateStepCounts(
  requirements: GateRequirements,
  progress: GateProgress,
): { done: number; total: number } {
  const actions = requiredActions(requirements);
  const actionDone = actions.filter(
    (kind) => progress[progressKey(kind)] !== null,
  ).length;
  const contactDone = progress.emailCapturedAt ? 1 : 0;
  return { done: actionDone + contactDone, total: actions.length + 1 };
}

/**
 * A gate is unlocked when every required action has a timestamp and the fan has
 * given us their name and email. Shared by the server (which enforces it) and
 * the client (which renders it), so the two can never disagree.
 */
export function isUnlocked(
  requirements: GateRequirements,
  progress: GateProgress,
): boolean {
  if (!progress.emailCapturedAt) return false;
  return requiredActions(requirements).every(
    (kind) => progress[progressKey(kind)] !== null,
  );
}
