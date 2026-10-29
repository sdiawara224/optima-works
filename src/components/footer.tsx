import Link from 'next/link';
import { ArrowUpRight, ArrowUp, Asterisk } from 'lucide-react';
import { Logo } from './site-header';
import { getContent, contactLinks } from '@/lib/content';

export async function Footer() {
  const { settings } = await getContent();
  const links = contactLinks(settings);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo light />
            <p>
              Vos idées prennent forme.
              <br />
              Vos projets gagnent en impact.
            </p>
            <span className="footer-location">
              <span className="mini-dot" />
              Taouyah, Conakry · Guinée
            </span>
          </div>
          <div className="footer-links">
            <span>EXPLORER</span>
            <Link href="/#a-propos">À propos</Link>
            <Link href="/#services">Nos expertises</Link>
            <Link href="/#realisations">Réalisations</Link>
            <Link href="/#approche">Notre approche</Link>
          </div>
          <div className="footer-links">
            <span>ÉCHANGEONS</span>
            <Link href="/#contact">
              Parlons de votre projet <ArrowUpRight size={14} />
            </Link>
            {links.email && (
              <a href={links.email}>
                {settings.email}
                <ArrowUpRight size={14} />
              </a>
            )}
            <Link href="/blog">Le journal</Link>
            <Link href="/#faq">Questions fréquentes</Link>
          </div>
          <a className="back-top" href="#haut" aria-label="Retour en haut de page">
            <ArrowUp size={19} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} OptimaWorks. Tous droits réservés.</span>
          <div>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </div>
          <span className="made-with">
            Pensé avec intention. <Asterisk size={16} />
          </span>
        </div>
      </div>
    </footer>
  );
}

export function FinalCta() {
  return (
    <section className="final-cta">
      <div className="container final-cta-inner">
        <div>
          <span className="eyebrow">
            <span className="mini-dot" /> LA SUITE S’ÉCRIT ENSEMBLE
          </span>
          <h2>
            Vous avez un projet en tête ?<br />
            <span>Donnons-lui de l’élan.</span>
          </h2>
        </div>
        <a className="button button-dark" href="/#contact">
          Démarrer mon projet <ArrowUpRight size={20} />
        </a>
        <Asterisk className="cta-asterisk" aria-hidden="true" />
      </div>
    </section>
  );
}
