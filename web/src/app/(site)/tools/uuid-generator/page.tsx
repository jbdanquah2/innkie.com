import { RegistryToolPage } from '@/components/tools/RegistryToolPage';
import { UuidGenerator } from '@/components/tools/UuidGenerator';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

const path = '/tools/uuid-generator';
export const metadata = registryMetadata(resolveToolPage(path));

export default function Page() {
  return (
    <RegistryToolPage path={path}>
      <UuidGenerator />
    </RegistryToolPage>
  );
}
