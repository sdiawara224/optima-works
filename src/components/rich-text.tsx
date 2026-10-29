import type { ReactNode } from 'react';
import type { RichBlock } from '@/lib/content';

export function RichText({ blocks }: { blocks: RichBlock[] }) {
  return (
    <div className="rich-text">
      {blocks
        .filter((b) => b._type === 'block')
        .map((block, index) => {
          const children = block.children?.map((span, i) => {
            let content: ReactNode = span.text;
            for (const mark of span.marks ?? []) {
              if (mark === 'strong') content = <strong>{content}</strong>;
              else if (mark === 'em') content = <em>{content}</em>;
              else {
                const link = block.markDefs?.find((d) => d._key === mark);
                if (link?.href && /^(https:\/\/|mailto:|tel:)/.test(link.href))
                  content = <a href={link.href}>{content}</a>;
              }
            }
            return <span key={i}>{content}</span>;
          });
          const key = block._key || String(index);
          if (block.style === 'h2') return <h2 key={key}>{children}</h2>;
          if (block.style === 'h3') return <h3 key={key}>{children}</h3>;
          if (block.style === 'blockquote') return <blockquote key={key}>{children}</blockquote>;
          return <p key={key}>{children}</p>;
        })}
    </div>
  );
}
