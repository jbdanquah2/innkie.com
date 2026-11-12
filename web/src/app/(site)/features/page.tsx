import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';
import { HomeCta } from '@/components/HomeCta';

export const metadata = buildMetadata({
  title: 'Features: Free Browser Tools, Link Analytics, QR Studio and API',
  description:
    'What iNNkie includes: private browser-side tools for images, PDFs and developers, plus short links with click analytics, branded QR codes, team workspaces, an API and webhooks.',
  path: '/features',
});


const CATEGORIES = [
  { id: 'link', title: 'Links and QR codes' },
  { id: 'media', title: 'Images' },
  { id: 'docs', title: 'Documents and text' },
  { id: 'dev', title: 'Developer utilities' },
] as const;

const AREAS: { id: string; title: string; lead: string; points: { h: string; p: string }[]; cta?: { href: string; label: string } }[] = [
  {
    id: 'links',
    title: 'Short links you can control',
    lead: 'Create a link in seconds with no account, or sign in to manage and measure the ones that matter.',
    points: [
      { h: 'Custom aliases', p: 'Choose a readable ending such as innkie.com/spring-sale instead of a random code. Reserved words and duplicates are rejected for you.' },
      { h: 'Expiry and limits', p: 'Let a link expire on a date, after a number of clicks, after a time window, or after a single use.' },
      { h: 'Password protection', p: 'Ask visitors for a password before the redirect happens. Passwords are hashed on the server.' },
      { h: 'Tags and campaigns', p: 'Group links with tags and attach UTM source, medium, campaign, term and content values so they are added on redirect.' },
      { h: 'Switch off any time', p: 'Deactivate a link without deleting its history. The destination of an existing link is fixed, so a corrected URL means a new link.' },
    ],
    cta: { href: '/tools/link-shortener', label: 'Open the URL shortener' },
  },
  {
    id: 'analytics',
    title: 'Click analytics',
    lead: 'See what happened to a link after you shared it.',
    points: [
      { h: 'Where clicks come from', p: 'Country and city, referring site, device type (desktop, mobile, tablet) and browser for every click.' },
      { h: 'Trends over time', p: 'Click charts and a map by country, per link or across a whole workspace.' },
      { h: 'Bots are separated', p: 'Automated traffic is labelled as such, so it does not pass for real visitors.' },
    ],
  },
  {
    id: 'qr',
    title: 'QR Studio',
    lead: 'QR codes designed to match a brand and still scan.',
    points: [
      { h: 'Colours and gradients', p: 'Solid or gradient foreground, with a choice of direction, on the background you pick.' },
      { h: 'Your logo in the middle', p: 'Upload a logo or pick a common social icon, then adjust its size and margin.' },
      { h: 'Print-ready export', p: 'Download as PNG for screens or SVG for print. See our QR code guide for sizing and contrast rules.' },
    ],
    cta: { href: '/tools/qr-studio', label: 'Open QR Studio' },
  },
  {
    id: 'teams',
    title: 'Workspaces for teams',
    lead: 'Keep each client, product or team in its own space.',
    points: [
      { h: 'Roles', p: 'Invite people as admin, editor or viewer. Owners and admins manage members; viewers can look but not change.' },
      { h: 'Separate data', p: 'Links, analytics, API keys and webhooks belong to a workspace, so projects never mix.' },
      { h: 'Brand settings', p: 'Set a brand name, colour and logo for the workspace; the app and your emails pick them up.' },
    ],
  },
  {
    id: 'api',
    title: 'API and webhooks',
    lead: 'Create short links from your own code.',
    points: [
      { h: 'Workspace API keys', p: 'Each workspace has its own key, which you can rotate whenever you need to.' },
      { h: 'Webhooks', p: 'Get a call when a link is created or clicked. Each delivery is signed with an HMAC secret you can verify.' },
      { h: 'Public documentation', p: 'The API reference is public and needs no account to read.' },
    ],
    cta: { href: '/docs', label: 'Read the API docs' },
  },
];

const COMPARE: [string, string, string][] = [
  ['Image, PDF, developer and text tools', 'Yes', 'Yes'],
  ['Create a short link and QR code', 'Yes (stored in your browser)', 'Yes (saved to your account)'],
  ['Link analytics', 'No', 'Yes'],
  ['Expiry, password, tags and campaigns', 'No', 'Yes'],
  ['Branded QR designs, PNG and SVG export', 'Yes', 'Yes'],
  ['Workspaces, roles, API key and webhooks', 'No', 'Yes'],
];

const schema = [
  {
    '@type': 'WebPage',
    '@id': 'https://innkie.com/features#webpage',
    url: 'https://innkie.com/features',
    name: 'iNNkie Features - All-in-One Utility Platform',
    description: 'Comprehensive overview of iNNkie utilities including link management, QR studio, image optimization, and developer tools.',
    breadcrumb: { '@id': 'https://innkie.com/features#breadcrumb' },
  },
  {
    '@type': 'ItemList',
    name: 'iNNkie Utility Suite',
    description: 'A professional-grade suite of browser-side tools for digital teams.',
    itemListElement: TOOL_REGISTRY.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: tool.name,
        url: `https://innkie.com${tool.route}`,
        description: tool.description,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
      },
    })),
  },
  getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Features', url: '/features' }], '/features'),
];

export default function FeaturesPage() {
  const counts = CATEGORIES.map((c) => ({ ...c, tools: TOOL_REGISTRY.filter((t) => t.category === c.id) }));
  return (
    <div className="bg-white text-slate-900">
      <JsonLd schema={schema} />

      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl leading-[1.1]">What iNNkie does, and what needs an account.</h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
            Two things live here. A set of {TOOL_REGISTRY.length} free tools that run in your browser, and a link platform for people who want to track and manage what they share.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/tools" className="px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold text-center hover:bg-slate-700 transition-colors">Browse the tools</Link>
            <Link href="/login/?signUp=true" className="px-6 py-3 rounded-lg border border-slate-300 bg-white font-semibold text-center text-slate-800 hover:border-slate-500 transition-colors">Create a free account</Link>
          </div>
        </div>
      </section>

      {/* Free tools */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Free tools, no sign-up</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              The image, PDF, developer and text tools run inside your browser tab. Your files are read in memory on your own device and are not uploaded, so there is nothing to store or leak.
              Check for yourself: open your browser&apos;s Network tab while you use one.
            </p>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Batches of images download as a ZIP archive.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {counts.map((c) => (
              <div key={c.id}>
                <h3 className="font-semibold text-slate-900">{c.title} <span className="font-normal text-slate-500">({c.tools.length})</span></h3>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {c.tools.map((t) => (
                    <li key={t.id}><Link href={t.route} className="text-slate-600 hover:text-primary-700 hover:underline">{t.name}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl font-bold tracking-tight">The link platform</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">With a free account, links and QR codes become something you can manage and measure.</p>
          </div>
          <div className="space-y-16">
            {AREAS.map((a) => (
              <div key={a.id} id={a.id} className="grid lg:grid-cols-[1fr_1.6fr] gap-8 lg:gap-16 scroll-mt-24">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">{a.title}</h3>
                  <p className="mt-3 text-slate-600 leading-relaxed">{a.lead}</p>
                  {a.cta && <Link href={a.cta.href} className="inline-block mt-4 text-sm font-semibold text-primary-700 hover:underline">{a.cta.label} →</Link>}
                </div>
                <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
                  {a.points.map((pt) => (
                    <div key={pt.h} className="border-t border-slate-300 pt-4">
                      <dt className="font-semibold text-slate-900">{pt.h}</dt>
                      <dd className="mt-1.5 text-sm text-slate-600 leading-relaxed">{pt.p}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold tracking-tight mb-8">Without an account, and with one</h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left border-b border-slate-300">
                <th scope="col" className="py-3 pr-4 px-4 sm:px-0 font-semibold text-slate-900">Feature</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-slate-900">No account</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-slate-900">Free account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {COMPARE.map(([f, a, b]) => (
                <tr key={f}>
                  <th scope="row" className="py-3 pr-4 px-4 sm:px-0 font-medium text-slate-800 text-left">{f}</th>
                  <td className="py-3 pr-4 text-slate-600">{a}</td>
                  <td className="py-3 pr-4 text-slate-600">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Questions about data and ads? See the <Link href="/privacy" className="text-primary-700 hover:underline">privacy policy</Link>.
        </p>
      </section>

      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto"><HomeCta /></div>
      </section>
    </div>
  );
}
