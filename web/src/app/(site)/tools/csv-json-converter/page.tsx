import { DataConverter } from '@/components/tools/DataConverter';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { buildMetadata } from '@/lib/seo';

const path = '/tools/csv-json-converter';
export const metadata = buildMetadata({
  title: 'CSV to JSON and JSON to CSV Converter',
  description: 'Convert CSV to JSON and JSON to CSV online. Handles quoted values and multi-line cells, detects the separator, and never turns IDs like 007 into numbers. Runs in your browser.',
  path,
});

export default function CsvJsonConverterPage() {
  return <ToolPageLayout path={path}><DataConverter /></ToolPageLayout>;
}
