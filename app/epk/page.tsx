import { EpkLanding } from "@/components/epk-landing";
import { soundcloudPermalink } from "@/lib/epk-data";
import { getPressShots } from "@/lib/get-press-shots";
import { getInstagramStatsSafe } from "@/lib/instagram-stats";
import { getSoundcloudStatsSafe } from "@/lib/soundcloud-stats";
import { getSpotifyArtistDataSafe } from "@/lib/spotify";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "womp — Press kit" },
  description:
    "Electronic press kit for booking, labels, and press — bio, streaming highlights, photos, video, and contact.",
  openGraph: {
    title: "womp — Electronic press kit",
    description:
      "Dubstep producer & DJ — press, streaming, photos, and booking.",
    url: "https://djwomp.com/epk",
  },
};

export default async function EpkPage() {
  const [pressShots, spotify, soundcloud, instagram] = await Promise.all([
    Promise.resolve(getPressShots()),
    getSpotifyArtistDataSafe(),
    getSoundcloudStatsSafe(soundcloudPermalink),
    getInstagramStatsSafe(),
  ]);
  return (
    <EpkLanding
      pressShots={pressShots}
      spotify={spotify}
      soundcloud={soundcloud}
      instagram={instagram}
    />
  );
}
