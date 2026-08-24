import type { ReactNode } from "react";

export function ReadMore({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="read-more">
      <summary>{title}</summary>
      <div className="read-more-body">{children}</div>
    </details>
  );
}
