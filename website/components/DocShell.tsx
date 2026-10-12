import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";

type NavKey = "home" | "scan" | "architecture" | "validation" | "judges";

export function DocShell({
  current,
  children,
}: {
  current?: NavKey;
  children: ReactNode;
}) {
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
