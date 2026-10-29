'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const navigation = [
  ['À propos', '/#a-propos'],
  ['Services', '/#services'],
  ['Réalisations', '/#realisations'],
  ['Notre approche', '/#approche'],
  ['Blog', '/blog'],
  ['FAQ', '/#faq'],
  ['Contact', '/#contact'],
];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="OptimaWorks — Accueil"
      className={`logo ${light ? 'logo-light' : ''}`}
    >
      <Image
        src="/brand/optimaworks-logo-clair.png"
        alt="Logo officiel OptimaWorks"
        width={1044}
        height={312}
        sizes="(max-width: 380px) 134px, (max-width: 760px) 150px, 210px"
        className="official-logo-image"
        preload
      />
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menu.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
      if (e.key === 'Tab') {
        const items = [
          button.current,
          ...Array.from(menu.current?.querySelectorAll<HTMLElement>('a') ?? []),
        ].filter(Boolean) as HTMLElement[];
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="Navigation principale">
            {navigation.map(([label, href]) => (
              <Link href={href} key={href}>
                {label}
              </Link>
            ))}
          </nav>
          <Link href="/#contact" className="button button-small header-cta">
            Demander un devis <ArrowUpRight size={16} />
          </Link>
          <button
            ref={button}
            className="menu-toggle"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {open && (
        <div ref={menu} id="mobile-menu" className="mobile-menu">
          <nav aria-label="Navigation mobile">
            <Link href="/" onClick={() => setOpen(false)}>
              Accueil <ArrowUpRight />
            </Link>
            {navigation.map(([label, href]) => (
              <Link href={href} key={href} onClick={() => setOpen(false)}>
                {label}
                <ArrowUpRight />
              </Link>
            ))}
          </nav>
          <span>Taouyah, Conakry · Guinée</span>
        </div>
      )}
    </>
  );
}
