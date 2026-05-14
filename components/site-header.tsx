"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { HeaderSocialIcons } from "@/components/header-social-icons";
import { bookingEmail, logoImage } from "@/lib/epk-data";

type NavItem = { readonly label: string; readonly href: string };

export function SiteHeader({
  logoHref,
  navItems,
  showBookingContact = false,
  instagramHref,
  spotifyHref,
  soundcloudHref,
}: {
  logoHref: string;
  navItems: readonly NavItem[];
  showBookingContact?: boolean;
  instagramHref: string;
  spotifyHref: string;
  soundcloudHref: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.08] bg-[#050505]/75 backdrop-blur-none sm:backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top,0px))] sm:px-8 sm:pt-[max(1rem,env(safe-area-inset-top,0px))] md:px-12">
        <a href={logoHref} className="relative block h-8 w-32 shrink-0 sm:h-9 sm:w-36">
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
        <div className="flex items-center gap-1 sm:gap-2">
          <HeaderSocialIcons
            className="hidden sm:flex"
            instagramHref={instagramHref}
            spotifyHref={spotifyHref}
            soundcloudHref={soundcloudHref}
          />
          {showBookingContact ? (
            <a
              href={`mailto:${bookingEmail}`}
              className="hidden rounded-none border border-white/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)] sm:inline-block"
            >
              Contact
            </a>
          ) : null}
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
            {showBookingContact ? (
              <a
                href={`mailto:${bookingEmail}`}
                className="py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]"
              >
                Contact
              </a>
            ) : null}
            <div className="border-t border-white/10 pt-4">
              <HeaderSocialIcons
                instagramHref={instagramHref}
                spotifyHref={spotifyHref}
                soundcloudHref={soundcloudHref}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </header>
  );
}
