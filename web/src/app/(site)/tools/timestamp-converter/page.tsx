import { RegistryToolPage } from '@/components/tools/RegistryToolPage';
import { TimestampConverter } from '@/components/tools/TimestampConverter';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

const path = '/tools/timestamp-converter';
export const metadata = registryMetadata(resolveToolPage(path));

export default function Page() {
  return (
    <RegistryToolPage path={path}>
      <TimestampConverter />
    </RegistryToolPage>
  );
}
