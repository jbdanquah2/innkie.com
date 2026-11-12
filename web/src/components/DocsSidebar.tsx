'use client';
import { useState } from 'react';

const MENU = [
  { title: 'Getting started', items: [{ id: 'intro', label: 'Introduction' }, { id: 'auth', label: 'Authentication' }, { id: 'limits', label: 'Limits and errors' }] },
  { title: 'Links', items: [
    { id: 'create', label: 'Create a link' }, { id: 'list', label: 'List links' }, { id: 'get', label: 'Get a link' },
    { id: 'update', label: 'Update a link' }, { id: 'delete', label: 'Delete a link' }, { id: 'clicks', label: 'Click statistics' }, { id: 'link-object', label: 'The link object' },
  ] },
  { title: 'Webhooks', items: [{ id: 'webhooks', label: 'Events' }, { id: 'signature', label: 'Verifying signatures' }] },
];

/** Anchor links (crawlable, work without JS); highlights the last clicked section. */
export function DocsSidebar() {
  const [active, setActive] = useState('intro');
  return (
    <aside aria-label="Documentation" className="hidden lg:block lg:col-span-3 space-y-7 sticky top-24 h-fit">
      {MENU.map((section) => (
        <div key={section.title}>
          <h2 className="text-sm font-semibold text-slate-900 mb-2">{section.title}</h2>
          <ul className="border-l border-slate-200">
            {section.items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setActive(item.id)}
                  className={`block -ml-px pl-4 py-1.5 text-sm border-l transition-colors ${
                    active === item.id ? 'border-primary-600 text-primary-700 font-medium' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-400'
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
