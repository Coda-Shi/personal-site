/**
 * Photographs from the stage, shown on the Creative page as a deck of cards
 * (see PhotoDeck). Empty until the owner sends them; the page prints nothing
 * for an empty list.
 *
 * To add photographs:
 *
 *     python scripts/live-photos.py _incoming/live/*.jpg
 *
 * which writes each one to public/creative/live/ at web size with every scrap
 * of metadata removed — a phone's EXIF carries the time, the device and often
 * the GPS position, none of which belongs on a public site — and prints the
 * entry to paste below. Originals stay in _incoming/, which is gitignored.
 *
 * Files are named by content and never replaced in place: public/ URLs do not
 * change when a file does, and the image optimiser caches on the URL (see the
 * note in scripts/hub-portrait.py).
 *
 * `alt` describes the photograph for someone who cannot see it; `caption` is
 * optional and is the owner's to write — the venue, the night, the song.
 */
export type LivePhoto = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
};

export const PERFORMANCES: LivePhoto[] = [];
