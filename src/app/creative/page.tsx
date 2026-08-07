import type { Metadata } from "next";
import { TrackPage } from "@/components/track-page";
import { TRACKS } from "@/lib/content";

const track = TRACKS.find((t) => t.id === "creative")!;

export const metadata: Metadata = {
  title: track.title,
  description: track.lede,
};

export default function Page() {
  return (
    <TrackPage track={track}>
      <p className="mt-12 text-sm leading-relaxed text-graphite">
        Elegists Studio keeps its own home at{" "}
        <a
          href="https://elegists.studio"
          className="underline decoration-oxblood decoration-2 underline-offset-4 hover:text-ink"
          rel="noreferrer"
        >
          elegists.studio
        </a>
        .
      </p>
    </TrackPage>
  );
}
