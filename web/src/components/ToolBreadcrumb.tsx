import Link from 'next/link';

/** Visible breadcrumb: Tools / <name>. The structured-data breadcrumb is emitted separately by registrySchema. */
export function ToolBreadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-5">
      <ol className="flex items-center gap-2">
        <li><Link href="/tools" className="hover:text-slate-900 hover:underline">Tools</Link></li>
        <li aria-hidden="true" className="text-slate-300">/</li>
        <li aria-current="page" className="text-slate-700 font-medium">{name}</li>
      </ol>
    </nav>
  );
}
