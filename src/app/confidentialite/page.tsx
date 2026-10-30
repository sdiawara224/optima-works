import type { Metadata } from 'next';
import { getContent } from '@/lib/content';
export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  robots: { index: false, follow: false },
};
export default async function Privacy() {
  const { settings } = await getContent();
  return (
    <main id="contenu" className="legal-page">
      <span className="eyebrow">VOS DONNÉES</span>
      <h1>Politique de confidentialité</h1>
      {settings.privacyText ? (
        <div className="preserve-lines rich-text">{settings.privacyText}</div>
      ) : (
        <>
          <div className="legal-notice">
            <strong>Version de travail — à valider avant mise en ligne</strong>
            <p>
              L’identité du responsable de traitement, l’adresse d’exercice des droits, les durées
              de conservation et les conditions des sous-traitants doivent être complétées et
              approuvées par OptimaWorks.
            </p>
          </div>
          <h2>Informations du formulaire</h2>
          <p>
            Le formulaire recueille votre nom, votre adresse e-mail, le service concerné, l’objet et
            la description du besoin. L’entreprise et le téléphone sont facultatifs. Ces
            informations servent uniquement à traiter et à répondre à votre demande.
          </p>
          <h2>Transmission des demandes</h2>
          <p>
            Une fois la messagerie configurée, les données sont transmises à l’équipe autorisée
            d’OptimaWorks via un fournisseur d’e-mail transactionnel. Aucune base de prospects ni
            aucun CRM n’est utilisé par le site. L’envoi n’est pas actif dans la prévisualisation
            tant que le service n’est pas configuré.
          </p>
          <h2>Protection contre les abus</h2>
          <p>
            Une empreinte technique de l’adresse IP, ou un compteur partagé selon l’hébergement, est
            conservé temporairement en mémoire (10 minutes) pour limiter les soumissions abusives.
            Le site n’enregistre pas le contenu des formulaires dans ses journaux applicatifs. Les
            journaux de l’hébergeur et du fournisseur d’e-mail devront être précisés au déploiement.
          </p>
          <h2>Conservation et droits</h2>
          <p>
            Les destinataires, la durée de conservation des e-mails, la localisation des données,
            les éventuels transferts et les modalités d’exercice de vos droits seront documentés
            après validation des services et coordonnées officiels.
          </p>
          <h2>Cookies et mesure d’audience</h2>
          <p>
            Aucun outil publicitaire, traceur d’analyse ou cookie non essentiel n’est activé dans
            cette version. Les polices sont hébergées localement. L’ajout d’un outil de mesure fera
            l’objet d’une configuration distincte, avec consentement si nécessaire.
          </p>
        </>
      )}
    </main>
  );
}
