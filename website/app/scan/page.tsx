import { Suspense } from "react";
import { ScanApp } from "@/components/ScanApp";
import "../scan/scan.css";

export const metadata = {
  title: "HaloScan — Research Scanner",
  description:
    "Experimental PyTorch + OpenCV ensemble on synthetic X-ray-style images. Press 1 for battery, 3 for stacked coins. Not a medical device. Congressional App Challenge 2026.",
};

function ScanFallback() {
  return (
    <div className="scan-root" style={{ padding: 48, textAlign: "center" }}>
      Loading research scanner…
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<ScanFallback />}>
      <ScanApp />
    </Suspense>
  );
}
