# OptimaWorks

Première version interactive du site vitrine, en français, d’après le cahier des charges du 28 octobre 2026. **Préproduction à valider, pas un site officiellement livré ni une mise en production.** Aucune souscription ni ressource distante n’a été créée.

## Lancer le site

Node.js **22.12+** recommandé.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Ouvrir le port 3000. Le serveur écoute sur `0.0.0.0` et accepte les domaines de prévisualisation Arena. Toutes les requêtes du navigateur sont relatives au site. Les polices sont locales.

```bash
npm run check:secrets
npm run typecheck
npm test
npm run build
npm start
# Après installation du navigateur et de ses dépendances système :
npx playwright install chromium
npm run test:e2e
npm run format
```

## Ce qui fonctionne sans compte externe

- Accueil responsive, direction graphique vert `#9DDE4D`, blanc `#FCFCFC` et noir ; visuels de marque fournis et optimisés en WebP.
- Quatre services et fenêtres de détail accessibles ; liens vers le formulaire présélectionné.
- Sections à propos, approche, réalisations, journal, FAQ et contact ; menu mobile, accordéons natifs, gestion du focus.
- Routes blog, article, catégories et pagination prêtes à recevoir les publications du CMS.
- États vides sans faux projets, articles, chiffres, références ou témoignages.
- Validation partagée client/serveur, route de contact, honeypot et limitation des tentatives.
- 404, métadonnées, Open Graph généré localement, sitemap et robots conditionnels.
- Respect de `prefers-reduced-motion`. Aucun outil de suivi publicitaire ni analytics.

## Ce qui demande une configuration / validation

- **CMS** : Studio séparé dans `cms/`, modèles et requêtes fournis. Aucun projet Sanity ni compte éditeur n’est connecté. Les contenus affichés sans configuration sont des propositions issues du brief, et non des contenus approuvés.
- **E-mails** : envoi Gmail SMTP via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` (mot de passe d’application privé) et `CONTACT_EMAIL=optimaworksgn@gmail.com` ; anciens alias `GMAIL_*` conservés. E-mails HTML/texte, Reply-To visiteur, Turnstile configurable et accusé indépendant après validation du challenge. Voir le [guide Gmail](docs/EMAIL-GMAIL.md). Resend reste une alternative configurable. Sans identifiants, la route renvoie explicitement 503 : **aucun faux succès**. La livraison réelle reste à tester.
- **Coordonnées** : l’e-mail officiel confirmé `optimaworksgn@gmail.com` est affiché dans Contact et le pied de page, avec un lien direct. Il est centralisé dans `src/lib/site-config.ts` et peut être remplacé par un e-mail publié dans le CMS. Le numéro, WhatsApp et les réseaux restent masqués sans confirmation. `.env.example` propose cette adresse pour `CONTACT_EMAIL`, sans activer le service d’envoi.
- **Identité** : le logo officiel fourni est intégré dans l’en-tête, le pied de page et l’image de partage ; les icônes du site utilisent son symbole. Les couleurs et proportions sont conservées, avec retrait des grandes marges. La dernière version fournie, sur fond blanc cassé, remplace la version sur fond vert.
- **Juridique** : pages de travail clairement signalées, à remplacer par les textes validés. Aucune promesse de conformité juridique automatique.
- **SEO** : `SITE_INDEXABLE=false` par défaut. Définir le domaine canonique `SITE_URL`, valider les textes et activer l’indexation uniquement sur la production approuvée.

## Architecture

| Couche              | Implémentation                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Site public         | Next.js App Router, React, TypeScript                                                           |
| Styles / animations | CSS structuré, SVG, IntersectionObserver ; pas de moteur 3D                                     |
| Gestion éditoriale  | Sanity Studio séparé, API publique en lecture seule, perspective `published`                    |
| Contact             | `POST /api/contact` → SMTP Gmail ou API Resend, HTML/texte, Reply-To visiteur, accusé optionnel |
| Données prospects   | Aucun CRM, aucune base de leads, logs de statut sans contenu ni coordonnées                     |
| Tests               | Node/tsx, Playwright et axe-core                                                                |

`src/lib/content.ts` centralise l’accès CMS et le contenu de secours. Les brouillons Sanity, les documents dont le statut n’est pas publié et les articles datés dans le futur sont exclus des requêtes publiques. Cache : 60 secondes lorsqu’un CMS est configuré. Aucun jeton d’administration n’est nécessaire dans le site public.

## Documentation

- [Activation des e-mails Gmail](docs/EMAIL-GMAIL.md)
- [Recette de l’intégration contact Gmail](docs/RECETTE-CONTACT-GMAIL.md)
- [Administration et publication](docs/ADMINISTRATION.md)
- [Déploiement, sécurité, sauvegarde et reprise](docs/EXPLOITATION.md)
- [Périmètre, services tiers et coûts à confirmer](docs/CADRAGE.md)
- [Recette et limites connues](docs/RECETTE.md)

**Avant diffusion publique : faire valider la maquette, la déclinaison du logo, les textes, la FAQ, les coordonnées, les mentions et le choix des services par OptimaWorks.**

## Protection des secrets

Les champs secrets des fichiers `.env.example` doivent rester vides. Le contrôle `npm run check:secrets` est exécuté avant le build et dans GitHub Actions. Il ne révoque pas un mot de passe déjà exposé et ne nettoie pas l’historique. Voir le [guide de sécurité et de révocation](docs/SECURITE.md).
