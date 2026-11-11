import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { JsonLd } from '@/components/JsonLd';
import { HomeCta } from '@/components/HomeCta';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'All-in-One Utility Platform',
  description:
    'The easy way to shorten links, make QR codes, and edit images. iNNkie has all the tools you need in one place: PDF converters, image shrinkers, and developer tools like JSON formatters.',
  path: '/',
});

const FEATURED = [
  { href: '/tools/link-shortener', icon: 'fa-link', title: 'URL Shortener', cta: 'Open Shortener', desc: 'Create high-performance short URLs with advanced tracking, custom aliases, and secure redirects.', box: 'bg-primary-600 shadow-primary-500/10', text: 'text-primary-600' },
  { href: '/tools/qr-studio', icon: 'fa-palette', title: 'QR Studio', cta: 'Open Studio', desc: 'Design professional, branded QR codes with custom colors, gradients, and your company logo.', box: 'bg-emerald-500 shadow-emerald-500/10', text: 'text-emerald-600' },
  { href: '/tools/image-compressor', icon: 'fa-file-image', title: 'Image Optimizer', cta: 'Optimize Now', desc: 'Bulk optimize and resize images with real-time quality comparison and multi-format exports.', box: 'bg-blue-500 shadow-blue-500/10', text: 'text-blue-600' },
];

const ALSO = [
  { href: '/tools/json-formatter', icon: 'fa-code', label: 'JSON Formatter', hover: 'hover:border-amber-500', color: 'text-amber-500' },
  { href: '/tools/png-to-jpeg', icon: 'fa-file-export', label: 'PNG to JPEG', hover: 'hover:border-rose-500', color: 'text-rose-500' },
  { href: '/tools/svg-to-png', icon: 'fa-image', label: 'SVG to PNG', hover: 'hover:border-indigo-500', color: 'text-indigo-500' },
  { href: '/tools/utm-builder', icon: 'fa-bullhorn', label: 'UTM Builder', hover: 'hover:border-primary-500', color: 'text-primary-500' },
];

const PILLARS = [
  { icon: 'fa-fingerprint', color: 'text-primary-600', title: 'Branding Control', body: 'Studies show branded links achieve 34% higher click-through rates. We empower you with custom aliases, branded QR codes, and professional campaign tracking to maintain your identity across every touchpoint.' },
  { icon: 'fa-shield-halved', color: 'text-emerald-600', title: 'Privacy as a Right', body: "Most online utilities upload your sensitive files to their cloud servers. iNNkie is different. Our media and developer tools process every byte of data directly in your browser's RAM. Your data stays on your hardware." },
  { icon: 'fa-bolt-lightning', color: 'text-blue-600', title: 'Frictionless Performance', body: "By leveraging client-side computing, we eliminate server-side queues and upload delays. Whether you're batch-compressing images or merging PDFs, you get instant results powered by your own device's speed." },
];

const FAQS = [
  { q: 'Is iNNkie really free to use?', a: "Yes. All of our core utilities (Image compression, PDF extraction, UTM building, and base URL shortening) are completely free. We keep costs low by using your device's power to process files instead of expensive server clusters." },
  { q: 'Is it safe to use iNNkie for company documents?', a: "Absolutely. Because we use browser-side processing for all file tools, your company documents never touch our storage. Even if our database was breached, your files wouldn't be there because we never received them in the first place." },
  { q: 'What are the benefits of a Pro Account?', a: 'While guests can use the tools, a free account unlocks high-fidelity analytics for your links, custom branded styles for QR codes, and a persistent dashboard to manage your digital assets across multiple workspaces.' },
  { q: 'Does iNNkie sell my browsing data?', a: 'No. Our business model is focused on providing a premium utility platform, not on harvesting personal data. We are privacy-first by design and by choice.' },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden bg-white text-slate-900 selection:bg-primary-100 selection:text-primary-700">
      <JsonLd schema={getBreadcrumbSchema([{ name: 'Home', url: '/' }], '/')} />

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] bg-primary-100/5 rounded-full animate-pulse" style={{ animationDuration: '15s' }} />
        <div className="absolute top-1/2 -right-24 w-[25rem] h-[25rem] bg-blue-100/5 rounded-full animate-pulse" style={{ animationDuration: '18s' }} />
      </div>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-10 animate-fade-in flex justify-center">
            <Logo size="120px" />
          </div>

          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 mb-8 animate-fade-in relative overflow-hidden group">
            <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">iNNkie: The Unified Utility Platform</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tight mb-8 leading-[0.9]">
            Privacy-First. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-blue-500">Local &amp; Secure.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-slate-500 mb-16 leading-relaxed font-medium">
            iNNkie is a professional suite of utilities where your files and data stay on your device. Enjoy high-performance, browser-side processing with zero server-side storage.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left max-w-6xl mx-auto">
            {FEATURED.map((f) => (
              <Link key={f.href} href={f.href} className="group relative bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-transform transition-shadow duration-300">
                <div className={`w-16 h-16 ${f.box} text-white rounded-2xl flex items-center justify-center text-2xl mb-8 shadow-xl group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${f.icon}`} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{f.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-8">{f.desc}</p>
                <div className={`flex items-center gap-2 ${f.text} font-black text-xs uppercase tracking-widest`}>
                  {f.cta} <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-20 flex flex-wrap justify-center items-center gap-6 animate-fade-in">
            <p className="w-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Also available</p>
            {ALSO.map((a) => (
              <Link key={a.href} href={a.href} className={`flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-slate-100 ${a.hover} transition-colors group`}>
                <i className={`fas ${a.icon} text-xs ${a.color}`} />
                <span className="text-xs font-bold text-slate-700">{a.label}</span>
              </Link>
            ))}
            <Link href="/tools" className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl transition-colors hover:bg-slate-800">
              <span className="text-xs font-bold">Browse Tools Hub →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                Built on three <br />
                <span className="text-primary-600">unbreakable pillars.</span>
              </h2>
              <div className="space-y-6">
                {PILLARS.map((p) => (
                  <div key={p.title} className="flex gap-6">
                    <div className={`shrink-0 w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center ${p.color} text-xl`}>
                      <i className={`fas ${p.icon}`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 mb-1">{p.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed font-medium">{p.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-primary-600/5 blur-3xl rounded-full" />
              <div className="relative bg-white p-8 rounded-[3rem] border border-slate-200 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><i className="fas fa-chart-area" /></div>
                    <span className="font-black text-sm uppercase tracking-widest text-slate-900">Platform Integrity</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase">All Systems Optimal</span>
                </div>
                <div className="space-y-4">
                  {[['File Storage', '0 KB (Local)', 'text-slate-900'], ['Processing Latency', 'Instant', 'text-slate-900'], ['Privacy Score', 'A+ Certified', 'text-primary-600']].map(([k, v, c]) => (
                    <div key={k} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">{k}</span>
                      <span className={`text-xs font-black ${c}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Local computing */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            The magic of <span className="text-blue-600 underline decoration-primary-500 underline-offset-8">local computing.</span>
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed font-medium">
            iNNkie isn&apos;t just another website; it&apos;s a high-performance engine that runs in your tab. We&apos;ve built our platform using modern web APIs that tap into your device&apos;s raw power.
          </p>
          <div className="bg-slate-900 p-12 rounded-[4rem] text-left text-white shadow-3xl relative">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-600/20 blur-3xl rounded-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-primary-400 uppercase tracking-[0.2em]">Traditional Web Tools</h4>
                <ul className="space-y-3">
                  {['Upload sensitive files to a server', 'Wait in a processing queue', 'Risk data storage or leaks'].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-sm font-medium text-slate-400">
                      <i className="fas fa-circle-xmark text-rose-500" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">The iNNkie Engine</h4>
                <ul className="space-y-3">
                  {['Process files in your local RAM', 'Instant conversion & resizing', 'Absolute privacy by default'].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-sm font-bold text-white">
                      <i className="fas fa-circle-check text-emerald-500" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-12 text-xs text-slate-500 italic font-medium">
              By keeping the compute on your device, we keep iNNkie fast, private, and 100% free for individual creators.
            </p>
          </div>
        </div>
      </section>

      {/* Dark features */}
      <section className="py-32 bg-slate-900 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">Privacy by default.</h2>
            <p className="text-slate-400 text-xl font-medium">Processing happens in your RAM, not on our servers.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              ['Private Processing', 'Our image, PDF, and developer tools run entirely in your browser. Your sensitive data never leaves your device.'],
              ['No Account Needed', 'Start using any utility immediately. No sign-ups required for core tool usage. We value your speed over your email.'],
              ['Unified Analytics', 'Logged-in users get a central command center to track performance across all branded links and QR codes.'],
            ].map(([t, b]) => (
              <div key={t} className="p-8 rounded-3xl border border-white/5 bg-white/5 text-left transition-colors hover:bg-white/[0.07]">
                <h3 className="text-xl font-black text-white mb-4">{t}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-slate-900 mb-16 text-center tracking-tight">
            Platform <span className="text-primary-600">FAQ.</span>
          </h2>
          <div className="space-y-12">
            {FAQS.map((f, i) => (
              <div key={f.q} className={`space-y-4 ${i > 0 ? 'border-t border-slate-200 pt-12' : ''}`}>
                <h4 className="text-lg font-black text-slate-900">{f.q}</h4>
                <p className="text-slate-600 leading-relaxed font-medium">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-white relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HomeCta />
        </div>
      </section>
    </div>
  );
}
