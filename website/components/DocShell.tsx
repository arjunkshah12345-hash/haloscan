import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteNav, type NavKey } from "./SiteNav";

export function DocShell({ current, children }: { current?: NavKey; children: ReactNode }) {
  return (
    <>
      <SiteNav current={current} />
      <main id="main" className="page">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
