"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import { PressGallery } from "@/components/press-gallery";
import { StatsGrid, type StatItem } from "@/components/stats-grid";
import type { PressShot } from "@/lib/epk-data";
import {
  bioDraft,
  bookingEmail,
  galleryImages,
  heroImage,
  heroImageUnoptimized,
  latestRelease,
  logoImage,
  navItems,
  pressKitDriveUrl,
  socialLinks,
  soundcloudEmbedSrc,
  soundcloudProfileUrl,
  spotifyArtistEmbedSrc,
  streamingStats,
  upcomingShows,
  videos,
  videosDriveFolderUrl,
} from "@/lib/epk-data";
import {
  formatStatNumber,
  type SoundcloudStats,
} from "@/lib/soundcloud-types";

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

function SectionShell({
  id,
  kicker,
  title,
  children,
  className = "",
}: {
  id?: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <section
      id={id}
      className={`relative scroll-mt-24 border-t border-white/[0.07] px-5 py-20 sm:px-8 md:px-12 lg:px-16 ${className}`}
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 max-w-3xl"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[var(--accent)]">
            {kicker}
          </p>
          <h2 className="font-display mt-3 text-5xl uppercase leading-[0.95] text-white sm:text-6xl md:text-7xl">
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
  soundcloudStats,
}: {
  pressShots: PressShot[];
  soundcloudStats: SoundcloudStats | null;
}) {
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);

  const overviewStats: StatItem[] = [
    {
      label: "Spotify monthly listeners",
      value: streamingStats.spotifyMonthlyListeners,
    },
    {
      label: "Spotify followers",
      value: streamingStats.spotifyFollowers,
    },
    {
      label: "SoundCloud followers",
      value: soundcloudStats
        ? formatStatNumber(soundcloudStats.followersCount)
        : streamingStats.soundcloudFollowers,
    },
    {
      label: "Instagram",
      value: streamingStats.instagramFollowers,
    },
  ];

  const soundcloudFootnoteParts = soundcloudStats
    ? [
        soundcloudStats.fullName ?? "womp",
        `@${soundcloudStats.permalink}`,
        soundcloudStats.city
          ? `${soundcloudStats.city}${soundcloudStats.countryCode ? `, ${soundcloudStats.countryCode}` : ""}`
          : null,
      ].filter(Boolean)
    : null;

  return (
    <div className="relative min-h-screen bg-[#050505] text-zinc-200">
      <div className="grain" aria-hidden />

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.08] bg-[#050505]/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8 md:px-12">
          <a href="#top" className="relative block h-8 w-32 shrink-0 sm:h-9 sm:w-36">
            <Image
              src={logoImage}
              alt="womp"
              fill
              className="object-contain object-left"
              sizes="144px"
              priority
            />
          </a>
          <nav className="hidden items-center gap-7 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition hover:text-[var(--accent)]"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href={`mailto:${bookingEmail}`}
              className="hidden rounded-none border border-white/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)] sm:inline-block"
            >
              Book
            </a>
            <button
              type="button"
              className="inline-flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-white/15 md:hidden"
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="h-px w-5 bg-white" />
              <span className="h-px w-5 bg-white" />
            </button>
          </div>
        </div>
        {menuOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-black/95 md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="py-3 text-xs font-medium uppercase tracking-[0.25em] text-zinc-300"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a
                href={`mailto:${bookingEmail}`}
                className="py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]"
              >
                Book
              </a>
            </div>
          </motion.div>
        ) : null}
      </header>

      <main id="top">
        {/* Hero — fullscreen */}
        <section className="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden">
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
            {/* Lighter scrim so the photo reads; text contrast handled by panel below */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/55 to-[#050505]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/55 via-transparent to-[#050505]/35" />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-32 sm:px-8 sm:pb-24 md:px-12 md:pb-28">
            <div className="max-w-xl border border-white/15 bg-[#050505]/55 p-6 shadow-[0_0_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-8">
              <div className="relative mb-6 h-14 w-44 sm:mb-8 sm:h-16 sm:w-52" aria-hidden>
                <Image
                  src={logoImage}
                  alt=""
                  fill
                  className="object-contain object-left"
                  sizes="208px"
                  priority
                />
              </div>
              <motion.p
                custom={0}
                initial={reduce ? false : "hidden"}
                animate={reduce ? undefined : "show"}
                variants={fadeUp}
                className="text-[10px] font-semibold uppercase tracking-[0.55em] text-[var(--accent)] drop-shadow-[0_1px_12px_rgba(0,0,0,0.85)]"
              >
                Electronic press kit
              </motion.p>
              <motion.h1
                custom={1}
                initial={reduce ? false : "hidden"}
                animate={reduce ? undefined : "show"}
                variants={fadeUp}
                className="font-display mt-3 text-4xl uppercase leading-none tracking-[0.04em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.9)] sm:text-5xl"
              >
                womp
              </motion.h1>
              <motion.p
                custom={2}
                initial={reduce ? false : "hidden"}
                animate={reduce ? undefined : "show"}
                variants={fadeUp}
                className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-100 sm:text-base"
              >
                Dubstep producer & DJ — Seattle, WA. Grassroots bass, warehouse
                velocity, and stage energy built in NYC and the Pacific Northwest.
              </motion.p>
            <motion.div
              custom={3}
              initial={reduce ? false : "hidden"}
              animate={reduce ? undefined : "show"}
              variants={fadeUp}
              className="mt-8 flex flex-wrap gap-3"
            >
              <a
                href="#listen"
                className="glow-box inline-flex items-center justify-center border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
              >
                Stream
              </a>
              <a
                href={pressKitDriveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center border border-white/20 bg-black/40 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/40"
              >
                Press kit
              </a>
            </motion.div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="relative z-10 mx-auto flex w-full max-w-6xl justify-center px-5 pb-8 sm:px-8"
            aria-hidden
          >
            <span className="text-[9px] uppercase tracking-[0.5em] text-zinc-600">
              scroll
            </span>
          </motion.div>
        </section>

        {/* Streaming & social numbers (overview) */}
        <section
          id="stats"
          className="border-t border-white/[0.07] bg-[#080807] px-5 py-14 sm:px-8 md:px-12"
        >
          <StatsGrid
            items={overviewStats}
            footnote={`${streamingStats.statsNote} · Last updated ${
              soundcloudStats
                ? new Date(soundcloudStats.fetchedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : streamingStats.lastUpdated
            }`}
          />
        </section>

        {/* SoundCloud — same card UI as the overview, scoped to SoundCloud data */}
        {soundcloudStats ? (
          <section
            id="soundcloud-stats"
            className="border-t border-white/[0.07] bg-[#0a0908] px-5 py-14 sm:px-8 md:px-12"
          >
            <StatsGrid
              kicker="SoundCloud"
              kickerClassName="text-[#ff5500]"
              items={[
                {
                  label: "Followers",
                  value: formatStatNumber(soundcloudStats.followersCount),
                  href: soundcloudStats.profileUrl || soundcloudProfileUrl,
                },
                {
                  label: "Tracks",
                  value: formatStatNumber(soundcloudStats.trackCount),
                  sub:
                    soundcloudStats.playlistCount > 0
                      ? `${formatStatNumber(soundcloudStats.playlistCount)} playlist${
                          soundcloudStats.playlistCount === 1 ? "" : "s"
                        }`
                      : undefined,
                  href: soundcloudStats.profileUrl || soundcloudProfileUrl,
                },
                {
                  label: "Total plays",
                  value: formatStatNumber(soundcloudStats.totalPlays, {
                    compact: true,
                  }),
                  sub: soundcloudStats.topTrack
                    ? `Top: ${soundcloudStats.topTrack.title}`
                    : undefined,
                  href: soundcloudStats.topTrack?.permalinkUrl,
                },
                {
                  label: "Likes on tracks",
                  value: formatStatNumber(soundcloudStats.totalTrackLikes, {
                    compact: true,
                  }),
                  sub:
                    soundcloudStats.totalTrackReposts > 0
                      ? `${formatStatNumber(soundcloudStats.totalTrackReposts, {
                          compact: true,
                        })} reposts`
                      : undefined,
                },
              ]}
              footnote={
                soundcloudFootnoteParts
                  ? `${soundcloudFootnoteParts.join(" · ")} · Live from soundcloud.com`
                  : undefined
              }
            />
          </section>
        ) : null}

        <SectionShell id="release" kicker="Out now" title={latestRelease.title}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <motion.div
              initial={reduce ? false : { opacity: 0, x: -12 }}
              whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <p className="text-lg font-medium text-white">{latestRelease.subtitle}</p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                {latestRelease.description}
              </p>
              <a
                href={latestRelease.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex border border-white/20 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Open on Spotify
              </a>
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glow-box overflow-hidden border border-white/[0.1] bg-black/60 p-2 sm:p-3"
            >
              <iframe
                title="Latest release on Spotify"
                src={latestRelease.spotifyEmbedSrc}
                width="100%"
                height="380"
                className="rounded-none border-0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </motion.div>
          </div>
        </SectionShell>

        <SectionShell id="shows" kicker="Live" title="Upcoming shows">
          <div className="grid gap-4">
            {upcomingShows.map((show, i) => (
              <motion.article
                key={`${show.date}-${show.venue}`}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06 * i }}
                className="flex flex-col gap-3 border border-white/[0.09] bg-[#0a0a09] p-6 sm:flex-row sm:items-end sm:justify-between"
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
                <p className="max-w-sm text-xs leading-relaxed text-zinc-500">
                  {show.note}
                </p>
              </motion.article>
            ))}
          </div>
        </SectionShell>

        <SectionShell id="listen" kicker="DSP" title="Stream">
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glow-box border border-white/[0.1] bg-black/50 p-3"
            >
              <p className="mb-3 px-1 text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                Spotify
              </p>
              <iframe
                title="Spotify artist embed"
                src={spotifyArtistEmbedSrc}
                width="100%"
                height="400"
                className="border-0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="border border-white/[0.1] bg-black/50 p-3"
            >
              <p className="mb-3 px-1 text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                SoundCloud
              </p>
              <iframe
                title="SoundCloud"
                width="100%"
                height="400"
                scrolling="no"
                frameBorder={0}
                allow="autoplay"
                src={soundcloudEmbedSrc}
              />
            </motion.div>
          </div>
        </SectionShell>

        <SectionShell id="bio" kicker="Artist" title="Bio">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-5 text-sm leading-relaxed text-zinc-400"
            >
              <p className="border-l-2 border-[var(--accent)]/60 pl-5 text-base text-zinc-300">
                {bioDraft.elevator}
              </p>
              <p className="border border-dashed border-white/15 bg-black/30 p-5 text-zinc-500">
                {bioDraft.placeholder}
              </p>
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 }}
              className="border border-white/[0.08] bg-[#0c0c0b] p-6"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                Booking & press
              </p>
              <a
                href={`mailto:${bookingEmail}`}
                className="mt-3 block font-display text-3xl uppercase text-white hover:text-[var(--accent)]"
              >
                {bookingEmail}
              </a>
              <a
                href={pressKitDriveUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)]"
              >
                Download press kit →
              </a>
            </motion.div>
          </div>
        </SectionShell>

        <SectionShell id="press" kicker="Imagery" title="Press & live photos">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <PressGallery images={pressShots} visibleCount={4} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {galleryImages.map((img, i) => (
                <motion.figure
                  key={img.src}
                  initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                  whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * i }}
                  className="relative aspect-[4/5] overflow-hidden border border-white/10 bg-black"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 1024px) 22vw, 45vw"
                    className="object-cover"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent px-3 py-3 text-[9px] uppercase tracking-[0.25em] text-zinc-500">
                    {img.alt}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </SectionShell>

        <SectionShell id="video" kicker="Motion" title="Video clips">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 flex flex-col gap-4 border border-white/[0.09] bg-[#0a0a09] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          >
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              Embedded sets below. ProRes / masters and extra cuts live in the
              shared video folder.
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
          <div className="grid gap-6 md:grid-cols-2">
            {videos.map((video, i) => (
              <motion.article
                key={video.url}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.07 * i }}
                className="overflow-hidden border border-white/[0.09] bg-black/60"
              >
                <div className="aspect-video w-full">
                  <iframe
                    className="h-full w-full"
                    src={video.url}
                    title={video.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="border-t border-white/[0.06] px-5 py-4">
                  <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-white">
                    {video.title}
                  </h3>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                    {video.duration}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </SectionShell>

        <SectionShell id="mailing" kicker="Inner circle" title="Mailing list">
          <MailingForm />
        </SectionShell>

        <section className="border-t border-white/[0.07] bg-[#080807] px-5 py-16 sm:px-8 md:px-12">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 border border-[var(--accent)]/25 bg-[var(--accent)]/[0.04] p-8 sm:flex-row sm:items-center"
          >
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[var(--accent)]">
                Assets
              </p>
              <h3 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
                Full press kit
              </h3>
              <p className="mt-3 max-w-md text-sm text-zinc-500">
                Logos, hi-res photos, and rider materials live in the shared drive.
              </p>
            </div>
            <a
              href={pressKitDriveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 border border-white/30 bg-black/50 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Google Drive
            </a>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/[0.08] bg-black px-5 py-14 sm:px-8 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-5xl uppercase text-white">womp</p>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-zinc-600">
              © {new Date().getFullYear()} · EPK
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

function MailingForm() {
  const reduce = useReducedMotion();
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value;
    const body = encodeURIComponent(
      `Please add me to the mailing list.\n\nName: ${name || "—"}\nEmail: ${email}`,
    );
    window.location.href = `mailto:${bookingEmail}?subject=${encodeURIComponent("Mailing list signup")}&body=${body}`;
    setSent(true);
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-xl border border-white/[0.1] bg-[#0a0a09] p-6 sm:p-8"
    >
      <p className="text-sm text-zinc-500">
        Opens your mail app to send a signup request. Swap for Mailchimp,
        Buttondown, or a server action when you are ready.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="ml-name" className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Name
          </label>
          <input
            id="ml-name"
            name="name"
            type="text"
            autoComplete="name"
            className="mt-2 w-full border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)]/50"
          />
        </div>
        <div>
          <label htmlFor="ml-email" className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Email
          </label>
          <input
            id="ml-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)]/50"
          />
        </div>
        <button
          type="submit"
          className="border border-[var(--accent)]/40 bg-[var(--accent)]/10 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
        >
          Join
        </button>
      </form>
      {sent ? (
        <p className="mt-4 text-xs text-zinc-500">If your mail client opened, you are set.</p>
      ) : null}
    </motion.div>
  );
}
