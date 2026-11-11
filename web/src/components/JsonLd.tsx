import { buildGraph } from '@/lib/seo';

/** Renders the unified JSON-LD @graph (WebSite + Organization + page nodes) in the static HTML. */
export function JsonLd({ schema }: { schema?: unknown | unknown[] }) {
  return (
    <script
      id="innkie-schema"
      type="application/ld+json"
      // Escape '<' so page content can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildGraph(schema)).replace(/</g, '\\u003c') }}
    />
  );
}
