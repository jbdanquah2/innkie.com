import { LinkShortenerPage } from '@/components/tools/LinkShortenerPage';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

export const metadata = registryMetadata(resolveToolPage('/tools/custom-short-links'));

export default function Page() {
  return <LinkShortenerPage path="/tools/custom-short-links" />;
}
