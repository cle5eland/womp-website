import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GateExperience } from "@/components/gate-experience";
import {
  readClaimFromCookies,
  readSessionFromCookies,
} from "@/lib/gate-request";
import { loadGateViewState } from "@/lib/gate-service";
import { getPublishedGateBySlug } from "@/lib/gate-store";
import { isDatabaseConfigured } from "@/lib/db";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Maps callback failure codes to something a fan can act on. */
const ERROR_COPY: Record<string, string> = {
  denied: "You cancelled the SoundCloud connection. Nothing was changed.",
  expired: "That took a little too long — connect again to continue.",
  bad_state: "That sign-in link was no longer valid. Please try again.",
  missing_code: "SoundCloud did not send us back a code. Please try again.",
  oauth_error: "SoundCloud reported a problem with the connection.",
  exchange_failed: "We could not complete the SoundCloud connection. Try again.",
  not_configured:
    "SoundCloud sign-in is not set up on this site yet. Please check back soon.",
  claim_required: "Enter your name and email first, then connect SoundCloud.",
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!isDatabaseConfigured()) return { title: "Download" };

  const { slug } = await params;
  const gate = await getPublishedGateBySlug(slug).catch(() => null);
  if (!gate) return { title: "Download not found" };

  const title = `${gate.title} — free download`;
  const description = `Get ${gate.trackTitle} by ${gate.artistUsername} — free download on SoundCloud.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: gate.artworkUrl ? [{ url: gate.artworkUrl }] : undefined,
      type: "music.song",
    },
    // Gates are promotional landing pages, not content we want ranked.
    robots: { index: false, follow: false },
  };
}

export default async function GatePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const session = await readSessionFromCookies();
  const claim = await readClaimFromCookies();
  const state = await loadGateViewState(slug, { claim, session });
  if (!state) notFound();

  const errorCode = typeof query.error === "string" ? query.error : null;
  const initialError = errorCode
    ? (ERROR_COPY[errorCode] ?? "Something went wrong connecting to SoundCloud.")
    : null;

  return (
    <>
      <div className="grain" aria-hidden />
      <GateExperience state={state} initialError={initialError} />
    </>
  );
}
