import Link from "next/link";

export function Nav({ current }: { current?: "home" | "demo" | "judges" }) {
  return (
    <nav>
      <Link href="/" aria-current={current === "home" ? "page" : undefined}>
        Haloscan
      </Link>
      <Link href="/scan" aria-current={current === "demo" ? "page" : undefined}>
        Scanner
      </Link>
      <Link href="/architecture">Model</Link>
      <Link href="/validation">Evaluation</Link>
      <Link href="/judges" aria-current={current === "judges" ? "page" : undefined}>
        Judges
      </Link>
      <a href="https://github.com/arjunkshah12345-hash/haloscan" target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
    </nav>
  );
}
