import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_GATE_REQUIREMENTS,
  EMPTY_PROGRESS,
  incompleteStep,
  isUnlocked,
} from "./gate-types.ts";
import {
  instagramProfileOpenUrl,
  parseInstagramHandle,
} from "./instagram-gate.ts";
import { parseSpotifyArtistId, spotifyArtistOpenUrl } from "./spotify-gate.ts";

describe("parseSpotifyArtistId", () => {
  it("accepts an open.spotify.com artist URL", () => {
    const parsed = parseSpotifyArtistId(
      "https://open.spotify.com/artist/64XV9aZxwoLuxf9tgvu9Pb?si=abc",
    );
    assert.deepEqual(parsed, { id: "64XV9aZxwoLuxf9tgvu9Pb" });
  });

  it("accepts a spotify:artist URI", () => {
    const parsed = parseSpotifyArtistId("spotify:artist:64XV9aZxwoLuxf9tgvu9Pb");
    assert.deepEqual(parsed, { id: "64XV9aZxwoLuxf9tgvu9Pb" });
  });

  it("treats blank as the site default", () => {
    assert.deepEqual(parseSpotifyArtistId("  "), { empty: true });
  });

  it("rejects a track URL", () => {
    const parsed = parseSpotifyArtistId(
      "https://open.spotify.com/track/7a3LWj5xSFhFRYmztS8wgK",
    );
    assert.equal("error" in parsed, true);
  });
});

describe("parseInstagramHandle", () => {
  it("accepts a bare handle and @handle", () => {
    assert.deepEqual(parseInstagramHandle("wompbass"), { handle: "wompbass" });
    assert.deepEqual(parseInstagramHandle("@WompBass"), { handle: "wompbass" });
  });

  it("accepts a profile URL", () => {
    const parsed = parseInstagramHandle(
      "https://www.instagram.com/wompbass/?hl=en",
    );
    assert.deepEqual(parsed, { handle: "wompbass" });
  });

  it("treats blank as the site default", () => {
    assert.deepEqual(parseInstagramHandle("  "), { empty: true });
  });

  it("rejects nonsense", () => {
    assert.equal("error" in parseInstagramHandle("not a handle!!!"), true);
  });
});

describe("incompleteStep", () => {
  it("asks for contact first", () => {
    assert.equal(
      incompleteStep(DEFAULT_GATE_REQUIREMENTS, EMPTY_PROGRESS),
      "contact",
    );
  });

  it("walks SoundCloud then Instagram after email (Spotify off by default)", () => {
    const progress = {
      ...EMPTY_PROGRESS,
      emailCapturedAt: "2026-01-01T00:00:00.000Z",
    };
    assert.equal(incompleteStep(DEFAULT_GATE_REQUIREMENTS, progress), "like");
    assert.equal(DEFAULT_GATE_REQUIREMENTS.instagram_follow, true);
    assert.equal(DEFAULT_GATE_REQUIREMENTS.spotify_follow, false);
  });

  it("places Instagram after Spotify when both are required", () => {
    const requirements = {
      ...DEFAULT_GATE_REQUIREMENTS,
      spotify_follow: true,
      comment: false,
    };
    const almost = {
      ...EMPTY_PROGRESS,
      emailCapturedAt: "2026-01-01T00:00:00.000Z",
      like: "2026-01-01T00:00:00.000Z",
      repost: "2026-01-01T00:00:00.000Z",
      follow: "2026-01-01T00:00:00.000Z",
      spotifyFollow: "2026-01-01T00:00:00.000Z",
    };
    assert.equal(incompleteStep(requirements, almost), "instagram_follow");
    assert.equal(isUnlocked(requirements, almost), false);
    assert.equal(
      isUnlocked(requirements, {
        ...almost,
        instagramFollow: "2026-01-01T00:00:00.000Z",
      }),
      true,
    );
  });
});

describe("open URLs", () => {
  it("builds the public Spotify artist page", () => {
    assert.equal(
      spotifyArtistOpenUrl("64XV9aZxwoLuxf9tgvu9Pb"),
      "https://open.spotify.com/artist/64XV9aZxwoLuxf9tgvu9Pb",
    );
  });

  it("builds the public Instagram profile page", () => {
    assert.equal(
      instagramProfileOpenUrl("@WompBass"),
      "https://www.instagram.com/wompbass/",
    );
  });
});
