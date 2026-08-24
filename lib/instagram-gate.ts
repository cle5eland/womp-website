/**
 * Client-safe Instagram helpers for download-gate steps.
 *
 * Fan follow is honor-system (we open this URL; we never request a user
 * grant). These helpers only parse an admin-pasted handle or profile link and
 * build the public page we send the fan to. Graph API stats live in
 * `lib/instagram-stats.ts` and are not used here.
 */

/** WOMP. Same default as `instagramPermalink` in `lib/epk-data.ts`. */
export const DEFAULT_INSTAGRAM_HANDLE = "wompbass";

export function instagramProfileOpenUrl(handle: string): string {
  const normalized = handle.replace(/^@/, "").trim().toLowerCase();
  return `https://www.instagram.com/${normalized}/`;
}

/**
 * Accepts `@wompbass`, `wompbass`, or a full `instagram.com/…` URL. Returns
 * `{ empty: true }` for blank input (meaning "use the site default") and
 * `{ error }` when the value is present but not a usable handle.
 */
export function parseInstagramHandle(
  input: string,
): { handle: string } | { empty: true } | { error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { empty: true };

  const fromUrl = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)\/?(?:[?#].*)?$/i,
  );
  if (fromUrl) {
    const handle = fromUrl[1].toLowerCase();
    if (isValidInstagramHandle(handle)) return { handle };
    return { error: "That Instagram URL does not look like a profile." };
  }

  const bare = trimmed.replace(/^@/, "").toLowerCase();
  if (isValidInstagramHandle(bare)) return { handle: bare };

  return {
    error:
      "Paste an Instagram handle or profile URL, e.g. @wompbass or https://www.instagram.com/wompbass/",
  };
}

function isValidInstagramHandle(handle: string): boolean {
  // Instagram allows letters, numbers, periods, and underscores; 1–30 chars.
  return /^[a-z0-9._]{1,30}$/.test(handle);
}
