import { CONTACT_EMAIL } from '@/lib/site';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { HomeCta } from '@/components/HomeCta';
import { ToolGroup } from '@/components/ToolGroup';
import { LinkShortener } from '@/components/tools/LinkShortener';
import { TOOL_REGISTRY, type UtilityTool } from '@/lib/config/tool-registry';
import { GUIDE_REGISTRY } from '@/lib/config/guide-registry';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Free Online Tools for Links, Images, PDFs and Developers',
  description:
    'Shorten links, make QR codes, compress images, convert PDFs and format JSON. Free web tools that run in your browser, so your files are never uploaded.',
  path: '/',
});

const GROUPS: { key: UtilityTool['category']; title: string; blurb: string }[] = [
  { key: 'link', title: 'Links and QR codes', blurb: 'Short links with click analytics, branded QR codes, campaign tags.' },
  { key: 'media', title: 'Images', blurb: 'Compress, resize and convert without uploading a single file.' },
  { key: 'docs', title: 'Documents and text', blurb: 'PDF and image conversion, word and character counts.' },
  { key: 'dev', title: 'Developer utilities', blurb: 'Format, encode, decode and inspect the things you paste into terminals.' },
];

const STEPS = [
  { n: '1', title: 'Pick a tool', body: 'No account needed for the file and developer tools. Open one and start.' },
  { n: '2', title: 'Drop in your file or text', body: 'It is read by your browser, not sent to a server. Large images and PDFs are handled in memory on your device.' },
  { n: '3', title: 'Download the result', body: 'Single files, or a ZIP when you process a batch. Nothing is stored afterwards.' },
];

const PLATFORM = [
  { title: 'Short links with real analytics', body: 'Custom aliases, expiry dates, password protection and per-link click data by country, device and referrer.' },
  { title: 'QR codes that match your brand', body: 'Colours, gradients, dot styles and a logo in the middle, exported as PNG or SVG. No account needed.' },
  { title: 'Workspaces for teams', body: 'Invite teammates with roles, keep each client or project separate, and give every workspace its own API key.' },
  { title: 'API and webhooks', body: 'Create links from your own code and get a webhook call when one is clicked. Documentation is public.' },
];

const FAQS = [
  { q: 'Is it free?', a: 'The tools are free and need no account. Creating an account unlocks link analytics, saved QR designs and workspaces.' },
  { q: 'Are my files uploaded?', a: 'Not for the image, PDF and developer tools. They run in your browser. You can confirm this by watching the Network tab in your browser while you use one. Link shortening and account features do use our servers, because they have to.' },
  { q: 'How do you pay for it?', a: 'Advertising on the public tool and guide pages, and optional paid features later. We do not sell personal data. Details are in the privacy policy.' },
  { q: 'Who runs iNNkie?', a: `iNNkie is built and run independently by YJB Danquah. Questions or problems: ${CONTACT_EMAIL}. Harmful link? Use the report page.` },
];

export default function HomePage() {
  const toolCount = TOOL_REGISTRY.length;
  const guides = [...GUIDE_REGISTRY].sort((a, b) => b.datePublished.localeCompare(a.datePublished)).slice(0, 3);

  return (
    <div className="bg-white text-slate-900 selection:bg-primary-100 selection:text-primary-700">
      <JsonLd schema={getBreadcrumbSchema([{ name: 'Home', url: '/' }], '/')} />

      {/* Hero: one statement, one working tool */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 lg:pt-24 lg:pb-24 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-start">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary-700 mb-4">{toolCount} free tools, no sign-up</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
              Everyday web tools that stay on your device.
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              Compress an image, convert a PDF, format some JSON, make a QR code. Files are processed in your browser and never uploaded.
              When you need a short link with click stats, that is here too.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/tools" className="px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold text-center hover:bg-slate-700 transition-colors">Browse all tools</Link>
              <Link href="/tools/image-compressor" className="px-6 py-3 rounded-lg border border-slate-300 bg-white font-semibold text-center text-slate-800 hover:border-slate-500 transition-colors">Compress an image</Link>
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 mb-1">Shorten a link</h2>
            <p className="text-sm text-slate-500 mb-4">Paste a URL. Add an alias if you want a readable one.</p>
            <div className="[&>div]:!mb-0 [&>div]:!max-w-none">
              <LinkShortener compact />
            </div>
          </div>
        </div>
      </section>

      {/* Tool directory, generated from the registry so it never goes stale */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl font-bold tracking-tight">All the tools</h2>
          <p className="mt-3 text-slate-600">Grouped by what you are trying to do.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-14">
          {GROUPS.map((g, i) => (
            <ToolGroup key={g.key} title={g.title} blurb={g.blurb} defaultOpenOnMobile={i === 0}>
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {TOOL_REGISTRY.filter((t) => t.category === g.key).map((t) => (
                  <li key={t.id}>
                    <Link href={t.route} className="group block py-3">
                      <span className="block font-medium text-slate-800 group-hover:text-primary-700 transition-colors">{t.name}</span>
                      <span className="block text-sm text-slate-500 mt-0.5 leading-snug">{t.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </ToolGroup>
          ))}
        </div>
      </section>

      {/* How privacy actually works */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-14">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Why your files stay put</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Most online converters upload your file, process it on their servers and send it back. We do the work with code that runs
              inside your browser tab, so there is no upload step to leak, queue or store.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              You do not have to take our word for it. Open your browser&apos;s developer tools, switch to the Network tab and use any
              image or PDF tool. You will see the page load, and no file leave.
            </p>
          </div>
          <ol className="space-y-6">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-5">
                <span className="shrink-0 w-8 h-8 rounded-full border border-slate-600 text-slate-300 text-sm font-semibold flex items-center justify-center">{s.n}</span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mt-1">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The account side */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl font-bold tracking-tight">With a free account</h2>
          <p className="mt-3 text-slate-600">For links and QR codes you want to keep track of, not just create once.</p>
        </div>
        <dl className="grid md:grid-cols-2 gap-x-16 gap-y-10">
          {PLATFORM.map((p) => (
            <div key={p.title} className="border-t border-slate-200 pt-5">
              <dt className="font-semibold text-slate-900">{p.title}</dt>
              <dd className="mt-2 text-slate-600 leading-relaxed">{p.body}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-sm text-slate-500">
          See the <Link href="/features" className="text-primary-700 font-medium hover:underline">full feature list</Link> or the{' '}
          <Link href="/docs" className="text-primary-700 font-medium hover:underline">API docs</Link>.
        </p>
      </section>

      {/* Guides */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Latest guides</h2>
              <p className="mt-3 text-slate-600">Plain explanations of the things these tools touch.</p>
            </div>
            <Link href="/guides" className="text-sm font-semibold text-primary-700 hover:underline shrink-0">All guides →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {guides.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="group block rounded-xl bg-white border border-slate-200 p-6 hover:border-slate-400 transition-colors">
                <p className="text-xs font-medium text-slate-500">{g.category} · {g.readingTime}</p>
                <h3 className="mt-3 font-semibold text-slate-900 leading-snug group-hover:text-primary-700 transition-colors">{g.title}</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-3">{g.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold tracking-tight mb-10">Questions</h2>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {FAQS.map((f) => (
            <div key={f.q} className="py-6">
              <h3 className="font-semibold text-slate-900">{f.q}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">
          More in our <Link href="/privacy" className="text-primary-700 hover:underline">privacy policy</Link>, or{' '}
          <Link href="/report-abuse" className="text-primary-700 hover:underline">report a harmful link</Link>.
        </p>
      </section>

      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto"><HomeCta /></div>
      </section>
    </div>
  );
}
