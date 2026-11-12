import { ToolPageLayout } from './ToolPageLayout';

/** Standard layout for registry-driven tools: heading, the widget, then the shared explanation blocks. */
export function RegistryToolPage({ path, children, appCategory }: { path: string; children: React.ReactNode; appCategory?: string }) {
  return <ToolPageLayout path={path} appCategory={appCategory}>{children}</ToolPageLayout>;
}
