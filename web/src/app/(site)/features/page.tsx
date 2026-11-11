import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';

export const metadata = buildMetadata({
  title: 'Advanced Features - The All-in-One Web Utility Ecosystem',
  description:
    'Discover iNNkie, the comprehensive utility engine for modern teams. Consolidate fragmented web tools into a single high-performance workspace—from secure link management to advanced media and developer utilities.',
  path: '/features',
});

const CATEGORIES = [
  { id: 'link', title: 'Links & SEO', icon: 'fa-link', iconBox: 'bg-primary-100 text-primary-600', hover: 'hover:border-primary-500', text: 'group-hover:text-primary-600' },
  { id: 'media', title: 'Media & Assets', icon: 'fa-image', iconBox: 'bg-indigo-100 text-indigo-600', hover: 'hover:border-indigo-500', text: 'group-hover:text-indigo-600' },
  { id: 'dev', title: 'Developer Utilities', icon: 'fa-code', iconBox: 'bg-amber-100 text-amber-600', hover: 'hover:border-amber-500', text: 'group-hover:text-amber-600' },
  { id: 'docs', title: 'Document Tools', icon: 'fa-file-pdf', iconBox: 'bg-rose-100 text-rose-600', hover: 'hover:border-rose-500', text: 'group-hover:text-rose-600' },
] as const;

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
  return (
    <div className="relative overflow-hidden bg-white">
      <JsonLd schema={schema} />
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-10 animate-fade-in shadow-sm">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
            </span>
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">iNNkie: Utility Platform</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tight mb-10 leading-[0.85] max-w-6xl mx-auto">
            Infinite Utilities. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-blue-500">One Workspace.</span>
          </h1>
          <p className="max-w-4xl mx-auto text-xl md:text-2xl text-slate-500 mb-16 leading-relaxed font-medium">
            iNNkie is the all-in-one utility ecosystem designed to streamline your digital workflow. We consolidate essential, high-performance web tools—covering everything from secure link management and branded assets to advanced media optimization and developer utilities—into a single, professional workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
            <Link href="/tools" className="w-full sm:w-auto px-12 py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-2xl shadow-primary-200 active:scale-95 text-lg">
              Launch Utilities Hub
            </Link>
            <Link href="/login/?signUp=true" className="w-full sm:w-auto px-12 py-5 bg-white text-slate-800 font-black rounded-2xl border border-slate-200 hover:border-primary-200 hover:text-primary-600 transition-all shadow-sm active:scale-95 text-lg">
              Create Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* Bento grid */}
      <section className="relative z-10 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6 auto-rows-[280px]">
            <div className="md:col-span-2 md:row-span-2 bg-slate-900 rounded-[3.5rem] p-12 flex flex-col justify-between overflow-hidden relative group border border-white/5 shadow-2xl">
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary-600/20 rounded-full blur-[100px] group-hover:bg-primary-600/30 transition-all duration-700" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-2xl mb-8 shadow-2xl shadow-primary-500/40 group-hover:scale-110 transition-transform">
                  <i className="fas fa-layer-group text-white" />
                </div>
                <h3 className="text-4xl font-black text-white mb-6 tracking-tight">Platform <br /> Intelligence</h3>
                <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">
                  Advanced link performance monitoring, campaign trajectory charts, and real-time geographic heatmaps for your team.
                </p>
              </div>
              <div className="relative z-10 mt-8 bg-white/5 rounded-[2.5rem] p-8 border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Global Analytics Hub</span>
                  <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-primary-500" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>Click Velocity</span>
                    <span className="text-emerald-400">+124%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-primary-500 w-[98%]" /></div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-primary-600 rounded-[3.5rem] p-12 flex flex-col justify-center border border-primary-500 relative group overflow-hidden shadow-xl">
              <div className="absolute -right-10 -bottom-10 opacity-20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700">
                <i className="fas fa-link text-[12rem] text-white" />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Smart Links</h3>
                <p className="text-primary-50 text-lg font-medium leading-relaxed max-w-md">
                  Secure shortening, custom branded aliases, password protection, and automated UTM campaign tracking.
                </p>
                <Link href="/tools/link-shortener" className="inline-flex mt-6 items-center gap-3 text-xs font-black text-white uppercase tracking-[0.2em] hover:gap-5 transition-all relative z-10">
                  Launch URL Shortener <i className="fas fa-arrow-right" />
                </Link>
              </div>
            </div>

            <div className="md:row-span-2 bg-white rounded-[3.5rem] p-12 flex flex-col justify-between border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.08)] relative group overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white mb-6 group-hover:rotate-12 transition-transform">
                  <i className="fas fa-palette" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">QR Studio</h3>
                <p className="text-slate-500 text-lg font-medium leading-relaxed">
                  Design high-fidelity QR codes with custom colors, gradients, and company logos. Ready for high-DPI print.
                </p>
                <Link href="/tools/qr-studio" className="inline-flex mt-6 items-center gap-3 text-xs font-black text-primary-600 uppercase tracking-[0.2em] hover:gap-5 transition-all relative z-10">
                  Open Branded Studio <i className="fas fa-arrow-right" />
                </Link>
              </div>
              <div className="mt-8 flex justify-center">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-all duration-500">
                  <i className="fas fa-expand text-7xl text-slate-200 group-hover:text-primary-300 transition-colors" />
                </div>
              </div>
            </div>

            <Link href="/tools/image-compressor" className="bg-indigo-600 rounded-[3.5rem] p-10 flex flex-col justify-end relative group overflow-hidden shadow-lg">
              <div className="absolute top-10 left-10 p-4 bg-white/10 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <i className="fas fa-compress-arrows-alt text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight leading-tight">Batch <br /> Optimizer</h3>
            </Link>

            <Link href="/docs" className="bg-emerald-500 rounded-[3.5rem] p-10 flex flex-col justify-end relative group overflow-hidden shadow-lg">
              <div className="absolute top-10 left-10 p-4 bg-white/10 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <i className="fas fa-code text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight leading-tight">Secure <br /> API</h3>
            </Link>

            <div className="md:col-span-2 bg-amber-50 rounded-[3.5rem] p-12 flex items-center gap-10 border border-amber-100 group overflow-hidden shadow-sm">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform">
                <i className="fas fa-users text-amber-500 text-3xl" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Team Workspaces</h3>
                <p className="text-slate-500 text-lg font-medium leading-relaxed">Collaborative link management with Role-Based Access Control (RBAC) and shared audit logs.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tool library */}
      <section className="py-40 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-28">
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8">Programmatic Tool Library.</h2>
            <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              iNNkie&apos;s 100% private, browser-side utilities are built for scale. No data leaves your machine; just high-performance, private computation.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${c.iconBox} rounded-2xl flex items-center justify-center text-xl shadow-inner`}><i className={`fas ${c.icon}`} /></div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">{c.title}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TOOL_REGISTRY.filter((t) => t.category === c.id).map((tool) => (
                    <Link key={tool.id} href={tool.route} className={`p-6 bg-white rounded-3xl border border-slate-200 ${c.hover} hover:shadow-xl transition-all group`}>
                      <span className={`block font-black text-slate-900 text-sm ${c.text} mb-1`}>{tool.name}</span>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2">{tool.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-48 relative z-10 px-4 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto bg-slate-900 rounded-[5rem] p-16 md:p-32 text-center text-white relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.3)] group">
          <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] bg-primary-600/20 rounded-full blur-[120px] group-hover:bg-primary-600/30 transition-all duration-1000" />
          <div className="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] bg-blue-600/20 rounded-full blur-[120px] group-hover:bg-blue-600/30 transition-all duration-1000" />
          <div className="relative z-10">
            <h2 className="text-5xl md:text-8xl font-black mb-10 tracking-tighter leading-[0.85]">Ready to <br /> Scale?</h2>
            <p className="text-slate-400 text-xl md:text-2xl mb-16 font-medium max-w-2xl mx-auto leading-relaxed">
              Join teams using iNNkie for private, high-fidelity web utilities. Start free, scale with your workspace.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/tools" className="px-14 py-7 bg-primary-600 text-white font-black rounded-[2.5rem] hover:bg-primary-500 transition-all shadow-2xl shadow-primary-500/30 active:scale-95 text-lg uppercase tracking-[0.2em]">
                Explore All Tools
              </Link>
              <Link href="/login/?signUp=true" className="px-14 py-7 bg-white/5 text-white font-black rounded-[2.5rem] hover:bg-white/10 transition-all border border-white/10 text-lg uppercase tracking-[0.2em]">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
