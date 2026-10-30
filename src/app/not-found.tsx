import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export default function NotFound() {
  return (
    <main id="contenu" className="not-found">
      <span>ERREUR 404</span>
      <h1>Une idée perdue en chemin ?</h1>
      <p>Cette page n’existe pas ou n’est plus publiée. Repartons du bon pied.</p>
      <div>
        <Link href="/" className="button">
          Retour à l’accueil
          <ArrowUpRight size={18} />
        </Link>
        <Link href="/#services" className="text-link">
          Nos services
        </Link>
      </div>
    </main>
  );
}
