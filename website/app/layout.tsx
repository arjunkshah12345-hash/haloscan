import type { Metadata } from "next";
import { DitherBackdrop } from "@/components/DitherBackdrop";
import "./globals.css";
import "./dither.css";

export const metadata: Metadata = {
  title: "Haloscan — Pediatric X-ray Decision Support",
  description:
    "Live ML that distinguishes button batteries from coins on pediatric X-rays. 100% battery sensitivity. Congressional App Challenge 2026.",
  openGraph: {
    title: "Haloscan — The diagnosis Congress didn't solve",
    description: "Live PyTorch + OpenCV ensemble. Judge demo: press 1 then 3.",
    type: "website",
    url: "https://haloscan.ideatr.dev",
    images: [{ url: "https://haloscan.ideatr.dev/figures/battery/overlay.png", width: 512, height: 512, alt: "Haloscan detection overlay" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Haloscan",
    description: "AI decision support for pediatric battery vs coin X-rays.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <DitherBackdrop />
        <div className="site-shell">{children}</div>
      </body>
    </html>
  );
}
