import { LegalShell } from '@/components/LegalShell';
import { PrintButton } from '@/components/PrintButton';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'Read our privacy policy to understand how iNNkie handles and protects your data.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" tagline="Last updated: November 12, 2026" action={<PrintButton />}>
      <JsonLd schema={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Privacy Policy', url: '/privacy' }])} />

      <h3>1. Introduction</h3>
      <p>Welcome to <strong>iNNkie</strong> (“we”, “our”, “us”). We provide a comprehensive digital utility platform designed to help users manage links, generate QR codes, optimize media, and analyze usage data. This Privacy Policy describes how we collect, use, disclose, and protect your personal data in accordance with data protection laws applicable in Africa, Europe, and North America.</p>

      <h3>2. Information We Collect</h3>
      <ul>
        <li><strong>Personal Information:</strong> name, email address, and account credentials when you register or sign in (including via Google or other third-party authentication).</li>
        <li><strong>Usage Data:</strong> IP address, browser type, device identifiers, referring pages, clicks, location (country-level), and timestamps.</li>
        <li><strong>Cookies and Tracking:</strong> small data files used for authentication, analytics, and preferences. You can manage cookies through browser settings.</li>
      </ul>

      <h3>3. How We Use Information</h3>
      <p>We use collected data to operate and improve our services, analyze performance, personalize experiences, secure our systems, communicate updates, and comply with legal obligations. We never sell your personal data.</p>

      <h3>4. Legal Bases for Processing (EU/EEA &amp; UK)</h3>
      <p>We process data based on: (a) your consent, (b) contractual necessity, (c) legitimate interests, and (d) legal obligations. Where consent applies, you may withdraw it anytime.</p>

      <h3>5. Data Transfers</h3>
      <p>Your data may be processed in servers located in Africa, the EU, or the United States. For international transfers, we rely on Standard Contractual Clauses or equivalent safeguards.</p>

      <h3>6. Data Retention</h3>
      <p>We retain personal information only as long as necessary for the purposes outlined or as required by law. Analytics linked to shortened URLs are retained while links remain active. Security logs are kept up to 12 months.</p>

      <h3>7. Your Rights</h3>
      <ul>
        <li><strong>EEA/UK:</strong> Access, rectification, erasure, restriction, portability, objection, and complaint to supervisory authorities.</li>
        <li><strong>US (California):</strong> Access, deletion, and opt-out rights under CCPA/CPRA.</li>
        <li><strong>Africa:</strong> Rights under POPIA (South Africa) and NDPR (Nigeria), including data access, correction, and deletion requests.</li>
      </ul>
      <p>Contact us at <a href="mailto:support@innkie.com">support@innkie.com</a> to exercise these rights.</p>

      <h3>8. Cookies and Tracking Technologies</h3>
      <p>We use cookies for essential site functionality and analytics. Non-essential cookies, including those used for advertising, require your consent. If you visit from the EEA, UK, or Switzerland, we present a consent banner on your first visit. You can change your choices at any time using the <strong>Cookie Settings</strong> link in our footer, or by adjusting your browser settings. Our browser-side tools (image, PDF, JSON, QR and similar utilities) process your files locally and do not upload them.</p>

      <h3>9. Advertising and Third-Party Cookies</h3>
      <p>We use Google AdSense to serve advertisements on our platform. To provide relevant ads, Google uses cookies (including the DoubleClick cookie) to serve ads based on your prior visits to our website or other websites on the Internet.</p>
      <ul>
        <li>Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visit to iNNkie and/or other sites on the Internet.</li>
        <li>Ads appear only on our public pages (tools, guides and marketing pages), not inside the signed-in workspace. You can learn how Google uses data from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">policies.google.com/technologies/partner-sites</a>.</li>
        <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Ads Settings</a>. Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener">www.aboutads.info</a>.</li>
      </ul>

      <h3>10. Security of Data</h3>
      <p>We implement encryption, access controls, and secure hosting. While we strive for full protection, no system is entirely immune from unauthorized access.</p>

      <h3>11. Children’s Privacy</h3>
      <p>iNNkie does not knowingly collect data from anyone under 13 (or 16 in the EU/EEA). If we learn of such collection, we delete it promptly.</p>

      <h3>12. Updates to This Policy</h3>
      <p>We may revise this Privacy Policy periodically. Material changes will be notified via the app or email. The latest version will always be available on this page.</p>

      <h3>13. Contact Information</h3>
      <p>For privacy inquiries, please email: <a href="mailto:support@innkie.com">support@innkie.com</a></p>
    </LegalShell>
  );
}
