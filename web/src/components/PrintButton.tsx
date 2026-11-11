'use client';
export function PrintButton() {
  return (
    <button type="button" className="legal-btn-ghost no-print" onClick={() => window.print()}>
      Print / Save PDF
    </button>
  );
}
