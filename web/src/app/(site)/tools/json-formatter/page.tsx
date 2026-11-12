import { JsonFormatter } from '@/components/tools/JsonFormatter';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { buildMetadata } from '@/lib/seo';

const path = '/tools/json-formatter';
export const metadata = buildMetadata({
  title: 'JSON Formatter & Validator',
  description: 'Format, validate and minify JSON online. Shows the line and column of errors, a tree view and a TypeScript generator. Never rounds your numbers. Runs in your browser.',
  path,
});

export default function JsonFormatterPage() {
  return <ToolPageLayout path={path}><JsonFormatter /></ToolPageLayout>;
}
