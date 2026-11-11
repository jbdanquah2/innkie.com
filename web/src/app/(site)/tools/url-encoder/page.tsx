import { RegistryToolPage } from '@/components/tools/RegistryToolPage';
import { UrlEncoder } from '@/components/tools/UrlEncoder';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

const path = '/tools/url-encoder';
export const metadata = registryMetadata(resolveToolPage(path));

export default function Page() {
  return (
    <RegistryToolPage path={path}>
      <UrlEncoder />
    </RegistryToolPage>
  );
}
