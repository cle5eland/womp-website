"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { SpotifyIframePlayer } from "@/components/spotify-iframe-player";
import { formatCompactStat } from "@/lib/format-compact-stat";
import type { SpotifyArtistData } from "@/lib/spotify";

type Props = {
  data: SpotifyArtistData | null;
  /** Spotify embed iframe URL — used as fallback and "basic embed" mode. */
  embedSrc: string;
  /** Spotify URI for the artist (e.g. `spotify:artist:XXXX`). Defaults to the
   * artist returned in `data` if available, else derived from `embedSrc`. */
  artistUri?: string;
  fallbackArtistUrl?: string;
  /** Display variant. "rich" (default) shows photo + top tracks + interactive
   * IFrame API player. "embed" renders only the official iframe. */
  variant?: "rich" | "embed";
  maxTracks?: number;
};

const fmtDuration = (ms: number): string => {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const fmtCount = (n: number | null): string => formatCompactStat(n);

const trackUriFromId = (id: string) => `spotify:track:${id}`;

/**
 * Basic, non-interactive Spotify embed — matches the official snippet shown in
 * open.spotify.com → Share → Embed.
 */
export function SpotifyEmbed({
  src,
  height = 352,
  title = "Spotify",
  className,
}: {
  src: string;
  height?: number;
  title?: string;
  className?: string;
}) {
  return (
    <iframe
      data-testid="embed-iframe"
      title={title}
      src={src}
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

export function SpotifyProfile({
  data,
  embedSrc,
  artistUri,
  fallbackArtistUrl,
  variant = "rich",
  maxTracks = 5,
}: Props) {
  const playerControllerRef = useRef<{
    loadUri: (uri: string) => void;
    play: () => void;
    resume?: () => void;
  } | null>(null);
  const [activeUri, setActiveUri] = useState<string>(
    artistUri ?? (data ? `spotify:artist:${data.artist.id}` : ""),
  );

  if (variant === "embed" || !data) {
    return (
      <div className="glow-box border border-white/[0.1] bg-black/50 p-3">
        <p className="mb-3 px-1 text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-500">
          Spotify
        </p>
        <SpotifyEmbed src={embedSrc} title="Spotify artist embed" />
      </div>
    );
  }

  const { artist, topTracks } = data;
  const tracks = topTracks.slice(0, maxTracks);
  const headerImage = artist.image?.url ?? null;
  const initialArtistUri = artistUri ?? `spotify:artist:${artist.id}`;

  const handleTrackClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    uri: string,
  ) => {
    e.preventDefault();
    setActiveUri(uri);
    const controller = playerControllerRef.current;
    if (controller) {
      controller.loadUri(uri);
      // The controller's `play()` only resolves after `loadUri` has finished
      // wiring up the new content. A short defer covers most cases.
      setTimeout(() => {
        try {
          controller.play();
        } catch {
          /* noop */
        }
      }, 350);
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr] lg:gap-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden border border-white/[0.09] bg-[#0a0a09]"
      >
        <div className="relative aspect-square w-full bg-black">
          {headerImage ? (
            <Image
              src={headerImage}
              alt={`${artist.name} on Spotify`}
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[var(--accent)]">
              Verified artist
            </p>
            <h3 className="font-display mt-2 text-4xl uppercase leading-none text-white sm:text-5xl">
              {artist.name}
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-white/[0.07] border-t border-white/[0.07]">
          <div className="px-5 py-4">
            <p className="text-[9px] uppercase tracking-[0.35em] text-zinc-500">
              Followers
            </p>
            <p className="font-display mt-1 text-2xl text-white">
              {fmtCount(artist.followers)}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[9px] uppercase tracking-[0.35em] text-zinc-500">
              Popularity
            </p>
            <p className="font-display mt-1 text-2xl text-white">
              {artist.popularity || "—"}
              <span className="ml-1 align-top text-[10px] tracking-[0.3em] text-zinc-500">
                /100
              </span>
            </p>
          </div>
        </div>
        {artist.genres.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 border-t border-white/[0.07] px-5 py-4">
            {artist.genres.slice(0, 4).map((g) => (
              <span
                key={g}
                className="border border-white/15 px-2 py-1 text-[9px] uppercase tracking-[0.25em] text-zinc-400"
              >
                {g}
              </span>
            ))}
          </div>
        ) : null}
        <a
          href={artist.url || fallbackArtistUrl || "#"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between border-t border-white/[0.07] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)] transition hover:bg-[var(--accent)]/[0.05]"
        >
          Open on Spotify
          <span aria-hidden>→</span>
        </a>
      </motion.div>

      <div className="flex flex-col gap-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="border border-white/[0.09] bg-black/50"
        >
          <div className="border-b border-white/[0.07] px-5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-500">
              Top tracks
            </p>
          </div>
          <ol className="divide-y divide-white/[0.05]">
            {tracks.map((track, i) => {
              const uri = trackUriFromId(track.id);
              const isActive = activeUri === uri;
              return (
                <motion.li
                  key={track.id}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.04 * i }}
                  className={
                    "group transition-colors " +
                    (isActive ? "bg-[var(--accent)]/[0.06]" : "")
                  }
                >
                  <div className="grid grid-cols-[28px_44px_1fr_auto_auto] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
                    <button
                      type="button"
                      aria-label={`Play ${track.name}`}
                      onClick={(e) => handleTrackClick(e, uri)}
                      className="font-display text-2xl text-zinc-600 transition-colors hover:text-[var(--accent)]"
                    >
                      {isActive ? (
                        <span className="text-[var(--accent)]" aria-hidden>
                          ▶
                        </span>
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleTrackClick(e, uri)}
                      aria-label={`Play ${track.name}`}
                      className="relative aspect-square w-11 overflow-hidden border border-white/10 bg-black"
                    >
                      {track.album.image ? (
                        <Image
                          src={track.album.image}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleTrackClick(e, uri)}
                      className="min-w-0 text-left"
                    >
                      <p
                        className={
                          "truncate text-sm font-medium " +
                          (isActive ? "text-[var(--accent)]" : "text-white")
                        }
                      >
                        {track.name}
                        {track.explicit ? (
                          <span className="ml-2 border border-white/20 px-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400 align-middle">
                            E
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        {track.album.name}
                        {track.playcount != null
                          ? ` · ${fmtCount(track.playcount)} plays`
                          : ""}
                      </p>
                    </button>
                    <span className="text-[11px] tabular-nums text-zinc-500">
                      {fmtDuration(track.durationMs)}
                    </span>
                    <a
                      href={track.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${track.name} on Spotify`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-zinc-600 transition-colors hover:text-[var(--accent)]"
                    >
                      <span aria-hidden>↗</span>
                    </a>
                  </div>
                </motion.li>
              );
            })}
            {tracks.length === 0 ? (
              <li className="px-5 py-6 text-xs text-zinc-500">
                No top tracks available.
              </li>
            ) : null}
          </ol>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glow-box border border-white/[0.1] bg-black/50 p-2 sm:p-2.5"
        >
          <SpotifyIframePlayer
            uri={activeUri || initialArtistUri}
            fallbackEmbedSrc={embedSrc}
            height={380}
            onReady={(c) => {
              playerControllerRef.current = c;
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
