import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// Public site chrome. Routes that hid the layout in Angular (login, /r/[code], 404) live outside this group.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-primary-100 selection:text-primary-700">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
