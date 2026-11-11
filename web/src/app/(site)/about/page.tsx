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
          <li><strong>QR Studio:</strong> Professional-grade QR design with custom branding, logos, and gradients.</li>
          <li><strong>Media Optimization:</strong> Zero-latency image compression and conversion, all handled client-side.</li>
          <li><strong>Developer Utilities:</strong> Clean, precise tools for JSON formatting, UTM building, and more.</li>
        </ul>
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
