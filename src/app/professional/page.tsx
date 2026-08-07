import type { Metadata } from "next";
import { TrackPage } from "@/components/track-page";
import { TRACKS } from "@/lib/content";

const track = TRACKS.find((t) => t.id === "professional")!;

export const metadata: Metadata = {
  title: track.title,
  description: track.lede,
};

export default function Page() {
  return <TrackPage track={track} />;
}
