import Image from 'next/image';

const visuals = [
  {
    name: 'Explorer',
    src: '/images/optimaworks-explorer.webp',
    alt: 'Explorer : une main tient une sphère verte lumineuse. Recherche de nouvelles idées et expériences. Curieux, toujours à la découverte.',
    description: 'De nouvelles idées, de nouvelles perspectives.',
  },
  {
    name: 'Créateur',
    src: '/images/optimaworks-createur.webp',
    alt: 'Créateur : une main tient une ampoule verte allumée sur fond noir. Génère du contenu et des idées. Expressif et inventif.',
    description: 'Donner forme aux idées et au contenu.',
  },
  {
    name: 'Connecteur',
    src: '/images/optimaworks-connecteur.webp',
    alt: 'Connecteur : des maillons noirs et verts s’assemblent. Tisse des liens et étend son influence. Suscite l’engagement et amplifie.',
    description: 'Tisser des liens et susciter l’engagement.',
  },
];

export function BrandUniverse() {
  return (
    <section className="section brand-universe-section" aria-labelledby="univers-title">
      <div className="container">
        <div className="section-heading reveal">
          <div>
            <span className="eyebrow">
              <span className="mini-dot" /> NOTRE UNIVERS
            </span>
            <h2 id="univers-title">
              Explorer. Créer.
              <br />
              <span className="serif-word">Connecter.</span>
            </h2>
          </div>
          <p>
            La curiosité ouvre les possibles.
            <br />
            La créativité leur donne forme. Les liens les font grandir.
          </p>
        </div>
        <div className="brand-universe-grid">
          {visuals.map((visual, index) => (
            <figure className="brand-universe-card reveal" key={visual.src}>
              <div className="brand-universe-image">
                <Image
                  src={visual.src}
                  alt={visual.alt}
                  width={1200}
                  height={1499}
                  sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1150px) 29vw, 408px"
                />
              </div>
              <figcaption>
                <div>
                  <span className="index">0{index + 1}</span>
                  <h3>{visual.name}</h3>
                </div>
                <p>{visual.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
