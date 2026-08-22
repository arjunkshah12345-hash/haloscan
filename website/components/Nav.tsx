import Link from "next/link";

export function Nav({
  current,
}: {
  current?:
    | "home"
    | "demo"
    | "judges"
    | "docs"
    | "architecture"
    | "usecases"
    | "validation"
    | "methodology"
    | "gallery";
}) {
  return (
    <nav>
      <Link href="/" className="site-title">
        Haloscan
      </Link>
      <div className="nav-links">
        <Link href="/scan" aria-current={current === "demo" ? "page" : undefined}>
          Scanner
        </Link>
        <Link href="/gallery" aria-current={current === "gallery" ? "page" : undefined}>
          Gallery
        </Link>
        <Link href="/use-cases" aria-current={current === "usecases" ? "page" : undefined}>
          Use Cases
        </Link>
        <Link href="/methodology" aria-current={current === "methodology" ? "page" : undefined}>
          Methodology
        </Link>
        <Link href="/architecture" aria-current={current === "architecture" ? "page" : undefined}>
          Architecture
        </Link>
        <Link href="/validation" aria-current={current === "validation" ? "page" : undefined}>
          Validation
        </Link>
        <Link href="/judges" aria-current={current === "judges" ? "page" : undefined}>
          Judges
        </Link>
        <a href="https://github.com/arjunkshah12345-hash/haloscan" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>
    </nav>
  );
}
