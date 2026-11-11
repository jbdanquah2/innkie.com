import type { ReactNode } from 'react';

/** Shared frame for About / Contact / Privacy / Terms (the Angular `legal.component.scss` look). */
export function LegalShell({ title, tagline, action, children }: { title: string; tagline: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="legal-wrap">
      <div className="legal-container">
        <header className="legal-hero">
          <h1 className="brand">{title}</h1>
          <p className="tag">{tagline}</p>
          {action}
        </header>
        <div className="legal-content">{children}</div>
      </div>
    </div>
  );
}
