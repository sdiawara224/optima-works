import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getContent } from '@/lib/content';
import { ShareButton } from '@/components/interactive';
import { RichText } from '@/components/rich-text';
import { FinalCta } from '@/components/footer';

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { articles } = await getContent();
  const article = articles.find((a) => a.slug === slug);
  if (!article) return { title: 'Article introuvable' };
  return {
    title: article.seo?.title || article.title,
    description: article.seo?.description || article.excerpt,
    alternates: process.env.SITE_URL ? { canonical: `/blog/${slug}` } : undefined,
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      ...(article.cover ? { images: [{ url: article.cover, alt: article.alt ?? '' }] } : {}),
    },
  };
}
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const { articles } = await getContent();
  const index = articles.findIndex((a) => a.slug === slug);
  const article = articles[index];
  if (!article) notFound();
  const next = articles[index + 1] || (index > 0 ? articles[0] : undefined);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    ...(article.cover ? { image: article.cover } : {}),
    publisher: { '@type': 'Organization', name: 'OptimaWorks' },
  };
  return (
    <main id="contenu">
      <article className="article-page">
        <div className="breadcrumbs">
          <Link href="/">Accueil</Link>
          <ArrowRight size={11} />
          <Link href="/blog">Le journal</Link>
          <ArrowRight size={11} />
          <span>Article</span>
        </div>
        <span className="eyebrow">
          <span className="mini-dot" />
          {article.category || 'LE JOURNAL'}
        </span>
        <h1>{article.title}</h1>
        <div className="article-meta">
          <time dateTime={article.publishedAt}>
            {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
          <span>OptimaWorks</span>
        </div>
        <p className="article-intro">{article.excerpt}</p>
        {article.cover && (
          <img className="article-cover" src={article.cover} alt={article.alt ?? ''} />
        )}
        <RichText blocks={article.body ?? []} />
        <ShareButton title={article.title} />
        <nav className="article-navigation" aria-label="Navigation entre articles">
          <Link href="/blog" className="text-link">
            <ArrowLeft size={16} />
            Tous les articles
          </Link>
          {next && (
            <Link href={`/blog/${next.slug}`} className="text-link">
              Lire aussi : {next.title}
              <ArrowRight size={16} />
            </Link>
          )}
        </nav>
      </article>
      <FinalCta />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
    </main>
  );
}
