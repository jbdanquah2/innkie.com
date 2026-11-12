import Link from 'next/link';
import { LegalShell } from '@/components/LegalShell';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Report a Malicious or Abusive Link',
  description:
    'Report a phishing, malware, spam or otherwise abusive iNNkie short link. Learn what to include in a report and how we review and remove harmful links.',
  path: '/report-abuse',
});

export default function ReportAbusePage() {
  return (
    <LegalShell title="Report Abuse" tagline="Help us keep short links safe for everyone.">
      <JsonLd schema={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Report Abuse', url: '/report-abuse' }], '/report-abuse')} />
      <section>
        <h2>Found a harmful link?</h2>
        <p>
          iNNkie short links are created by our users, and we do not allow them to be used for phishing, malware distribution, scams,
          spam, illegal content, or content that infringes someone&apos;s rights. If you came across an iNNkie link that does any of
          these things, please tell us so we can review it and, where it breaks our rules, disable it.
        </p>
      </section>
      <section>
        <h2>How to report</h2>
        <p>Email <a href="mailto:support@innkie.com" className="font-bold">support@innkie.com</a> and include:</p>
        <ul>
          <li>The full short link (for example <code>https://innkie.com/abc123</code>).</li>
          <li>What is wrong with it: phishing, malware, scam, spam, copyright, or something else.</li>
          <li>Where you found the link (an email, a social post, a website), if you remember.</li>
          <li>Optional: screenshots, and your contact details if you want a reply.</li>
        </ul>
        <p className="muted">Please do not click through a link you believe is dangerous just to confirm it. The link itself is enough for us to investigate.</p>
      </section>
      <section>
        <h2>What happens next</h2>
        <ul>
          <li><strong>Review:</strong> we look at the destination and the account that created the link.</li>
          <li><strong>Action:</strong> links that break our <Link href="/terms">Terms of Service</Link> are disabled, and repeat or serious offenders lose their account.</li>
          <li><strong>Priority:</strong> reports of phishing and malware are handled first.</li>
        </ul>
      </section>
      <section>
        <h2>Copyright and legal requests</h2>
        <p>
          For copyright notices or legal requests, use the same address and put &quot;Legal&quot; in the subject. Please identify the work,
          the infringing link, and how we can reach you. For general help, see our <Link href="/contact">contact page</Link>.
        </p>
      </section>
    </LegalShell>
  );
}
