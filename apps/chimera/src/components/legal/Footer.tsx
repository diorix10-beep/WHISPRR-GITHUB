import React from 'react';
import { Link } from 'react-router-dom';

export interface FooterProps {
  product: 'chimera';
}

export function Footer({ product }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const chimeraLinks = [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'AI Safety Policy', href: '/ai-safety-policy' },
    { label: 'Responsible AI Policy', href: '/responsible-ai-policy' },
    { label: 'Persona Policy', href: '/persona-policy' },
    { label: 'AI Creator Policy', href: '/ai-creator-policy' },
    { label: 'Model Usage Policy', href: '/model-usage-policy' },
    { label: 'Prompt Policy', href: '/prompt-policy' },
    { label: 'Memory Policy', href: '/memory-policy' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ];

  return (
    <footer className="w-full bg-warm-950 border-t border-white/5 text-warm-300 py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            <span className="font-bold text-white tracking-wider text-sm">CHIMERA</span>
          </div>
          <p className="text-sm text-warm-500">
            The professional AI Studio for creating, managing, and interacting with state-of-the-art intelligent personas.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-warm-300 mb-4 uppercase text-xs tracking-wider">Legal &amp; Policy</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
            {chimeraLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-sm text-warm-500 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-warm-600">
          © {currentYear} CHIMERA. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm text-warm-600">
          <span>contact@chimera.whisprr.xyz</span>
        </div>
      </div>
    </footer>
  );
}
