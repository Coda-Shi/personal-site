import { HomeStage } from "@/components/home-stage";

// The disc must land dead centre of the viewport on open, so the header and
// footer are taken out of flow rather than allowed to push it down. The page is
// exactly one viewport tall and does not scroll. Layout and state both live in
// HomeStage, which needs to be a client component — lighting a sector changes
// the intro copy as well as the disc.
export default function Home() {
  return <HomeStage />;
}
