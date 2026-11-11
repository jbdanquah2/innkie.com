import { LinkDetails } from '@/components/app/LinkDetails';

// One pre-rendered shell for every /dashboard/details/<code>/ URL (firebase.json rewrites /dashboard/details/** to it).
export default function Page() {
  return <LinkDetails />;
}
