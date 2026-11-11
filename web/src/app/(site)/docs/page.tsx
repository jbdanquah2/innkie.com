import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { DocsSidebar } from '@/components/DocsSidebar';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Developer Documentation',
  description: 'Learn how to integrate iNNkie into your workflow with our robust REST API, SDKs, and webhook system.',
  path: '/docs',
});

const Endpoint = ({ title, badge, tone, children }: { title: string; badge: string; tone: 'emerald' | 'blue' | 'amber'; children: React.ReactNode }) => {
  const cls = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  }[tone];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        <span className={`px-3 py-1 ${cls} text-[10px] font-black uppercase rounded-lg border`}>{badge}</span>
      </div>
      <p className="text-slate-600">{children}</p>
    </div>
  );
};

const SectionHead = ({ icon, box, title }: { icon: string; box: string; title: string }) => (
  <div className="flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl ${box} flex items-center justify-center`}><i className={`fas ${icon}`} /></div>
    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
  </div>
);

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <JsonLd schema={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Developer Docs', url: '/docs' }])} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <DocsSidebar />

          <div className="lg:col-span-9 space-y-20 pb-32">
            <section id="intro" className="scroll-mt-32">
              <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-6">API Reference</h1>
              <p className="text-xl text-slate-500 leading-relaxed max-w-3xl">
                The iNNkie API is organized around REST. Our API has predictable resource-oriented URLs, accepts JSON-encoded request bodies, and returns JSON-encoded responses.
              </p>
            </section>

            <section id="auth" className="scroll-mt-32 space-y-6">
              <SectionHead icon="fa-key" box="bg-primary-100 text-primary-600" title="Authentication" />
              <p className="text-slate-600 leading-relaxed">
                Authenticate your requests by including your secret API key in the <code className="bg-slate-100 px-2 py-0.5 rounded text-rose-500">x-api-key</code> header. You can manage your keys in the{' '}
                <Link href="/developer-api" className="text-primary-600 font-bold hover:underline">Developer Studio</Link>.
              </p>
              <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl">
                <pre className="text-primary-300 font-mono text-sm overflow-x-auto">{`curl https://api.innkie.com/api/v1/links \\
  -H "x-api-key: YOUR_WORKSPACE_KEY"`}</pre>
              </div>
            </section>

            <section id="links" className="scroll-mt-32 space-y-12">
              <SectionHead icon="fa-link" box="bg-emerald-100 text-emerald-600" title="Links" />
              <div className="space-y-16">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">Create a Short Link</h3>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-100">POST /links</span>
                  </div>
                  <p className="text-slate-600">Creates a new shortened URL within the workspace associated with your API key.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Parameters</h4>
                      <div className="divide-y divide-slate-100 border-t border-slate-100">
                        {[['url', 'string / required'], ['customAlias', 'string / optional'], ['tags', 'string[] / optional']].map(([n, t]) => (
                          <div key={n} className="py-3 flex justify-between">
                            <span className="font-mono text-sm font-bold text-primary-600">{n}</span>
                            <span className="text-xs text-slate-400 italic font-medium">{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Request Body</h4>
                      <pre className="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">{`{
  "url": "https://google.com",
  "customAlias": "marketing-campaign",
  "tags": ["growth", "summer24"]
}`}</pre>
                    </div>
                  </div>
                </div>
                <Endpoint title="List Workspace Links" badge="GET /links/workspace/:id" tone="blue">Retrieve all short links belonging to a specific workspace.</Endpoint>
                <Endpoint title="Update a Link" badge="PUT /links/:shortCode" tone="amber">Update the destination URL or metadata of an existing short link.</Endpoint>
              </div>
            </section>

            <section id="workspaces" className="scroll-mt-32 space-y-8">
              <SectionHead icon="fa-layer-group" box="bg-indigo-100 text-indigo-600" title="Workspaces" />
              <p className="text-slate-600 leading-relaxed">Workspaces are the top-level containers for all iNNkie resources. They manage branding, API keys, and team members.</p>
              <div className="space-y-12">
                <Endpoint title="List My Workspaces" badge="GET /workspaces" tone="blue">Returns a list of all workspaces you have access to, including your personal workspace.</Endpoint>
                <Endpoint title="Create Workspace" badge="POST /workspaces" tone="emerald">Creates a new professional/team workspace.</Endpoint>
              </div>
            </section>

            <section id="analytics" className="scroll-mt-32 space-y-8">
              <SectionHead icon="fa-chart-bar" box="bg-rose-100 text-rose-600" title="Analytics" />
              <p className="text-slate-600 leading-relaxed">Access real-time click tracking and visitor data for your shortened links and entire workspaces.</p>
              <div className="space-y-12">
                <Endpoint title="Link Clicks" badge="GET /analytics/:code/clicks" tone="blue">
                  Returns time-series click data for a specific short link. Query parameter <code className="font-bold">?days=30</code> supported.
                </Endpoint>
                <Endpoint title="Workspace Overview" badge="GET /analytics/workspace/:id" tone="blue">Retrieve aggregated performance metrics for all links within a workspace.</Endpoint>
              </div>
            </section>

            <section id="webhooks" className="scroll-mt-32 space-y-8">
              <SectionHead icon="fa-bolt" box="bg-purple-100 text-purple-600" title="Webhooks Overview" />
              <p className="text-slate-600 leading-relaxed">
                iNNkie can notify your application when certain events happen in your workspace. Webhooks are sent as <code className="bg-slate-100 px-2 py-0.5 rounded text-rose-500">POST</code> requests with a JSON payload.
              </p>
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
                <i className="fas fa-info-circle text-amber-400 text-xl pt-1" />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm mb-1">Supported Events</h4>
                  <ul className="text-xs text-amber-700 font-medium list-disc ml-4 space-y-1">
                    <li><code className="font-bold">link.created</code> - Fired when a new short link is generated.</li>
                    <li><code className="font-bold">link.clicked</code> - Fired every time a short link is visited.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="signature" className="scroll-mt-32 space-y-8">
              <SectionHead icon="fa-lock" box="bg-slate-900 text-white" title="Signature Verification" />
              <p className="text-slate-600 leading-relaxed">
                To ensure that a webhook request was actually sent by iNNkie, we include an <code className="bg-slate-100 px-2 py-0.5 rounded text-rose-500">X-Innkie-Signature</code> header in every request.
              </p>
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">Verification Steps</h3>
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">1. Capture the raw JSON request body.</p>
                  <p className="text-sm text-slate-500">2. Generate an HMAC SHA256 hash using your webhook secret as the key and the raw body as the message.</p>
                  <p className="text-sm text-slate-500">3. Compare the resulting hex digest with the value in the header.</p>
                </div>
                <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Node.js Example</h4>
                  <pre className="text-xs text-primary-300 font-mono overflow-x-auto">{`const crypto = require('crypto');

function verify(rawBody, secret, signature) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return hash === signature;
}`}</pre>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
