import type { Metadata } from "next";
import { Geist_Mono, Host_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const sans = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-host",
  display: "swap",
  weight: ["400", "500"],
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "HaloScan — button battery vs coin, studied on synthetic X-rays",
  description:
    "Student research prototype for the 2026 Congressional App Challenge. Classical radial profiling plus a small neural network on synthetic X-ray images. Not a medical device.",
  openGraph: {
    title: "HaloScan",
    description: "Student research prototype. Not a diagnosis and not a medical device.",
    type: "website",
    url: "https://haloscan-cac.vercel.app",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <div className="rails" aria-hidden />
        {children}
        <Script src="/dither.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
