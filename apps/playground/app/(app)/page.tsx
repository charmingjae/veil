import type { Metadata } from "next";

export { HomePage as default } from "@/pages/home";

// Where the demo lives on GitHub Pages: the address search engines and shared links point to.
// URLs below are written out in full, so the `/veil` base path is spelled out too.
const SITE_URL = "https://charmingjae.github.io/veil/";
const TITLE = "Veil – Scratch-to-reveal React component";
const DESCRIPTION =
  "Scratch-to-reveal React component. Hide content under a scratch-card, noise or mosaic cover and wipe it away as pixels float, scatter or burn to ash.";
// The link preview, from `public/og.png` (made by `pnpm capture:og`).
const PREVIEW_IMAGE = {
  url: `${SITE_URL}og.png`,
  width: 1200,
  height: 630,
  alt: 'A black veil half scratched away, with orange embers rising off its burning edge, next to the words "Veil: Scratch-to-reveal React component" and "npm i @-3-/veil".',
};

export const metadata: Metadata = {
  title: "Veil",
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Veil",
    title: TITLE,
    description: DESCRIPTION,
    images: [PREVIEW_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [PREVIEW_IMAGE],
  },
};
