import { CONTACT_EMAIL } from '@/lib/site';
import Link from 'next/link';
import { LegalShell } from '@/components/LegalShell';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact Us',
  description:
    'How to reach iNNkie for support, bug reports, feature requests and partnership enquiries.',
  path: '/contact',
});

const FAQ = [
  ['Is iNNkie free to use?', 'Yes. The tools, including the QR generator, image compressor and JSON formatter, are free and run in your browser. Accounts are free too.'],
  ['Where is my data stored?', 'For our browser-side tools, your data never leaves your device. For link shortening and account data, we use Google Firebase, which encrypts stored data.'],
  ['How can I report a bug?', `Please send a detailed description of the issue, including your browser version and steps to reproduce, to ${CONTACT_EMAIL}.`],
];

export default function ContactPage() {
  return (
    <LegalShell title="Contact Us" tagline="Support, bug reports and feature requests.">
      <JsonLd schema={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Contact', url: '/contact' }], '/contact')} />
      <section>
        <h2>Email</h2>
        <p>
          For support, account questions, feature requests, bug reports or partnership enquiries, write to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. To report a harmful short link, use the{' '}
          <Link href="/report-abuse">Report Abuse</Link> page.
        </p>
        <p className="muted">Replies can take a couple of working days.</p>
      </section>
      <section>
        <h2>Common questions</h2>
        <div className="mt-3 space-y-5">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <h3 style={{ marginTop: 0 }}>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="legal-footer">
        <p>&copy; {new Date().getFullYear()} iNNkie Utility Platform</p>
        <Link href="/about">About iNNkie</Link>
      </div>
    </LegalShell>
  );
}
