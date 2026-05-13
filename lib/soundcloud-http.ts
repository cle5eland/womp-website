import "server-only";

/**
 * Shared HTTP helper for SoundCloud requests with bounded retry on 429.
 *
 * Per the API guide
 * (https://developers.soundcloud.com/docs/api/guide#rate-limits and
 *  https://developers.soundcloud.com/docs/api/rate-limits), responses with
 * HTTP 429 indicate the caller exceeded a rate limit and must back off. We
 * honor the `Retry-After` header when present (either delta-seconds or an
 * HTTP-date), and otherwise use a capped exponential backoff with jitter.
 *
 * Retries are strictly bounded — we will not loop indefinitely on 429.
 */

export type FetchWithRetryOptions = {
  /** Maximum number of retries on retryable statuses. Default: 3. */
  maxRetries?: number;
  /** Initial backoff in ms (doubles each attempt). Default: 500. */
  baseDelayMs?: number;
  /** Hard cap on total wait time across all retries. Default: 10_000. */
  maxTotalWaitMs?: number;
  /**
   * Status codes that trigger a retry. Default: [429]. 5xx is left to the
   * caller; in our app a 5xx just means we fall back to the public hydration
   * scrape, which is the desired behavior.
   */
  retryableStatuses?: number[];
};

const DEFAULT_OPTS: Required<FetchWithRetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxTotalWaitMs: 10_000,
  retryableStatuses: [429],
};

/**
 * Parse a `Retry-After` header value (either an integer number of seconds or
 * an HTTP-date) into milliseconds. Returns `null` if the header is missing
 * or unparseable, so the caller falls back to exponential backoff.
 */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number.parseInt(trimmed, 10);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    return null;
  }
  const date = Date.parse(trimmed);
  if (Number.isFinite(date)) {
    const delta = date - Date.now();
    return delta > 0 ? delta : 0;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `fetch` wrapper that retries on retryable status codes with bounded
 * exponential backoff. All other responses (including 4xx that aren't in
 * `retryableStatuses`) are returned as-is to the caller. Network errors
 * propagate up.
 */
export async function fetchWithRetry(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1] = undefined,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const opts = { ...DEFAULT_OPTS, ...options };
  let totalWaited = 0;
  let attempt = 0;

  for (;;) {
    const res = await fetch(input, init);
    if (!opts.retryableStatuses.includes(res.status)) return res;
    if (attempt >= opts.maxRetries) return res;

    const retryAfterMs = parseRetryAfter(res.headers.get("retry-after"));
    // Exponential backoff with mild jitter (±20%) to avoid thundering-herd.
    const exponential = opts.baseDelayMs * Math.pow(2, attempt);
    const jitter = exponential * (0.8 + Math.random() * 0.4);
    const fallbackMs = Math.floor(jitter);
    const waitMs = retryAfterMs ?? fallbackMs;

    const remaining = opts.maxTotalWaitMs - totalWaited;
    if (remaining <= 0) return res;
    const effectiveWait = Math.min(waitMs, remaining);

    // Best-effort observability so operators can see when SoundCloud throttles us.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[soundcloud] 429 on ${typeof input === "string" ? input : "request"} — retrying in ${effectiveWait}ms (attempt ${attempt + 1}/${opts.maxRetries})`,
      );
    }

    await sleep(effectiveWait);
    totalWaited += effectiveWait;
    attempt += 1;
  }
}
