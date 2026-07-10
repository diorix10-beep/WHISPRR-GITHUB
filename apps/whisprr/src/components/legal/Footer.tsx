import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';

export interface FooterProps {
  product: 'whisprr' | 'chimera';
}

export function Footer({ product }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const whisprrLinks = [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Community Guidelines', href: '/guidelines' },
    { label: 'Creator Policy', href: '/creator-policy' },
    { label: 'Messaging Policy', href: '/messaging-policy' },
    { label: 'Advertising Policy', href: '/advertising-policy' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ];

  const links = whisprrLinks;

  return (
    <footer className="w-full bg-warm-900 text-warm-200 py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex flex-col gap-4 max-w-sm">
          <Logo size={28} />
          <p className="text-sm text-warm-400">
            The premium social network for authentic human connection, community building, and creative expression.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-4">
          <div className="col-span-2 sm:col-span-3">
            <h3 className="font-semibold text-white mb-4 uppercase text-xs tracking-wider">Legal &amp; Policy</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-warm-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-warm-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-warm-500">
          © {currentYear} WHISPRR. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm text-warm-500">
          <span>contact@whisprr.xyz</span>
        </div>
      </div>
    </footer>
  );
}
