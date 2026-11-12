import Link from 'next/link';
import { LegalShell } from '@/components/LegalShell';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'About Our Mission & Privacy',
  description:
    'Learn about iNNkie, the privacy-focused utility platform. Discover our mission to provide high-performance, browser-side tools for creators and developers.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <LegalShell title="About iNNkie" tagline="The All-in-One Utility Platform for Modern Creators.">
      <JsonLd schema={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'About', url: '/about' }], '/about')} />
      <section>
        <h2>Our Mission</h2>
        <p>
          iNNkie was born out of a simple frustration: the web is full of utility tools that are either cluttered with intrusive ads,
          require slow file uploads, or compromise user privacy. We set out to build a &quot;Swiss Army Knife&quot; for the modern web—a suite
          of high-performance tools that are fast, beautiful, and run entirely in your browser.
        </p>
      </section>
      <section>
        <h2>Privacy First, Always</h2>
        <p>
          Unlike many other platforms, iNNkie&apos;s tools (like our Image Optimizer and QR Generator) process your data locally on your device.
          Your images and sensitive data never touch our servers. We believe that your productivity should not come at the cost of your privacy.
        </p>
      </section>
      <section>
        <h2>The iNNkie Ecosystem</h2>
        <p>iNNkie is more than just a collection of tools. It&apos;s an integrated ecosystem designed for teams and individuals:</p>
        <ul>
          <li><strong>Smart Link Management:</strong> High-fidelity redirection with real-time analytics and branded short domains.</li>
          <li><strong>QR Studio:</strong> QR design with custom colours, logos and gradients.</li>
          <li><strong>Media Optimization:</strong> Zero-latency image compression and conversion, all handled client-side.</li>
          <li><strong>Developer Utilities:</strong> Clean, precise tools for JSON formatting, UTM building, and more.</li>
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
      <section>
        <h2>Built for Speed</h2>
        <p>
          iNNkie is optimized for the highest possible performance. Whether you&apos;re a developer needing a quick JSON format or a marketer
          building a complex campaign, iNNkie is built to keep you in your flow.
        </p>
      </section>
      <div className="legal-footer">
        <p>&copy; {new Date().getFullYear()} iNNkie Utility Platform</p>
        <Link href="/features">See Features</Link>
      </div>
    </LegalShell>
  );
}
