"use client";

import { useLayoutEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { SiteHeader } from "@/components/site-header";
import { SpotifyProfile } from "@/components/spotify-profile";
import type { SpotifyArtistData } from "@/lib/spotify";
import { useBfCacheRemountKey } from "@/lib/use-bf-cache-remount-key";
import {
  fanNavItems,
  heroImage,
  heroImageUnoptimized,
  instagramProfileUrl,
  soundcloudProfileUrl,
  spotifyArtistEmbedSrc,
  spotifyArtistUrl,
  upcomingShows,
} from "@/lib/epk-data";

function localDateYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MOBILE_HERO_MQ = "(max-width: 1023px)";

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

function FanSection({
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
      className={`relative scroll-mt-24 border-t border-white/[0.07] px-5 py-16 sm:px-8 md:px-12 lg:px-16 ${className}`}
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 max-w-3xl"
        >
          {kicker ? (
            <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[var(--accent)]">
              {kicker}
            </p>
          ) : null}
          <h2
            className={
              "font-display text-4xl uppercase leading-[0.95] text-white sm:text-5xl md:text-6xl " +
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

export function FanHome({ spotify }: { spotify: SpotifyArtistData | null }) {
  const todayYmd = localDateYmd(new Date());
  const futureShows = upcomingShows.filter((s) => s.endDate >= todayYmd);
  const mobileHeroLockPx = useMobileHeroHeightLock();
  const heroRemountKey = useBfCacheRemountKey();

  return (
    <div className="relative min-h-screen bg-[#050505] text-zinc-200">
      <div className="grain" aria-hidden />

      <SiteHeader
        logoHref="/"
        navItems={fanNavItems}
        showBookingContact
        instagramHref={instagramProfileUrl}
        spotifyHref={spotifyArtistUrl}
        soundcloudHref={soundcloudProfileUrl}
      />

      <main id="top">
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
              alt="womp"
              fill
              priority
              unoptimized={heroImageUnoptimized}
              className="object-cover object-center brightness-[1.06] contrast-[1.02] saturate-[1.04]"
              sizes="100vw"
            />
          </div>
          <motion.div
            key={`hero-scroll-${heroRemountKey}`}
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

        <FanSection id="shows" kicker="Live" title="Upcoming shows">
          <div className="grid gap-4">
            {futureShows.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No upcoming dates right now — check back soon.
              </p>
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
        </FanSection>

        <FanSection
          id="listen"
          kicker="Music"
          title="Listen"
          className="!py-12 sm:!py-14 md:!py-16"
        >
          <SpotifyProfile
            data={spotify}
            embedSrc={spotifyArtistEmbedSrc}
            fallbackArtistUrl={spotifyArtistUrl}
            maxTracks={5}
            showArtistMetrics={false}
          />
        </FanSection>
      </main>

      <footer className="border-t border-white/[0.08] bg-black px-5 py-10 sm:px-8 md:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            © {new Date().getFullYear()} · womp
          </p>
        </div>
      </footer>
    </div>
  );
}
