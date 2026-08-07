import type { Metadata } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

// The typographic collision the whole design rests on: a Garamond-lineage serif
// (classical) set against a geometric grotesque (modern), with a mono face
// carrying anything that is data — dates, counts, sample sizes, labels.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Yixuan "Coda" Shi',
    template: '%s — Yixuan "Coda" Shi',
  },
  description:
    "Interdisciplinary researcher, operations leader, and creative director working across cultural psychology, psychometrics, crisis intervention, and AI-native game development.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${grotesk.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
