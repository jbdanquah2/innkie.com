import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { DocsSidebar } from '@/components/DocsSidebar';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'API Documentation: Short Links, Analytics and Webhooks',
  description:
    'REST API reference for iNNkie. Create, list, update and delete short links with a workspace API key, read click statistics, and receive signed webhooks.',
  path: '/docs',
});

const BASE = 'https://api.innkie.com/api/v1';

function Code({ children, label }: { children: string; label?: string }) {
  return (
    <div className="rounded-lg bg-slate-900 overflow-hidden">
      {label && <div className="px-4 py-2 text-xs text-slate-400 border-b border-slate-800">{label}</div>}
      <pre className="p-4 text-[13px] leading-relaxed text-slate-100 font-mono overflow-x-auto">{children}</pre>
    </div>
  );
}

function Method({ m }: { m: 'GET' | 'POST' | 'PATCH' | 'DELETE' }) {
  const cls = { GET: 'bg-blue-50 text-blue-700', POST: 'bg-emerald-50 text-emerald-700', PATCH: 'bg-amber-50 text-amber-800', DELETE: 'bg-rose-50 text-rose-700' }[m];
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold ${cls}`}>{m}</span>;
}

function Endpoint({ id, method, path, title, children }: { id: string; method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="flex items-center gap-3 font-mono text-sm text-slate-700"><Method m={method} /> {path}</p>
      {children}
    </section>
  );
}

function Params({ rows }: { rows: [string, string, string][] }) {
  return (
    <>
      {/* Phones: stacked, so descriptions are never hidden behind a sideways scroll. */}
      <dl className="sm:hidden divide-y divide-slate-200 border-y border-slate-200">
        {rows.map(([n, t, d]) => (
          <div key={n} className="py-3">
            <dt className="flex flex-wrap items-baseline gap-x-3"><span className="font-mono text-sm text-primary-700">{n}</span><span className="text-xs text-slate-500">{t}</span></dt>
            <dd className="mt-1 text-sm text-slate-600">{d}</dd>
          </div>
        ))}
      </dl>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b border-slate-300 text-slate-900"><th className="py-2 pr-4 font-semibold">Name</th><th className="py-2 pr-4 font-semibold">Type</th><th className="py-2 font-semibold">Description</th></tr></thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map(([n, t, d]) => (
              <tr key={n}><td className="py-2 pr-4 font-mono text-primary-700 align-top">{n}</td><td className="py-2 pr-4 text-slate-500 align-top whitespace-nowrap">{t}</td><td className="py-2 text-slate-600">{d}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const LINK_JSON = `{
  "shortCode": "spring-sale",
  "shortUrl": "https://innkie.com/spring-sale",
  "originalUrl": "https://example.com/products/spring",
  "customAlias": "spring-sale",
  "title": null,
  "description": null,
  "tags": ["campaign", "email"],
  "campaign": null,
  "isActive": true,
  "passwordProtected": false,
  "expiration": null,
  "clickCount": 0,
  "source": "api",
  "createdAt": "2026-11-12T10:15:00.000Z",
  "updatedAt": null
}`;

export default function DocsPage() {
  return (
    <div className="bg-white text-slate-700">
      <JsonLd schema={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'API Documentation', url: '/docs' }], '/docs')} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <DocsSidebar />

          <div className="lg:col-span-9 space-y-16 pb-24 min-w-0">
            <section id="intro" className="scroll-mt-24 space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">API documentation</h1>
              <p className="text-lg leading-relaxed max-w-3xl">
                Create and manage short links from your own code. The API is JSON over HTTPS, and every request acts on one workspace: the one your API key belongs to.
              </p>
              <p>Base URL: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">{BASE}</code></p>
              <p>
                You do not need the API to use iNNkie: the <Link href="/tools" className="text-primary-700 hover:underline">free tools</Link> and the dashboard work without it.
              </p>
            </section>

            <section id="auth" className="scroll-mt-24 space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Authentication</h2>
              <p>
                Create a key in the <Link href="/developer-api" className="text-primary-700 hover:underline">Developer Studio</Link> and send it in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">x-api-key</code> header.
                A key is tied to a single workspace, can only see and change that workspace&apos;s links, and can be rotated at any time. Keep it secret: anyone with the key can create and delete links in that workspace.
              </p>
              <Code label="Try it">{`curl ${BASE}/links \\
  -H "x-api-key: ik_YOUR_KEY"`}</Code>
              <p className="text-sm text-slate-500">
                Other parts of the web app (workspaces, members, webhook management) use your sign-in session and are not part of the API-key API.
              </p>
            </section>

            <section id="limits" className="scroll-mt-24 space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Limits and errors</h2>
              <p>Requests are rate limited per client IP address: <strong>60 reads</strong> and <strong>20 writes</strong> (create, update, delete) per minute. Over the limit you get <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">429</code>.</p>
              <Params rows={[
                ['400', 'Bad request', 'The body or a query parameter failed validation. The message says which one.'],
                ['401', 'Unauthorised', 'The x-api-key header is missing or the key is not valid.'],
                ['404', 'Not Found', 'No such link in your workspace. Links in other workspaces look exactly the same as missing links.'],
                ['409', 'Conflict', 'The custom alias is already taken.'],
                ['429', 'Too Many Requests', 'Rate limit exceeded. Wait a minute and retry.'],
              ]} />
              <Code label="Error body">{`{
  "statusCode": 400,
  "message": "Please enter a valid URL starting with http:// or https://",
  "error": "Bad Request"
}`}</Code>
            </section>

            <Endpoint id="create" method="POST" path="/links" title="Create a link">
              <p>Creates a short link in your workspace. If the same destination URL was already shortened in this workspace, that existing link is returned with <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">alreadyExisted: true</code> instead of a duplicate.</p>
              <Params rows={[
                ['url', 'string, required', 'Destination. Must start with http:// or https://, at most 2048 characters.'],
                ['customAlias', 'string', 'Letters, numbers, - and _ (max 64). Case-insensitive; stored in lower case. Some words are reserved.'],
                ['tags', 'string[]', 'Up to 30 tags of up to 50 characters.'],
                ['passwordProtected', 'boolean', 'Require a password before redirecting.'],
                ['password', 'string', 'At least 4 characters. Stored only as a salted hash and never returned.'],
                ['expiration', 'object', 'See below.'],
                ['campaign', 'object', 'Optional UTM values: utmSource, utmMedium, utmCampaign, utmTerm, utmContent. Added to the destination on redirect.'],
              ]} />
              <p className="text-sm">
                <strong>expiration</strong> takes a <code className="bg-slate-100 px-1 rounded">mode</code> of <code className="bg-slate-100 px-1 rounded">never</code>, <code className="bg-slate-100 px-1 rounded">date</code> (with <code className="bg-slate-100 px-1 rounded">expiryDate</code> as an ISO string),{' '}
                <code className="bg-slate-100 px-1 rounded">clicks</code> or <code className="bg-slate-100 px-1 rounded">oneTime</code> (with <code className="bg-slate-100 px-1 rounded">maxClicks</code>), or <code className="bg-slate-100 px-1 rounded">duration</code> (with <code className="bg-slate-100 px-1 rounded">durationValue</code> and <code className="bg-slate-100 px-1 rounded">durationUnit</code> of minutes, hours or days).
              </p>
              <Code label="Request">{`curl -X POST ${BASE}/links \\
  -H "x-api-key: ik_YOUR_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "url": "https://example.com/products/spring",
    "customAlias": "spring-sale",
    "tags": ["campaign", "email"],
    "expiration": { "mode": "date", "expiryDate": "2027-01-01T00:00:00Z" }
  }'`}</Code>
              <Code label="Response 201">{LINK_JSON.replace('"expiration": null', '"expiration": { "mode": "date", "expiryDate": "2027-01-01T00:00:00.000Z" }').replace(/\n}$/, ',\n  "alreadyExisted": false\n}')}</Code>
            </Endpoint>

            <Endpoint id="list" method="GET" path="/links" title="List links">
              <p>Returns your workspace&apos;s links, newest first, one page at a time.</p>
              <Params rows={[
                ['limit', 'integer', '1 to 100. Default 25.'],
                ['cursor', 'string', 'Pass the nextCursor from the previous page to get the next one.'],
              ]} />
              <Code label="Request">{`curl "${BASE}/links?limit=2" -H "x-api-key: ik_YOUR_KEY"`}</Code>
              <Code label="Response 200">{`{
  "data": [ { "shortCode": "spring-sale", "...": "..." }, { "shortCode": "Xk2p9a", "...": "..." } ],
  "nextCursor": "Xk2p9a"
}`}</Code>
              <p className="text-sm text-slate-500">When <code className="bg-slate-100 px-1 rounded">nextCursor</code> is <code className="bg-slate-100 px-1 rounded">null</code> you have reached the end.</p>
            </Endpoint>

            <Endpoint id="get" method="GET" path="/links/:code" title="Get a link">
              <p>Returns one link by its short code. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">clickCount</code> is the running total.</p>
              <Code label="Request">{`curl ${BASE}/links/spring-sale -H "x-api-key: ik_YOUR_KEY"`}</Code>
            </Endpoint>

            <Endpoint id="update" method="PATCH" path="/links/:code" title="Update a link">
              <p>Changes the fields you send and leaves the rest alone. The destination URL of an existing link is fixed: to point somewhere else, create a new link.</p>
              <Params rows={[
                ['title, description', 'string', 'Labels for your own use.'],
                ['isActive', 'boolean', 'false switches the link off without deleting its history.'],
                ['customAlias', 'string | null', 'Change the alias (must be free) or null to clear it.'],
                ['tags', 'string[]', 'Replaces the tag list.'],
                ['campaign', 'object | null', 'UTM values, as when creating.'],
                ['expiration', 'object', 'As when creating.'],
                ['passwordProtected, password', 'boolean, string', 'Turn protection on with a password, or off with passwordProtected: false.'],
              ]} />
              <Code label="Request">{`curl -X PATCH ${BASE}/links/spring-sale \\
  -H "x-api-key: ik_YOUR_KEY" -H "content-type: application/json" \\
  -d '{ "isActive": false, "tags": ["campaign", "ended"] }'`}</Code>
              <p className="text-sm text-slate-500">Returns the updated link. Fields not listed above (owner, counters, destination) are ignored.</p>
            </Endpoint>

            <Endpoint id="delete" method="DELETE" path="/links/:code" title="Delete a link">
              <p>Permanently deletes the link. Its short URL stops working. This cannot be undone.</p>
              <Code label="Request">{`curl -X DELETE ${BASE}/links/spring-sale -H "x-api-key: ik_YOUR_KEY"`}</Code>
              <Code label="Response 200">{`{ "deleted": true, "shortCode": "spring-sale" }`}</Code>
            </Endpoint>

            <Endpoint id="clicks" method="GET" path="/links/:code/clicks" title="Click statistics">
              <p>Daily click counts for one link.</p>
              <Params rows={[['days', 'integer', '1 to 30. Default 7.']]} />
              <Code label="Request">{`curl "${BASE}/links/spring-sale/clicks?days=7" -H "x-api-key: ik_YOUR_KEY"`}</Code>
              <Code label="Response 200">{`{
  "shortCode": "spring-sale",
  "days": 7,
  "total": 5,
  "data": [ { "date": "2026-11-10", "clicks": 2 }, { "date": "2026-11-11", "clicks": 3 } ]
}`}</Code>
              <p className="text-sm text-slate-500">Country, device and referrer breakdowns are available in the dashboard.</p>
            </Endpoint>

            <section id="link-object" className="scroll-mt-24 space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">The link object</h2>
              <p>Every endpoint returns links in this shape. Password hashes and account identifiers are never included.</p>
              <Code>{LINK_JSON}</Code>
            </section>

            <section id="webhooks" className="scroll-mt-24 space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Webhooks</h2>
              <p>
                Add an endpoint in the <Link href="/developer-api" className="text-primary-700 hover:underline">Developer Studio</Link> and choose events. We send a <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">POST</code> with a JSON body.
                Your endpoint should answer within 5 seconds; failed deliveries are not retried, so treat webhooks as a convenience and use the list endpoint to reconcile.
              </p>
              <Params rows={[
                ['link.created', 'event', 'A link was created, from the web app or the API. data is the link object.'],
                ['link.clicked', 'event', 'A link was visited. data has shortCode, originalUrl, timestamp, ipAddress, country, city, referrer and deviceType.'],
                ['link.deleted', 'event', 'A link was deleted. data is the link object as it was.'],
              ]} />
              <Code label="Delivery">{`{
  "event": "link.clicked",
  "timestamp": "2026-11-12T10:20:00.000Z",
  "workspaceId": "your-workspace-id",
  "data": { "shortCode": "spring-sale", "country": "GH", "deviceType": "mobile", "...": "..." }
}`}</Code>
              <p className="text-sm text-slate-500">Webhook destinations must be public http(s) addresses; private and internal addresses are refused.</p>
            </section>

            <section id="signature" className="scroll-mt-24 space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Verifying signatures</h2>
              <p>
                Every delivery carries an <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">X-Innkie-Signature</code> header: the hex HMAC-SHA256 of the raw request body, keyed with your webhook secret.
                Compute it over the raw bytes you received, before parsing the JSON, and compare in constant time.
              </p>
              <Code label="Node.js">{`const crypto = require('crypto');

function verify(rawBody, secret, signature) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}`}</Code>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
