import { EpkLanding } from "@/components/epk-landing";
import { soundcloudPermalink } from "@/lib/epk-data";
import { getPressShots } from "@/lib/get-press-shots";
import { getSoundcloudStatsSafe } from "@/lib/soundcloud-stats";
import { getSpotifyArtistDataSafe } from "@/lib/spotify";

export default async function Home() {
  const [pressShots, spotify, soundcloud] = await Promise.all([
    Promise.resolve(getPressShots()),
    getSpotifyArtistDataSafe(),
    getSoundcloudStatsSafe(soundcloudPermalink),
  ]);
  return (
    <EpkLanding
      pressShots={pressShots}
      spotify={spotify}
      soundcloud={soundcloud}
    />
  );
}
