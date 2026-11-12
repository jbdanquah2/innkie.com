import Link from 'next/link';
import { LegalShell } from '@/components/LegalShell';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'About iNNkie',
  description:
    'What iNNkie is, who builds it, how it makes money, and why its file and developer tools run in your browser instead of on a server.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <LegalShell title="About iNNkie" tagline="Free web tools that run in your browser, plus short links you can track.">
      <JsonLd schema={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'About', url: '/about' }], '/about')} />
      <section>
        <h2>Our Mission</h2>
        <p>
          iNNkie was born out of a simple frustration: the web is full of utility tools that are either cluttered with intrusive ads,
          require slow file uploads, or compromise user privacy. So we built a set of tools that load fast, stay out of the way, and do
          their work in your browser.
        </p>
      </section>
      <section>
        <h2>Privacy First, Always</h2>
        <p>
          The image, PDF, QR and developer tools process your files and text on your own device, so they never reach our servers. The exceptions are the
          link shortener, which has to store the links you create, and your account data. You can confirm this in your browser&apos;s Network tab.
        </p>
      </section>
      <section>
        <h2>What is in it</h2>
        <ul>
          <li><strong>Short links:</strong> shorten a URL, set a custom ending, password or expiry, and see clicks by day, country and device.</li>
          <li><strong>QR codes:</strong> a quick generator, and a studio for custom colours, logos and gradients.</li>
          <li><strong>Images and PDFs:</strong> compress, resize and convert, all handled client-side.</li>
          <li><strong>Developer tools:</strong> JSON, JWT, Base64, UUID, URL encoding, timestamps, CSV and UTM links, plus a public API for short links.</li>
        </ul>
      </section>
      <section>
        <h2>Who Is Behind iNNkie</h2>
        <p>
          iNNkie is an independent product built and maintained by a small team of software engineers. We build and test
          every tool ourselves, and we write the guides on this site from hands-on experience with the problems the tools solve: redirects
          and link analytics, image formats and web performance, tokens and encodings, and campaign tracking.
        </p>
        <p>
          Questions, corrections and feature requests go to <a href="mailto:hello@innkie.com">hello@innkie.com</a>. Harmful links can be reported on our{' '}
          <Link href="/report-abuse">Report Abuse</Link> page.
        </p>
      </section>
      <section>
        <h2>How We Make Money</h2>
        <p>
          The free tools are supported by advertising from Google AdSense on public pages, and by optional paid features in the future.
          We never sell personal data, and we keep ads out of the signed-in workspace. Read how advertising and cookies work in our{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
      <div className="legal-footer">
        <p>&copy; {new Date().getFullYear()} iNNkie Utility Platform</p>
        <Link href="/features">See Features</Link>
      </div>
    </LegalShell>
  );
}
