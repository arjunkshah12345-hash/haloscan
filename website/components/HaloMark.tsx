import type { CSSProperties } from "react";

export function HaloMark({
  className = "halo-mark",
  title,
  style,
}: {
  className?: string;
  title?: string;
  style?: CSSProperties;
}) {
  return (
    <svg className={className} viewBox="0 0 32 32" style={style} aria-hidden={title ? undefined : true} role="img">
      {title ? <title>{title}</title> : null}
      <circle cx="16" cy="16" r="13" opacity="0.35" />
      <circle cx="16" cy="16" r="8.5" opacity="0.7" />
      <circle className="core" cx="16" cy="16" r="3.2" />
    </svg>
  );
}
