import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_GATE_REQUIREMENTS,
  EMPTY_PROGRESS,
  incompleteStep,
  isUnlocked,
} from "./gate-types.ts";
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

describe("incompleteStep", () => {
  it("asks for contact first", () => {
    assert.equal(
      incompleteStep(DEFAULT_GATE_REQUIREMENTS, EMPTY_PROGRESS),
      "contact",
    );
  });

  it("walks SoundCloud then Spotify after email", () => {
    const progress = {
      ...EMPTY_PROGRESS,
      emailCapturedAt: "2026-01-01T00:00:00.000Z",
    };
    assert.equal(incompleteStep(DEFAULT_GATE_REQUIREMENTS, progress), "like");
  });

  it("unlocks only when email and required actions are done", () => {
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
    };
    assert.equal(incompleteStep(requirements, almost), "spotify_follow");
    assert.equal(isUnlocked(requirements, almost), false);
    assert.equal(
      isUnlocked(requirements, {
        ...almost,
        spotifyFollow: "2026-01-01T00:00:00.000Z",
      }),
      true,
    );
  });
});

describe("spotifyArtistOpenUrl", () => {
  it("builds the public artist page", () => {
    assert.equal(
      spotifyArtistOpenUrl("64XV9aZxwoLuxf9tgvu9Pb"),
      "https://open.spotify.com/artist/64XV9aZxwoLuxf9tgvu9Pb",
    );
  });
});
