'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Layers3,
  PenTool,
  Plus,
  X,
  GraduationCap,
  FolderOpen,
} from 'lucide-react';
import type { Project, Service } from '@/lib/content';

export function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll('.reveal').forEach((el) => {
      el.classList.add('will-reveal');
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return null;
}
const icons = { design: PenTool, strategy: Compass, projects: Layers3, training: GraduationCap };

export function ServiceCards({ services }: { services: Service[] }) {
  const [selected, setSelected] = useState<Service | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  return (
    <>
      <div className="services-grid">
        {services.map((service, index) => {
          const Icon = icons[service.icon as keyof typeof icons] ?? Compass;
          return (
            <article className="service-card reveal" key={service._id}>
              <div className="service-card-top">
                <div className="service-icon">
                  <Icon size={26} strokeWidth={1.5} />
                </div>
                <span className="index">0{index + 1}</span>
              </div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <ul>
                {service.offerings?.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button className="service-link" onClick={() => setSelected(service)}>
                Explorer ce service{' '}
                <span>
                  <ArrowUpRight size={20} />
                </span>
              </button>
            </article>
          );
        })}
      </div>
      <dialog
        ref={dialog}
        className="detail-dialog"
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        {selected && (
          <div className="dialog-content">
            <button
              className="close-dialog"
              aria-label="Fermer le détail du service"
              onClick={() => dialog.current?.close()}
              autoFocus
            >
              <X />
            </button>
            <span className="eyebrow">NOTRE EXPERTISE</span>
            <h2>{selected.name}</h2>
            <p>{selected.details}</p>
            <ul className="detail-list">
              {selected.offerings?.map((o) => (
                <li key={o}>
                  <Check size={18} />
                  {o}
                </li>
              ))}
            </ul>
            <a
              href={`/?service=${encodeURIComponent(selected.name)}#contact`}
              className="button"
              onClick={() => dialog.current?.close()}
            >
              Discuter de mon projet <ArrowUpRight size={18} />
            </a>
          </div>
        )}
      </dialog>
    </>
  );
}

export function Portfolio({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState('Tous les projets');
  const [selected, setSelected] = useState<Project | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  const categories = ['Tous les projets', ...new Set(projects.map((p) => p.category))];
  if (!projects.length)
    return (
      <div className="portfolio-empty reveal">
        <div className="empty-art" aria-hidden="true">
          <div className="empty-sheet">
            <span />
            <span />
            <span />
            <ArrowUpRight />
          </div>
          <div className="empty-dot" />
        </div>
        <div>
          <span className="eyebrow">DE BELLES HISTOIRES À PARTAGER</span>
          <h3>Nos projets prennent place ici.</h3>
          <p>
            Une sélection de réalisations sera prochainement présentée.
            <br className="desktop-break" /> Et si nous commencions par votre projet ?
          </p>
        </div>
        <a href="#contact" className="circle-link" aria-label="Parlons de votre projet">
          <ArrowUpRight />
        </a>
      </div>
    );
  return (
    <>
      <div className="filters" aria-label="Catégories de projets">
        {categories.map((c) => (
          <button
            key={c}
            className={filter === c ? 'active' : ''}
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="project-grid">
        {projects
          .filter((p) => filter === categories[0] || p.category === filter)
          .map((p) => (
            <button className="project-card" key={p._id} onClick={() => setSelected(p)}>
              {p.image ? (
                <img src={p.image} alt={p.alt ?? ''} loading="lazy" />
              ) : (
                <div className="project-placeholder">
                  <FolderOpen />
                </div>
              )}
              <span className="eyebrow">{p.category}</span>
              <h3>
                {p.title}
                <ArrowUpRight />
              </h3>
              <p>{p.summary}</p>
            </button>
          ))}
      </div>
      <dialog
        ref={dialog}
        className="detail-dialog"
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        {selected && (
          <div className="dialog-content">
            <button
              className="close-dialog"
              aria-label="Fermer le projet"
              onClick={() => dialog.current?.close()}
              autoFocus
            >
              <X />
            </button>
            <span className="eyebrow">{selected.category}</span>
            <h2>{selected.title}</h2>
            {selected.image && (
              <img className="project-detail-image" src={selected.image} alt={selected.alt ?? ''} />
            )}
            <p className="preserve-lines">{selected.description || selected.summary}</p>
          </div>
        )}
      </dialog>
    </>
  );
}

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="faq-item">
      <summary>
        {question}
        <Plus size={20} />
      </summary>
      <div className="faq-answer">
        <p>{answer}</p>
      </div>
    </details>
  );
}

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <button
      className="text-link"
      onClick={async () => {
        try {
          if (navigator.share) await navigator.share({ title, url: window.location.href });
          else {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
          }
        } catch {
          setFailed(true);
        }
      }}
    >
      {copied
        ? 'Lien copié'
        : failed
          ? 'Copiez le lien depuis la barre d’adresse'
          : 'Partager cet article'}
      <ArrowRight size={18} />
    </button>
  );
}
