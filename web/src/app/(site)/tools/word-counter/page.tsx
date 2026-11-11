import { RegistryToolPage } from '@/components/tools/RegistryToolPage';
import { WordCounter } from '@/components/tools/WordCounter';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

const path = '/tools/word-counter';
export const metadata = registryMetadata(resolveToolPage(path));

export default function Page() {
  return (
    <RegistryToolPage path={path}>
      <WordCounter />
    </RegistryToolPage>
  );
}
