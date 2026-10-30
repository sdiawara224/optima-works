import Image from 'next/image';
import type { Metadata } from 'next';
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  Check,
  MapPin,
  MessageCircle,
  MoveUpRight,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { getMailConfiguration } from '@/lib/mail';
import { HeroArt } from '@/components/hero-art';
import { BrandUniverse } from '@/components/brand-universe';
import { ServiceCards, Portfolio, FaqItem, RevealObserver } from '@/components/interactive';
import { ContactForm } from '@/components/contact-form';
import { FinalCta } from '@/components/footer';
import { ArticleCards } from '@/components/articles';
import { contactLinks, getContent, safeUrl } from '@/lib/content';

const steps = [
  [
    'On vous écoute.',
    'Tout commence par un échange. Vos idées, vos enjeux et vos ambitions donnent le cap.',
  ],
  [
    'On pose les bases.',
    'Nous analysons vos besoins et construisons une proposition claire, pensée pour vous.',
  ],
  [
    'On donne forme.',
    'Un plan, des étapes et de la coordination : votre projet avance avec méthode et créativité.',
  ],
  [
    'On va jusqu’au bout.',
    'Nous livrons, faisons le point et vous accompagnons dans la prise en main.',
  ],
];

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getContent();
  return {
    ...(settings.homeSeo?.title ? { title: settings.homeSeo.title } : {}),
    ...(settings.homeSeo?.description ? { description: settings.homeSeo.description } : {}),
    ...(process.env.SITE_URL ? { alternates: { canonical: '/' } } : {}),
  };
}

export default async function Home() {
  const { services, faqs, projects, articles, settings } = await getContent();
  const links = contactLinks(settings);
  const emailEnabled = !!getMailConfiguration();
  return (
    <main id="contenu">
      <RevealObserver />
      <section className="hero">
        <div className="container">
          <div className="hero-main">
            <div className="hero-copy">
              <div className="eyebrow hero-eyebrow">
                <span className="mini-dot" /> VOTRE AMBITION, NOTRE POINT DE DÉPART
              </div>
              <h1>
                {settings.heroTitle || (
                  <>
                    Donnons vie
                    <br />à vos idées.
                    <br />
                    <span className="hero-last">
                      Créons <span className="serif-word">l’impact.</span>
                      <svg viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden="true">
                        <path
                          d="M4 14Q175 -4 395 8"
                          stroke="currentColor"
                          strokeWidth="5"
                          fill="none"
                        />
                      </svg>
                    </span>
                  </>
                )}
              </h1>
              <p className="hero-description">
                {settings.heroDescription ||
                  'De l’idée à la réalisation, nous réunissons créativité, stratégie et méthode pour faire grandir vos projets.'}
              </p>
              <div className="hero-actions">
                <a className="button" href="#services">
                  Découvrir nos services <ArrowUpRight size={18} />
                </a>
                <a href="#contact" className="text-link">
                  Discuter de mon projet <ArrowRight size={17} />
                </a>
              </div>
              <div className="hero-location">
                <MapPin size={14} />
                <span>Basés à Conakry. Tournés vers vos ambitions.</span>
              </div>
            </div>
            <HeroArt />
          </div>
          <div className="hero-bottom">
            <a href="#services" className="scroll-cue">
              <span>
                <ArrowDown size={15} />
              </span>
              FAITES DÉFILER, DÉCOUVREZ LES POSSIBLES
            </a>
            <span>
              UNE VISION D’ENSEMBLE. <b>QUATRE EXPERTISES.</b>
            </span>
          </div>
        </div>
      </section>
      <div className="expertise-strip" aria-label="Nos quatre domaines d’expertise">
        <div className="container strip-inner">
          <span>Graphisme & Design</span>
          <Asterisk />
          <span>Consulting & Stratégie</span>
          <Asterisk />
          <span>Gestion de Projets</span>
          <Asterisk />
          <span>Formation & Accompagnement</span>
          <Asterisk />
        </div>
      </div>

      <section className="section services-section" id="services">
        <div className="container">
          <div className="section-heading reveal">
            <div>
              <span className="eyebrow">
                <span className="section-num">01 /</span> NOS EXPERTISES
              </span>
              <h2>
                Une idée. Plusieurs leviers.
                <br />
                <span className="text-muted">Un même objectif : avancer.</span>
              </h2>
            </div>
            <p>
              Quatre expertises complémentaires pour
              <br className="desktop-break" /> transformer vos ambitions en actions concrètes.
            </p>
          </div>
          <ServiceCards services={services} />
          <div className="services-bottom">
            <span>
              <Sparkles size={16} />
              Chaque projet est unique. Notre accompagnement aussi.
            </span>
            <a href="#contact" className="text-link">
              Trouvons votre solution <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <section className="about-section" id="a-propos">
        <div className="container about-grid">
          <figure className="about-brand-visual reveal">
            <Image
              src="/images/optimaworks-vision.webp"
              alt="Visuel OptimaWorks : un œil à l’iris vert avec le logo, évoquant la vision de marque, le design et la communication."
              width={1200}
              height={1499}
              sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1150px) 42vw, 440px"
            />
          </figure>
          <div className="about-copy reveal">
            <span className="eyebrow">
              <span className="section-num">02 /</span> L’ESPRIT OPTIMAWORKS
            </span>
            <h2>
              De la créativité.
              <br />
              De la structure.
              <br />
              <span>Et surtout, du sens.</span>
            </h2>
            <p>
              {settings.aboutText ||
                'Nous accompagnons les entreprises, entrepreneurs et porteurs de projets qui veulent donner une nouvelle dimension à leurs idées.'}
            </p>
            <p>
              Notre conviction : une belle idée prend toute sa valeur lorsqu’elle s’appuie sur une
              vision claire et une réalisation structurée.
            </p>
            <div className="about-values">
              <span>
                <Check size={16} />
                Une approche personnalisée
              </span>
              <span>
                <Check size={16} />
                Une vision d’ensemble
              </span>
              <span>
                <Check size={16} />
                Un accompagnement à chaque étape
              </span>
            </div>
            <a href="#approche" className="text-link light-link">
              Découvrir notre façon de travailler <ArrowUpRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <BrandUniverse />

      <section className="section approach-section" id="approche">
        <div className="container">
          <div className="section-heading reveal">
            <div>
              <span className="eyebrow">
                <span className="section-num">03 /</span> NOTRE APPROCHE
              </span>
              <h2>
                Les idées sont le début.
                <br />
                <span className="text-muted">La méthode fait la différence.</span>
              </h2>
            </div>
            <p>
              Un chemin clair, une collaboration simple.
              <br />
              Et votre projet au centre, à chaque étape.
            </p>
          </div>
          <div className="steps-grid">
            {steps.map(([title, description], i) => (
              <article className="step reveal" key={title}>
                <div className="step-number">
                  <span>0{i + 1}</span>
                  {i < 3 ? <ArrowRight size={20} /> : <Check size={20} />}
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section portfolio-section" id="realisations">
        <div className="container">
          <div className="section-heading reveal">
            <div>
              <span className="eyebrow">
                <span className="section-num">04 /</span> NOS RÉALISATIONS
              </span>
              <h2>
                Des idées qui
                <br />
                <span className="serif-word">prennent forme.</span>
                <span className="heading-dot">↗</span>
              </h2>
            </div>
            <p>
              Identités, stratégies, projets :<br />
              découvrez notre travail, au fil des collaborations.
            </p>
          </div>
          <Portfolio projects={projects} />
        </div>
      </section>

      <section className="why-section">
        <div className="container why-grid">
          <div className="reveal">
            <span className="eyebrow">POURQUOI OPTIMAWORKS ?</span>
            <h2>
              Pas une solution toute faite.
              <br />
              <span>La vôtre.</span>
            </h2>
            <p>
              Votre projet ne ressemble à aucun autre.
              <br />
              Notre façon de l’accompagner non plus.
            </p>
            <a href="#contact" className="text-link">
              Faisons connaissance <ArrowUpRight size={17} />
            </a>
          </div>
          <figure className="why-brand-visual reveal">
            <Image
              src="/images/optimaworks-public.webp"
              alt="Connaissez-vous vraiment votre public ? Un visuel montrant un homme en blanc au milieu d’un groupe, sur un fond vert."
              width={1200}
              height={1499}
              sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 40vw, 300px"
            />
          </figure>
          <div className="why-reasons">
            <article>
              <span className="reason-icon">
                <Target size={23} strokeWidth={1.5} />
              </span>
              <div>
                <h3>Du sur-mesure, pas du standard.</h3>
                <p>Nous partons de vos besoins, de votre contexte et de vos objectifs.</p>
              </div>
            </article>
            <article>
              <span className="reason-icon">
                <Sparkles size={23} strokeWidth={1.5} />
              </span>
              <div>
                <h3>La créativité rencontre la méthode.</h3>
                <p>Des idées pertinentes, une organisation claire et une attention aux détails.</p>
              </div>
            </article>
            <article>
              <span className="reason-icon">
                <Zap size={23} strokeWidth={1.5} />
              </span>
              <div>
                <h3>Un partenaire, pas juste un prestataire.</h3>
                <p>Un dialogue ouvert et un accompagnement tout au long de votre projet.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section journal-section" id="journal">
        <div className="container">
          <div className="section-heading reveal">
            <div>
              <span className="eyebrow">
                <span className="section-num">05 /</span> LE JOURNAL
              </span>
              <h2>
                Un peu de recul.
                <br />
                <span className="text-muted">Beaucoup d’idées.</span>
              </h2>
            </div>
            <Link href="/blog" className="text-link">
              Explorer le journal <ArrowUpRight size={18} />
            </Link>
          </div>
          <ArticleCards articles={articles.slice(0, 3)} />
        </div>
      </section>

      <section className="section faq-section" id="faq">
        <div className="container faq-grid">
          <div className="reveal">
            <span className="eyebrow">
              <span className="section-num">06 /</span> VOS QUESTIONS
            </span>
            <h2>
              Tout commence
              <br />
              par <span className="serif-word">un échange.</span>
            </h2>
            <p>
              Une question, une hésitation ?<br />
              Nous sommes là pour en parler.
            </p>
            <a href="#contact" className="text-link">
              Poser ma question <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="faq-list">
            {faqs.length ? (
              faqs.map((f) => <FaqItem key={f._id} question={f.question} answer={f.answer} />)
            ) : (
              <>
                <FaqItem
                  question="Quels services propose OptimaWorks ?"
                  answer="OptimaWorks réunit quatre domaines d’expertise : le graphisme et le design, le consulting et la stratégie, la gestion de projets ainsi que la formation et l’accompagnement."
                />
                <FaqItem
                  question="Comment présenter mon projet ?"
                  answer="Le formulaire ci-dessous vous permet de décrire votre besoin et de sélectionner le service concerné. L’envoi par e-mail sera disponible après la configuration de la messagerie professionnelle."
                />
                <div className="faq-pending">
                  <MessageCircle size={18} />
                  <p>D’autres réponses seront publiées après validation par notre équipe.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section contact-section" id="contact">
        <div className="container contact-grid">
          <div className="contact-copy reveal">
            <span className="eyebrow">
              <span className="section-num">07 /</span> ET SI ON EN PARLAIT ?
            </span>
            <h2>
              Votre prochaine
              <br />
              grande idée
              <br />
              <span className="serif-word">commence ici.</span>
              <ArrowDownRight className="contact-arrow" strokeWidth={1} />
            </h2>
            <p>
              Un projet à lancer, une marque à faire évoluer ou simplement besoin d’y voir plus
              clair ? Faisons le premier pas ensemble.
            </p>
            <div className="contact-detail">
              <span className="contact-detail-icon">
                <MapPin size={21} strokeWidth={1.5} />
              </span>
              <div>
                <span>RETROUVONS-NOUS</span>
                <p>
                  {settings.address || 'Taouyah, Conakry'}
                  <br />
                  République de Guinée
                </p>
              </div>
            </div>
            {links.email && (
              <a className="contact-email" href={links.email}>
                {settings.email}
                <ArrowUpRight size={18} />
              </a>
            )}
            {links.phone && (
              <a className="contact-email" href={links.phone}>
                {settings.phone}
                <ArrowUpRight size={18} />
              </a>
            )}
            {links.whatsapp && (
              <a href={links.whatsapp} className="whatsapp-link" target="_blank" rel="noreferrer">
                <MessageCircle size={20} />
                Discuter sur WhatsApp
                <ArrowUpRight size={17} />
              </a>
            )}
            {!links.phone && !links.email && (
              <p className="contact-pending">
                Les coordonnées directes seront affichées
                <br />
                après confirmation par OptimaWorks.
              </p>
            )}
            {settings.socialLinks?.filter((s) => safeUrl(s.url)).length ? (
              <div className="social-links">
                {settings.socialLinks
                  .filter((s) => safeUrl(s.url))
                  .map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                      {s.label}
                      <MoveUpRight size={14} />
                    </a>
                  ))}
              </div>
            ) : null}
          </div>
          <ContactForm
            enabled={emailEnabled}
            phone={links.phone}
            whatsapp={links.whatsapp}
            email={links.email}
          />
        </div>
      </section>
      <FinalCta />
    </main>
  );
}
