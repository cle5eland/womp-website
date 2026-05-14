"use client";

/**
 * Thin React wrapper around Spotify's IFrame API.
 *
 * Docs: https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api
 *
 * Loads `https://open.spotify.com/embed/iframe-api/v1` once per page, creates
 * a controller pointing at `initialUri`, and re-issues `loadUri(uri)` whenever
 * the `uri` prop changes. Falls back to a plain iframe if the script never
 * loads (network blocked, etc.).
 */

import { useEffect, useRef, useState } from "react";

type SpotifyEmbedController = {
  loadUri: (uri: string) => void;
  play: () => void;
  resume: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  destroy: () => void;
  addListener: (event: string, cb: (data: unknown) => void) => void;
  removeListener: (event: string) => void;
};

type SpotifyIframeAPI = {
  createController: (
    element: HTMLElement,
    options: {
      uri: string;
      width?: string | number;
      height?: string | number;
      theme?: number | string;
    },
    callback: (controller: SpotifyEmbedController) => void,
  ) => void;
};

declare global {
  interface Window {
    SpotifyIframeApi?: SpotifyIframeAPI;
    onSpotifyIframeApiReady?: (api: SpotifyIframeAPI) => void;
  }
}

const IFRAME_API_SRC = "https://open.spotify.com/embed/iframe-api/v1";
let apiPromise: Promise<SpotifyIframeAPI> | null = null;

function loadIframeApi(): Promise<SpotifyIframeAPI> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("iframe-api: server-side"));
  }
  if (window.SpotifyIframeApi) return Promise.resolve(window.SpotifyIframeApi);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<SpotifyIframeAPI>((resolve, reject) => {
    const existingReady = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (api) => {
      window.SpotifyIframeApi = api;
      if (typeof existingReady === "function") {
        try {
          existingReady(api);
        } catch {
          /* swallow chained errors */
        }
      }
      resolve(api);
    };

    const existingTag = document.querySelector<HTMLScriptElement>(
      `script[data-spotify-iframe-api]`,
    );
    if (existingTag) return;

    const tag = document.createElement("script");
    tag.src = IFRAME_API_SRC;
    tag.async = true;
    tag.dataset.spotifyIframeApi = "true";
    tag.onerror = () => reject(new Error("iframe-api: script load failed"));
    document.head.appendChild(tag);
  });

  return apiPromise;
}

type Props = {
  /** Spotify URI (e.g. `spotify:track:5E8v5sZHdpBDzzdRbI7GNr`). */
  uri: string;
  /** Fallback embed URL used when the IFrame API can't load. */
  fallbackEmbedSrc: string;
  height?: number;
  /** 0 = default dark theme. */
  theme?: number;
  /** Called once the controller is ready, with a play() shortcut. */
  onReady?: (controller: SpotifyEmbedController) => void;
  /** Optional className applied to the player container. */
  className?: string;
};

export function SpotifyIframePlayer({
  uri,
  fallbackEmbedSrc,
  height = 352,
  theme = 0,
  onReady,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const [failed, setFailed] = useState(false);

  // Initialize the controller once.
  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;
    const node = containerRef.current;

    loadIframeApi()
      .then((api) => {
        if (cancelled || !node.isConnected) return;
        api.createController(
          node,
          { uri, width: "100%", height, theme },
          (controller) => {
            if (cancelled) {
              controller.destroy();
              return;
            }
            controllerRef.current = controller;
            onReady?.(controller);
          },
        );
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (controllerRef.current) {
        try {
          controllerRef.current.destroy();
        } catch {
          /* noop */
        }
        controllerRef.current = null;
      }
      // Spotify's controller injects an iframe into `node`. Clear it on unmount
      // so React doesn't try to reconcile foreign children later.
      node.innerHTML = "";
    };
    // Only re-init on mount; `uri` changes are handled by loadUri below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch tracks/albums on subsequent uri changes.
  useEffect(() => {
    if (controllerRef.current) {
      try {
        controllerRef.current.loadUri(uri);
      } catch {
        /* noop */
      }
    }
  }, [uri]);

  if (failed) {
    return (
      <iframe
        data-testid="embed-iframe"
        title="Spotify embed"
        src={fallbackEmbedSrc}
        width="100%"
        height={height}
        style={{ borderRadius: 12, border: 0 }}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className={className}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: height, borderRadius: 12, overflow: "hidden" }}
    />
  );
}
