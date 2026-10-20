import { Suspense } from "react";
import { ScanApp } from "@/components/ScanApp";
import { SiteFooter } from "@/components/SiteFooter";
import "./scan.css";

export const metadata = {
  title: "HaloScan — Research Scanner",
  description:
    "Upload an X-ray-style image and run the live PyTorch + OpenCV engine. Synthetic samples included. Not a medical device.",
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
    <>
      <Suspense fallback={<ScanFallback />}>
        <ScanApp />
      </Suspense>
      <SiteFooter />
    </>
  );
}
