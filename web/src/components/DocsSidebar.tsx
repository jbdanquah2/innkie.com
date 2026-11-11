'use client';
import { useState } from 'react';

const MENU = [
  { title: 'Getting Started', items: [{ id: 'intro', label: 'Introduction' }, { id: 'auth', label: 'Authentication' }] },
  { title: 'Endpoints', items: [{ id: 'links', label: 'Links' }, { id: 'workspaces', label: 'Workspaces' }, { id: 'analytics', label: 'Analytics' }] },
  { title: 'Webhooks', items: [{ id: 'webhooks', label: 'Overview' }, { id: 'signature', label: 'Signature Verification' }] },
];

/** Anchor links (crawlable, work without JS); highlights the last clicked section. */
export function DocsSidebar() {
  const [active, setActive] = useState('intro');
  return (
    <aside className="hidden lg:block lg:col-span-3 space-y-8 sticky top-28 h-fit">
      {MENU.map((section) => (
        <div key={section.title} className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{section.title}</h3>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setActive(item.id)}
                  className={`block w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    active === item.id ? 'text-primary-600 bg-primary-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
