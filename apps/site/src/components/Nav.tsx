import { useState } from 'react';
import type { Lang } from '../i18n/translations';
import { useTranslations, localizedPath } from '../i18n/utils';

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

interface Props {
  currentPath: string;
  lang: Lang;
  alternateLang: Lang;
  alternatePath: string;
}

export default function Nav({ currentPath, lang, alternateLang, alternatePath }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations(lang);

  const navLinks: NavLink[] = [
    { label: t('nav.home'), href: localizedPath(lang, '/') },
    { label: t('nav.docs'), href: localizedPath(lang, '/docs') },
    { label: t('nav.github'), href: 'https://github.com/elleVas', external: true },
  ];

  const isActive = (href: string) =>
    currentPath === href || (href !== localizedPath(lang, '/') && currentPath.startsWith(href));

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[var(--width-content)] items-center justify-between px-6 py-4">
        {/* Logo */}
        <a
          href={localizedPath(lang, '/')}
          className="font-heading text-lg font-bold bg-gradient-to-br from-text-primary to-text-secondary bg-clip-text text-transparent transition-opacity hover:opacity-80"
        >
          ellevas
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className={`text-sm transition-colors hover:text-text-primary ${
                    isActive(link.href) ? 'bg-gradient-to-br from-text-primary to-text-secondary bg-clip-text text-transparent' : 'text-text-secondary'
                  }`}
                >
                  {link.label}
                  {link.external && (
                    <svg
                      className="ml-1 inline-block h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  )}
                </a>
              </li>
            ))}
          </ul>

          {/* Language toggle */}
          <a
            href={alternatePath}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
            aria-label={`Switch to ${alternateLang === 'it' ? 'Italian' : 'English'}`}
          >
            {alternateLang.toUpperCase()}
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text-primary md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t border-border md:hidden">
          <ul className="space-y-1 px-6 py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-bg-subtle ${
                    isActive(link.href) ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={alternatePath}
                className="block rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-subtle hover:text-accent"
              >
                {alternateLang === 'it' ? '🇮🇹 Italiano' : '🇬🇧 English'}
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
