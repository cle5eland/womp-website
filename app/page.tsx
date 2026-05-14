import { FanHome } from "@/components/fan-home";
import { getSpotifyArtistDataSafe } from "@/lib/spotify";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "womp" },
  description:
    "womp — dubstep producer & DJ from Seattle. Upcoming shows and music.",
  openGraph: {
    title: "womp",
    description: "Dubstep producer & DJ — shows and new music.",
    url: "https://djwomp.com/",
  },
};

export default async function Home() {
  const spotify = await getSpotifyArtistDataSafe();
  return <FanHome spotify={spotify} />;
}
