import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getContent } from '@/lib/content';
import { ArticleCards } from '@/components/articles';
import { FinalCta } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Le journal',
  description:
    'Stratégie, design, organisation et créativité : les idées et conseils d’OptimaWorks pour nourrir vos projets.',
  alternates: process.env.SITE_URL ? { canonical: '/blog' } : undefined,
};
const PAGE_SIZE = 9;
export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; page?: string }>;
}) {
  const { articles } = await getContent();
  const { categorie, page } = await searchParams;
  const categories = [...new Set(articles.map((a) => a.category).filter(Boolean))];
  const category = categories.includes(categorie ?? '') ? categorie : undefined;
  const filtered = category ? articles.filter((a) => a.category === category) : articles;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(pages, Math.max(1, Number.parseInt(page ?? '1') || 1));
  return (
    <main id="contenu">
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Accueil</Link>
            <ArrowRight size={11} />
            <span>Le journal</span>
          </div>
          <span className="eyebrow">
            <span className="mini-dot" /> LES IDÉES SE PARTAGENT
          </span>
          <h1>
            Un peu de recul.
            <br />
            <span className="serif-word">Beaucoup d’idées.</span>
          </h1>
          <p>
            Des réflexions, des conseils et de l’inspiration pour voir plus loin et faire avancer
            vos projets.
          </p>
        </div>
      </section>
      <section className="blog-content">
        <div className="container">
          {categories.length > 0 && (
            <nav className="blog-categories" aria-label="Catégories du blog">
              <Link
                href="/blog"
                className={!category ? 'active' : ''}
                aria-current={!category ? 'page' : undefined}
              >
                Tous les articles
              </Link>
              {categories.map((c) => (
                <Link
                  className={category === c ? 'active' : ''}
                  href={`/blog?categorie=${encodeURIComponent(c)}`}
                  key={c}
                  aria-current={category === c ? 'page' : undefined}
                >
                  {c}
                </Link>
              ))}
            </nav>
          )}
          <div className={!articles.length ? 'blog-empty-large' : undefined}>
            <ArticleCards
              articles={filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)}
            />
          </div>
          {pages > 1 && (
            <nav className="pagination" aria-label="Pagination des articles">
              {Array.from({ length: pages }, (_, i) => (
                <Link
                  key={i}
                  href={`/blog?page=${i + 1}${category ? `&categorie=${encodeURIComponent(category)}` : ''}`}
                  aria-current={current === i + 1 ? 'page' : undefined}
                  aria-label={`Page ${i + 1}`}
                >
                  {i + 1}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>
      <FinalCta />
    </main>
  );
}
