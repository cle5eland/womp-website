import { EpkLanding } from "@/components/epk-landing";
import { soundcloudPermalink } from "@/lib/epk-data";
import { getPressShots } from "@/lib/get-press-shots";
import { fetchSoundcloudStats } from "@/lib/soundcloud-stats";

export default async function Home() {
  const pressShots = getPressShots();
  const soundcloudStats = await fetchSoundcloudStats({
    permalink: soundcloudPermalink,
  });
  return (
    <EpkLanding pressShots={pressShots} soundcloudStats={soundcloudStats} />
  );
}
