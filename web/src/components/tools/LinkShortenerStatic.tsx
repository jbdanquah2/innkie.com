import Link from 'next/link';

const STEPS = [
  { n: '1', t: 'Paste your link', d: 'Any address that starts with http:// or https://. We fetch the page title and image so you can check you pasted the right one.' },
  { n: '2', t: 'Pick an ending, or not', d: 'Leave the ending random, or choose your own such as innkie.com/spring-sale. Letters, numbers, - and _ are allowed.' },
  { n: '3', t: 'Copy and share', d: 'Copy the short link or download its QR code. Anyone who opens it is sent straight to your page.' },
];

const EVERYONE = [
  'Preview of the destination page (title and image)',
  'Custom ending (alias)',
  'QR code for every link',
  'Your last 10 links, kept in your browser',
];

const ACCOUNT = [
  'Click analytics: country, city, referrer, device and browser',
  'Expiry by date, number of clicks, time window or single use',
  'Password protection',
  'Tags and UTM campaign values added on redirect',
  'Switch a link off without losing its history',
  'Workspaces, so each client or project stays separate',
];

export function LinkShortenerStatic() {
  return (
    <>
      <section className="max-w-5xl mx-auto" aria-labelledby="how">
        <h2 id="how" className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-8">How it works</h2>
        <ol className="grid md:grid-cols-3 gap-x-10 gap-y-6">
          {STEPS.map((s) => (
            <li key={s.n} className="border-t border-slate-300 pt-4">
              <p className="text-sm font-semibold text-primary-700">Step {s.n}</p>
              <h3 className="mt-1 font-semibold text-slate-900">{s.t}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-5xl mx-auto" aria-labelledby="options">
        <h2 id="options" className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-8">What you get</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Without an account</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
              {EVERYONE.map((t) => <li key={t} className="flex gap-3"><i className="fas fa-check text-emerald-600 mt-0.5" aria-hidden="true" />{t}</li>)}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">With a free account</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
              {ACCOUNT.map((t) => <li key={t} className="flex gap-3"><i className="fas fa-check text-emerald-600 mt-0.5" aria-hidden="true" />{t}</li>)}
            </ul>
            <Link href="/login/?signUp=true" className="inline-block mt-5 text-sm font-semibold text-primary-700 hover:underline">Create a free account →</Link>
          </div>
        </div>
      </section>

      <section className="max-w-3xl" aria-labelledby="know">
        <h2 id="know" className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-6">Good to know</h2>
        <ul className="space-y-4 text-slate-700 leading-relaxed">
          <li><strong className="text-slate-900">The destination is fixed.</strong> Once a link is created you cannot change where it points. If you need a different page, create a new link and switch the old one off.</li>
          <li><strong className="text-slate-900">Links use a temporary (302) redirect.</strong> Browsers check the link on every click, which is what lets us count clicks and honour expiry dates. <Link href="/guides/redirects-301-302-307" className="text-primary-700 hover:underline">Read how redirect types differ.</Link></li>
          <li><strong className="text-slate-900">Clicks are counted.</strong> We record the visitor&apos;s country and city, referring site, device and browser for the link&apos;s owner. See the <Link href="/privacy" className="text-primary-700 hover:underline">privacy policy</Link> for details.</li>
          <li><strong className="text-slate-900">Harmful links are removed.</strong> Phishing, malware and spam are not allowed. If you find one, <Link href="/report-abuse" className="text-primary-700 hover:underline">report it</Link>.</li>
        </ul>
      </section>
    </>
  );
}
