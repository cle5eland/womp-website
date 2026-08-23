import "server-only";

/**
 * Auth for cron-triggered routes.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron invocations when
 * that env var is set (https://vercel.com/docs/cron-jobs/manage-cron-jobs).
 * These routes are publicly routable, so this check fails *closed*: if the
 * secret isn't configured in a deployed environment, the route refuses to run
 * rather than exposing token rotation and alerting to anyone who finds it.
 * Local dev is exempt so the routes stay easy to exercise by hand.
 */
export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

export function authorizeCronRequest(request: Request): CronAuthResult {
  const secret = process.env.CRON_SECRET;
  const isLocalDev = process.env.NODE_ENV !== "production";

  if (!secret) {
    if (isLocalDev) return { ok: true };
    return {
      ok: false,
      status: 500,
      message: "CRON_SECRET is not configured; refusing to run.",
    };
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  return { ok: true };
}
