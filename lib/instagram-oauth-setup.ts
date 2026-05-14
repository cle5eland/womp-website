import "server-only";

/**
 * One-time Instagram Business Login helpers (Instagram API with Instagram Login).
 * @see https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
 */

const AUTHORIZE = "https://www.instagram.com/oauth/authorize";
const ACCESS_TOKEN = "https://api.instagram.com/oauth/access_token";
const LONG_LIVED = "https://graph.instagram.com/access_token";

const OAUTH_SCOPE = "instagram_business_basic";

export const IG_OAUTH_STATE_COOKIE = "ig_oauth_state";

type ShortLivedExchangeSuccess = {
  access_token: string;
  user_id?: string;
};

function parseShortLivedBody(json: unknown): ShortLivedExchangeSuccess | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  if (typeof root.access_token === "string") {
    return {
      access_token: root.access_token,
      user_id:
        typeof root.user_id === "string"
          ? root.user_id
          : typeof root.user_id === "number"
            ? String(root.user_id)
            : undefined,
    };
  }
  const data = root.data;
  if (Array.isArray(data) && data[0] && typeof data[0] === "object") {
    const row = data[0] as Record<string, unknown>;
    if (typeof row.access_token === "string") {
      return {
        access_token: row.access_token,
        user_id:
          typeof row.user_id === "string"
            ? row.user_id
            : typeof row.user_id === "number"
              ? String(row.user_id)
              : undefined,
      };
    }
  }
  return null;
}

export function instagramSetupRoutesEnabled(): boolean {
  return process.env.INSTAGRAM_ENABLE_OAUTH_SETUP === "true";
}

export function buildAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const u = new URL(AUTHORIZE);
  u.searchParams.set("client_id", params.clientId);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", OAUTH_SCOPE);
  u.searchParams.set("state", params.state);
  return u.toString();
}

export async function exchangeCodeForShortLivedToken(input: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}): Promise<ShortLivedExchangeSuccess> {
  const body = new URLSearchParams({
    client_id: input.clientId,
    client_secret: input.clientSecret,
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
    code: input.code,
  });

  const res = await fetch(ACCESS_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const msg =
      raw && typeof raw === "object" && "error_message" in raw
        ? String((raw as { error_message?: string }).error_message)
        : `HTTP ${res.status}`;
    throw new Error(`Short-lived token exchange failed: ${msg}`);
  }

  const parsed = parseShortLivedBody(raw);
  if (!parsed) {
    throw new Error("Short-lived token exchange: unexpected response shape");
  }
  return parsed;
}

export async function exchangeShortLivedForLongLived(input: {
  clientSecret: string;
  shortLivedAccessToken: string;
}): Promise<{ access_token: string; expires_in?: number }> {
  const u = new URL(LONG_LIVED);
  u.searchParams.set("grant_type", "ig_exchange_token");
  u.searchParams.set("client_secret", input.clientSecret);
  u.searchParams.set("access_token", input.shortLivedAccessToken);

  const res = await fetch(u.toString(), { method: "GET" });
  const raw = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const msg =
      raw && typeof raw === "object" && "error" in raw
        ? JSON.stringify((raw as { error?: unknown }).error)
        : `HTTP ${res.status}`;
    throw new Error(`Long-lived token exchange failed: ${msg}`);
  }

  if (
    !raw ||
    typeof raw !== "object" ||
    typeof (raw as { access_token?: unknown }).access_token !== "string"
  ) {
    throw new Error("Long-lived token exchange: unexpected response shape");
  }

  const { access_token, expires_in } = raw as {
    access_token: string;
    expires_in?: number;
  };
  return { access_token, expires_in };
}
