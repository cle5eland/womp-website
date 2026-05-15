"use client";

import { useLayoutEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { PressPhotoCarousel } from "@/components/press-live-carousel";
import { VideoClipsCarousel } from "@/components/video-clips-carousel";
import { SiteHeader } from "@/components/site-header";
import { SpotifyProfile } from "@/components/spotify-profile";
import { StreamingSnapshot } from "@/components/streaming-snapshot";
import type { PressShot } from "@/lib/epk-data";
import {
  bioDraft,
  bookingEmail,
  galleryImages,
  heroImage,
  heroImageUnoptimized,
  heroTagline,
  instagramProfileUrl,
  logoImage,
  navItems,
  pressKitDriveUrl,
  socialLinks,
  soundcloudProfileUrl,
  spotifyArtistEmbedSrc,
  spotifyArtistUrl,
  upcomingShows,
  videos,
  videosDriveFolderUrl,
} from "@/lib/epk-data";
import type { InstagramStats as InstagramStatsRecord } from "@/lib/instagram-types";
import type { SpotifyArtistData } from "@/lib/spotify";
import type { SoundcloudStats as SoundcloudStatsRecord } from "@/lib/soundcloud-types";

/** Local calendar day `YYYY-MM-DD` for comparing `upcomingShows[].endDate`. */
function localDateYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.06 * i,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/** Matches Tailwind `lg` (1024px) — hero lock only below this width. */
const MOBILE_HERO_MQ = "(max-width: 1023px)";

/**
 * Snapshot `window.innerHeight` once per relevant layout change on small viewports.
 * iOS Safari changes `vh` / `dvh` / often `svh` as the URL bar hides while scrolling;
 * we intentionally do **not** listen to `resize`, so the hero block stays one height.
 */
function useMobileHeroHeightLock() {
  const [px, setPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const apply = () => {
      if (!window.matchMedia(MOBILE_HERO_MQ).matches) {
        setPx(null);
        return;
      }
      setPx(window.innerHeight);
    };

    apply();
    window.addEventListener("orientationchange", apply);
    const mq = window.matchMedia(MOBILE_HERO_MQ);
    mq.addEventListener("change", apply);
    return () => {
      window.removeEventListener("orientationchange", apply);
      mq.removeEventListener("change", apply);
    };
  }, []);

  return px;
}

function SectionShell({
  id,
  kicker,
  title,
  children,
  className = "",
}: {
  id?: string;
  kicker?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative scroll-mt-24 border-t border-white/[0.07] px-5 py-20 sm:px-8 md:px-12 lg:px-16 ${className}`}
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 max-w-3xl"
        >
          {kicker ? (
            <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[var(--accent)]">
              {kicker}
            </p>
          ) : null}
          <h2
            className={
              "font-display text-5xl uppercase leading-[0.95] text-white sm:text-6xl md:text-7xl " +
              (kicker ? "mt-3" : "")
            }
          >
            {title}
          </h2>
        </motion.div>
        {children}
      </div>
    </section>
  );
}

export function EpkLanding({
  pressShots,
  spotify,
  soundcloud,
  instagram,
}: {
  pressShots: PressShot[];
  spotify: SpotifyArtistData | null;
  soundcloud: SoundcloudStatsRecord | null;
  instagram: InstagramStatsRecord | null;
}) {
  // Slim down the full SoundCloud record to the three numbers the UI tile
  // grid actually displays. Mirrors how `spotify.stats` is passed below.
  const soundcloudBundle = soundcloud
    ? {
        followers: soundcloud.followersCount,
        totalPlays: soundcloud.totalPlays,
        trackCount: soundcloud.trackCount,
      }
    : null;

  // Same slimming for Instagram. Three nullable numbers so the UI can tell
  // "no data" from a real `0` (see Spotify followers parallel).
  const instagramBundle = instagram
    ? {
        followers: instagram.followersCount,
        following: instagram.followsCount,
        posts: instagram.mediaCount,
      }
    : null;

  const mergedPhotos: PressShot[] = (() => {
    const seen = new Set<string>();
    const out: PressShot[] = [];
    for (const p of pressShots) {
      if (!seen.has(p.src)) {
        seen.add(p.src);
        out.push(p);
      }
    }
    for (const g of galleryImages) {
      if (!seen.has(g.src)) {
        seen.add(g.src);
        out.push({ src: g.src, alt: g.alt });
      }
    }
    return out;
  })();

  const todayYmd = localDateYmd(new Date());
  const futureShows = upcomingShows.filter((s) => s.endDate >= todayYmd);

  const mobileHeroLockPx = useMobileHeroHeightLock();

  return (
    <div className="relative min-h-screen bg-[#050505] text-zinc-200">
      <div className="grain" aria-hidden />

      <SiteHeader
        logoHref="/"
        navItems={navItems}
        showBookingContact
        instagramHref={instagramProfileUrl}
        spotifyHref={spotifyArtistUrl}
        soundcloudHref={soundcloudProfileUrl}
      />

      <main id="top">
        {/* Hero — fullscreen; mobile height locked via useMobileHeroHeightLock */}
        <section
          className="relative flex max-lg:h-[100svh] max-lg:max-h-[100svh] flex-col justify-end overflow-hidden lg:min-h-screen lg:min-h-[100svh] lg:max-h-none"
          style={
            mobileHeroLockPx !== null
              ? {
                  height: mobileHeroLockPx,
                  minHeight: mobileHeroLockPx,
                  maxHeight: mobileHeroLockPx,
                }
              : undefined
          }
        >
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              unoptimized={heroImageUnoptimized}
              className="object-cover object-center brightness-[1.08] contrast-[1.02] saturate-[1.05]"
              sizes="100vw"
            />
            {/*
              Soft fade at the very bottom only — keeps the join to the next
              section from looking sharp without darkening the photo overall.
              Previous full-canvas scrims removed at the user's request.
            */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050505] to-transparent" />
          </div>
          <div className="relative z-10 mx-auto hidden w-full max-w-6xl px-5 pb-8 pt-32 sm:px-8 sm:pb-10 md:block md:px-12 md:pb-12">
            <div className="max-w-xl border border-white/15 bg-[#050505]/55 p-6 shadow-[0_0_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-8">
              <motion.p
                custom={0}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="text-[10px] font-semibold uppercase tracking-[0.55em] text-[var(--accent)] drop-shadow-[0_1px_12px_rgba(0,0,0,0.85)]"
              >
                Electronic press kit
              </motion.p>
              <motion.h1
                custom={1}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="mt-4 block w-full min-w-0 sm:mt-5"
              >
                <span className="relative block h-14 w-44 shrink-0 sm:h-16 sm:w-52 md:h-[4.75rem] md:w-60">
                  <Image
                    src={logoImage}
                    alt="womp"
                    fill
                    className="object-contain object-left drop-shadow-[0_2px_24px_rgba(0,0,0,0.75)]"
                    sizes="(max-width: 640px) 176px, (max-width: 768px) 208px, 240px"
                    priority
                  />
                </span>
              </motion.h1>
              <motion.p
                custom={2}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-100 sm:text-base"
              >
                {heroTagline}
              </motion.p>
              <motion.div
                custom={3}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="mt-8 flex flex-wrap gap-3"
              >
                <a
                  href={pressKitDriveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="glow-box inline-flex items-center justify-center border border-[var(--accent)]/55 bg-[var(--accent)]/15 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)] transition hover:bg-[var(--accent)]/25"
                >
                  Download Press Kit
                </a>
              </motion.div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="relative z-10 mx-auto flex w-full max-w-6xl justify-center px-5 pb-4 sm:px-8"
            aria-hidden
          >
            <span className="text-[9px] uppercase tracking-[0.5em] text-zinc-600">
              scroll
            </span>
          </motion.div>
        </section>

        {/* Highlights — streaming + labels */}
        <section
          id="stats"
          className="border-t border-white/[0.07] bg-[#080807] px-5 py-8 sm:px-8 md:px-12"
        >
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 1, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              className="mb-6 max-w-2xl"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[var(--accent)]">
                At a glance
              </p>
              <h2 className="font-display mt-2 text-3xl uppercase leading-[0.95] text-white sm:text-4xl md:text-5xl">
                Highlights
              </h2>
            </motion.div>
            <StreamingSnapshot
              spotify={{
                stats: spotify?.stats ?? null,
                artistUrl: spotify?.artist.url,
              }}
              soundcloud={{
                data: soundcloudBundle,
                artistUrl: soundcloud?.profileUrl ?? soundcloudProfileUrl,
              }}
              instagram={{
                data: instagramBundle,
                artistUrl: instagram?.profileUrl ?? instagramProfileUrl,
              }}
            />
          </div>
        </section>

        <SectionShell id="bio" kicker="Artist" title="Bio">
          <motion.div
            initial={{ opacity: 1, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            className="max-w-3xl space-y-5 text-sm leading-relaxed text-zinc-400"
          >
            <p className="border-l-2 border-[var(--accent)]/60 pl-5 text-base text-zinc-300">
              {bioDraft.lead}
            </p>
            {bioDraft.body.map((paragraph, i) => (
              <p key={i} className="text-zinc-400">
                {paragraph}
              </p>
            ))}
          </motion.div>
        </SectionShell>

        <SectionShell id="shows" kicker="Live" title="Upcoming shows">
          <div className="grid gap-4">
            {futureShows.length === 0 ? (
              <p className="text-sm text-zinc-500">No upcoming dates right now — check back soon.</p>
            ) : (
              futureShows.map((show, i) => (
                <motion.a
                  key={`${show.date}-${show.venue}`}
                  href={show.url}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 1, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ delay: 0.06 * i }}
                  className="group block border border-white/[0.09] bg-[#0a0a09] p-6 transition hover:border-[var(--accent)]/35 hover:bg-[#0d0d0c] sm:flex sm:flex-row sm:items-end sm:justify-between"
                >
                  <div>
                    <p className="font-display text-4xl text-[var(--accent)] sm:text-5xl">
                      {show.date}
                    </p>
                    <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-white">
                      {show.venue}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{show.city}</p>
                  </div>
                  <p className="mt-3 max-w-sm text-xs leading-relaxed text-zinc-500 sm:mt-0">
                    {show.note}
                    <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)] opacity-0 transition group-hover:opacity-100">
                      Details →
                    </span>
                  </p>
                </motion.a>
              ))
            )}
          </div>
        </SectionShell>

        <SectionShell
          id="listen"
          title="Listen"
          className="!py-12 sm:!py-14 md:!py-16"
        >
          <SpotifyProfile
            data={spotify}
            embedSrc={spotifyArtistEmbedSrc}
            fallbackArtistUrl={spotifyArtistUrl}
            maxTracks={5}
          />
        </SectionShell>

        <SectionShell id="press" title="Photos">
          <PressPhotoCarousel images={mergedPhotos} />
        </SectionShell>

        <SectionShell id="video" kicker="Motion" title="Video clips">
          <motion.div
            initial={{ opacity: 1, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            className="mb-10 flex flex-col gap-4 border border-white/[0.09] bg-[#0a0a09] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          >
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              Clips below — use prev/next or the dots to browse. ProRes /
              masters and extra cuts live in the shared video folder.
            </p>
            <a
              href={videosDriveFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 border border-[var(--accent)]/35 bg-[var(--accent)]/5 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)] transition hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/10"
            >
              Video folder →
            </a>
          </motion.div>
          <VideoClipsCarousel videos={videos} />
        </SectionShell>

        <section
          id="contact"
          className="scroll-mt-24 border-t border-white/[0.07] bg-[#080807] px-5 py-16 sm:px-8 md:px-12"
        >
          <motion.div
            initial={{ opacity: 1, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            className="mx-auto max-w-6xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.04] p-8 sm:p-10 md:p-12"
          >
            <div className="grid gap-12 md:grid-cols-2 md:items-start md:gap-0">
              {/* Press kit — left */}
              <div className="min-w-0 md:pr-8 lg:pr-12">
                <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[var(--accent)]">
                  Press
                </p>
                <h3 className="font-display mt-2 text-3xl uppercase leading-[0.95] text-white sm:text-4xl">
                  Full press kit
                </h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-500">
                  Logos, hi-res photos, and rider materials live in the shared drive.
                </p>
                <a
                  href={pressKitDriveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex border border-white/30 bg-black/50 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Google Drive
                </a>
              </div>

              {/* Contact — right */}
              <div className="min-w-0 border-t border-white/[0.08] pt-10 md:border-l md:border-t-0 md:pl-8 md:pt-0 lg:pl-12">
                <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[var(--accent)]">
                  Contact
                </p>
                <a
                  href={`mailto:${bookingEmail}`}
                  className="mt-3 block font-display text-3xl uppercase leading-tight tracking-wide text-white transition hover:text-[var(--accent)] sm:text-4xl md:text-5xl"
                >
                  {bookingEmail}
                </a>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-500">
                  Bookings, press, and festival inquiries — include dates, capacity,
                  and production details when you write.
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/[0.08] bg-black px-5 py-14 sm:px-8 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">
              © {new Date().getFullYear()} · womp
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400 transition hover:text-[var(--accent)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
