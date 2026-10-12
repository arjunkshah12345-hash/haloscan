import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "HaloScan — research scanner for synthetic disc patterns",
  description:
    "Student research prototype: classical radial profiling plus a dual-view network on synthetic X-ray-style images. Not a medical device. Congressional App Challenge 2026.",
  openGraph: {
    title: "HaloScan",
    description: "Experimental research prototype. Not a diagnosis and not a medical device.",
    type: "website",
    url: "https://haloscan-cac.vercel.app",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} data-theme="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js')` }} />
        <style>{`
          :root {
            --font-display: var(--font-instrument), ui-sans-serif, system-ui, sans-serif;
            --font-text: var(--font-instrument), ui-sans-serif, system-ui, sans-serif;
            --font-mono: var(--font-jetbrains), ui-monospace, monospace;
          }
        `}</style>
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
        <Script id="studio-motion" type="module" strategy="afterInteractive">
          {`import { autoInit } from '/studio/motion.js'; autoInit();`}
        </Script>
      </body>
    </html>
  );
}
