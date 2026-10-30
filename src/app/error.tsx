'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="contenu" className="not-found">
      <span>UNE PAUSE IMPRÉVUE</span>
      <h1>Reprenons le fil.</h1>
      <p>La page n’a pas pu être chargée. Vos idées, elles, n’ont pas disparu.</p>
      <button className="button" onClick={reset}>
        Réessayer
      </button>
    </main>
  );
}
