import { Suspense } from "react";
import { ScanApp } from "@/components/ScanApp";
import "../scan/scan.css";

export const metadata = {
  title: "Haloscan — Live Clinical Scanner",
  description:
    "Live PyTorch + OpenCV ensemble. Press 1 for battery, 3 for stacked coins. Congressional App Challenge 2026.",
};

function ScanFallback() {
  return (
    <div className="scan-root" style={{ padding: 48, textAlign: "center" }}>
      Loading clinical scanner…
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
