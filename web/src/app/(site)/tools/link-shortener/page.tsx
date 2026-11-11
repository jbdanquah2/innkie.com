import { LinkShortenerPage } from '@/components/tools/LinkShortenerPage';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

export const metadata = registryMetadata(resolveToolPage('/tools/link-shortener'));

export default function Page() {
  return <LinkShortenerPage path="/tools/link-shortener" />;
}
