import Link from 'next/link';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import type { Article } from '@/lib/content';

export function ArticleCards({ articles }: { articles: Article[] }) {
  if (!articles.length)
    return (
      <div className="journal-empty">
        <div className="journal-icon">
          <BookOpen size={28} strokeWidth={1.3} />
        </div>
        <div>
          <h3>Les idées se partagent aussi.</h3>
          <p>
            Nos premiers articles sont en préparation : stratégie, créativité et conseils pour vos
            projets.
          </p>
        </div>
        <span className="coming-tag">
          <span className="mini-dot" /> Bientôt dans le journal
        </span>
      </div>
    );
  return (
    <div className="articles-grid">
      {articles.map((article) => (
        <Link className="article-card" key={article._id} href={`/blog/${article.slug}`}>
          <div className="article-image">
            {article.cover ? (
              <img src={article.cover} alt={article.alt ?? ''} loading="lazy" />
            ) : (
              <BookOpen size={44} />
            )}
            <span className="article-arrow">
              <ArrowUpRight />
            </span>
          </div>
          <div className="article-meta">
            <span>{article.category || 'Le journal'}</span>
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>
          <h3>{article.title}</h3>
          <p>{article.excerpt}</p>
        </Link>
      ))}
    </div>
  );
}
