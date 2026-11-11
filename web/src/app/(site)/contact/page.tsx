import Link from 'next/link';
import { LegalShell } from '@/components/LegalShell';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact Us',
  description:
    'Have questions or feedback? Contact the iNNkie team. We provide support for our URL shortener, QR Studio, and free web utilities.',
  path: '/contact',
});

const FAQ = [
  ['Is iNNkie free to use?', 'Yes! Our core utility tools like the QR Generator, Image Compressor, and JSON Formatter are 100% free and run in your browser.'],
  ['Where is my data stored?', 'For our browser-side tools, your data never leaves your device. For link shortening and account data, we use secure, encrypted Firebase storage.'],
  ['How can I report a bug?', 'Please send a detailed description of the issue, including your browser version and steps to reproduce, to hello@innkie.com.'],
];

export default function ContactPage() {
  return (
    <LegalShell title="Contact Us" tagline="We're here to help you get the most out of iNNkie.">
      <JsonLd schema={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Contact', url: '/contact' }], '/contact')} />
      <section>
        <h2>Get in Touch</h2>
        <p>
          Have a question, feedback, or a feature request? We&apos;d love to hear from you. Our team is dedicated to building the best
          utility platform on the web, and your input is a vital part of that process.
        </p>
      </section>
      <section>
        <h3>Support Email</h3>
        <p>
          For technical support, account inquiries, or general questions, please email us at:
          <br />
          <a href="mailto:hello@innkie.com" className="font-bold">hello@innkie.com</a>
        </p>
        <p className="muted">We typically respond within 24-48 business hours.</p>
      </section>
      <section>
        <h3>Business &amp; Partnerships</h3>
        <p>
          For business inquiries, enterprise solutions, or partnership opportunities, reach out to:
          <br />
          <a href="mailto:hello@innkie.com" className="font-bold">hello@innkie.com</a>
        </p>
      </section>
      <section>
        <h2>Frequently Asked Questions</h2>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>{q}</h4>
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
