import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haloscan — Pediatric X-ray Decision Support",
  description:
    "Live ML that distinguishes button batteries from coins on pediatric X-rays. Congressional App Challenge 2026.",
  openGraph: {
    title: "Haloscan",
    description: "Battery vs coin on pediatric chest X-rays.",
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
