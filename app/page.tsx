import { EpkLanding } from "@/components/epk-landing";
import { soundcloudPermalink } from "@/lib/epk-data";
import { getPressShots } from "@/lib/get-press-shots";
import { getInstagramStatsSafe } from "@/lib/instagram-stats";
import { getSoundcloudStatsSafe } from "@/lib/soundcloud-stats";
import { getSpotifyArtistDataSafe } from "@/lib/spotify";

export default async function Home() {
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
