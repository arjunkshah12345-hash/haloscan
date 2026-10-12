import { SiteNav } from "./SiteNav";

/** @deprecated Prefer SiteNav — kept so older pages keep compiling. */
export function Nav({ current }: { current?: "home" | "demo" | "judges" }) {
  const map = { home: "home", demo: "scan", judges: "judges" } as const;
  return <SiteNav current={current ? map[current] : undefined} />;
}
