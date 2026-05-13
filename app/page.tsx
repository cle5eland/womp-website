import { EpkLanding } from "@/components/epk-landing";
import { getPressShots } from "@/lib/get-press-shots";

export default function Home() {
  const pressShots = getPressShots();
  return <EpkLanding pressShots={pressShots} />;
}
