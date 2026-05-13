import { EpkLanding } from "@/components/epk-landing";
import { getPressShots } from "@/lib/get-press-shots";
import { getSpotifyArtistDataSafe } from "@/lib/spotify";

export default async function Home() {
  const [pressShots, spotify] = await Promise.all([
    Promise.resolve(getPressShots()),
    getSpotifyArtistDataSafe(),
  ]);
  return <EpkLanding pressShots={pressShots} spotify={spotify} />;
}
