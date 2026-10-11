import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HaloScan — experimental X-ray research prototype",
  description:
    "Experimental student prototype for synthetic button-battery and coin X-ray patterns. Not a medical device. Congressional App Challenge 2026.",
  openGraph: {
    title: "HaloScan",
    description: "Experimental research prototype. Not a diagnosis and not a medical device.",
    type: "website",
    url: "https://haloscan-cac.vercel.app",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
