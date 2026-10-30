import type { Metadata } from 'next';
import { getContent } from '@/lib/content';
export const metadata: Metadata = {
  title: 'Mentions légales',
  robots: { index: false, follow: false },
};
export default async function Legal() {
  const { settings } = await getContent();
  return (
    <main id="contenu" className="legal-page">
      <span className="eyebrow">INFORMATIONS DU SITE</span>
      <h1>Mentions légales</h1>
      {settings.legalText ? (
        <div className="preserve-lines rich-text">{settings.legalText}</div>
      ) : (
        <>
          <div className="legal-notice">
            <strong>Document en attente de validation</strong>
            <p>
              Ce site est une prévisualisation. Les mentions légales définitives seront publiées
              après validation par OptimaWorks. Ce texte ne constitue pas un document juridique
              final.
            </p>
          </div>
          <h2>Éditeur du site</h2>
          <p>OptimaWorks — Taouyah, Conakry, République de Guinée.</p>
          <p>
            La raison sociale complète, le statut juridique, les références d’immatriculation, le
            responsable de publication et l’adresse de contact restent à fournir.
          </p>
          <h2>Hébergement et propriété intellectuelle</h2>
          <p>
            L’identité et les coordonnées de l’hébergeur seront indiquées après le choix de
            l’hébergement. Les conditions d’utilisation des textes, du logo et des visuels restent à
            confirmer par OptimaWorks avant publication.
          </p>
        </>
      )}
    </main>
  );
}
