import Link from "next/link";
import { HaloMark } from "./HaloMark";

type NavKey = "home" | "scan" | "architecture" | "validation" | "judges";

export function SiteNav({ current }: { current?: NavKey }) {
  return (
    <header className="site-nav">
      <Link href="/" className="site-nav__brand" aria-current={current === "home" ? "page" : undefined}>
        <HaloMark />
        HaloScan
      </Link>
      <ul className="site-nav__links">
        <li className="nav-hide-sm">
          <Link href="/architecture" aria-current={current === "architecture" ? "page" : undefined}>
            Model
          </Link>
        </li>
        <li className="nav-hide-sm">
          <Link href="/validation" aria-current={current === "validation" ? "page" : undefined}>
            Evaluation
          </Link>
        </li>
        <li>
          <Link href="/judges" aria-current={current === "judges" ? "page" : undefined}>
            Judges
          </Link>
        </li>
        <li className="nav-hide-sm">
          <a href="https://github.com/arjunkshah12345-hash/haloscan" target="_blank" rel="noopener noreferrer">
            Source
          </a>
        </li>
        <li>
          <Link href="/scan" className="btn btn--accent btn--sm site-nav__cta" aria-current={current === "scan" ? "page" : undefined}>
            Open scanner
          </Link>
        </li>
      </ul>
    </header>
  );
}
