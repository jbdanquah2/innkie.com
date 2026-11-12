import { LegalShell } from '@/components/LegalShell';
import { PrintButton } from '@/components/PrintButton';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Terms of Service',
  description: 'Read our terms of service to understand the rules and guidelines for using iNNkie.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" tagline="Last updated: November 12, 2026" action={<PrintButton />}>
      <JsonLd schema={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Terms of Service', url: '/terms' }])} />

      <h3>1. Acceptance</h3>
      <p>By using iNNkie you agree to these Terms and our Privacy Policy. If you do not agree, please discontinue use of the service.</p>

      <h3>2. Eligibility</h3>
      <p>You must be at least 13 years old (or 16 in the EU/EEA) to use the service.</p>

      <h3>3. Account Responsibilities</h3>
      <p>Keep your login credentials secure. You are responsible for all activity under your account. Report unauthorized access to <a href="mailto:support@innkie.com">support@innkie.com</a>.</p>

      <h3>4. Acceptable Use</h3>
      <p>Users must not use iNNkie for phishing, spam, malware, fraud, illegal content, or copyright violations. We reserve the right to disable links and suspend or terminate accounts that violate these terms, and to scan destinations against safe-browsing and abuse lists. To report a harmful link, see <a href="/report-abuse">Report Abuse</a>.</p>

      <h3>4a. Advertising</h3>
      <p>Public pages of iNNkie, including the free tools and guides, display advertisements served by Google AdSense. We do not place ads in the signed-in workspace. Ads are third-party content and their presence is not an endorsement.</p>

      <h3>5. Link Management and Analytics</h3>
      <p>Shortened links are public by default. Analytics are aggregated and anonymized. Deleted links cannot be recovered.</p>

      <h3>6. Disclaimer and Limitation of Liability</h3>
      <p>The service is provided “as is” without warranties of any kind. To the fullest extent allowed by law, iNNkie is not liable for any indirect, incidental, or consequential damages.</p>

      <h3>7. Termination</h3>
      <p>We may suspend or terminate service access for violations or legal reasons. Users can delete their accounts anytime.</p>

      <h3>8. Regional Legal Compliance</h3>
      <p>We comply with GDPR (EU/UK), CCPA/CPRA (US), POPIA (South Africa), NDPR (Nigeria), and other relevant regulations.</p>

      <h3>9. Governing Law</h3>
      <p>Applicable law depends on region: Ghana (Africa), UK (Europe), Delaware, USA (North America). Disputes will be resolved in competent courts within these jurisdictions.</p>

      <h3>10. Contact</h3>
      <p>Email: <a href="mailto:support@innkie.com">support@innkie.com</a></p>
    </LegalShell>
  );
}
