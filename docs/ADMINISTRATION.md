# Guide d’administration

## Mettre en service le CMS

Sanity est proposé pour son Studio séparé, ses validations éditoriales et son API de contenu. Son utilisation reste soumise à l’approbation d’OptimaWorks, notamment pour les conditions de traitement des données et les éventuels coûts. Aucun compte n’a été créé pendant cette réalisation.

1. Avec un compte contrôlé par OptimaWorks, créer un projet Sanity et un jeu de données `production` **public en lecture**. Ne jamais y conserver de secrets ou de données de prospects. Un dataset public n’est pas un coffre de données confidentielles ; les contrôles éditoriaux ne remplacent pas les permissions du CMS.
2. Dans `cms/`, copier `.env.example` vers `.env.local`. Renseigner l’identifiant du vrai projet et le dataset. Les identifiants publics du projet ne sont pas des clés d’administration.
3. Exécuter `npm ci`, puis `npm run dev`. Le Studio constitue une application séparée. Ajouter son domaine aux origines autorisées du projet Sanity si nécessaire.
4. Dans les variables serveur du site public, définir `SANITY_PROJECT_ID` et `SANITY_DATASET`.
5. Déployer le Studio sur un hébergement approuvé (`npm run build` ou `npm run deploy` après authentification). Aucune de ces opérations n’a été faite sur un compte client.
6. Inviter seulement les personnes autorisées. Vérifier les rôles et le nombre de sièges dans l’offre retenue. Le code ne crée ni comptes, ni rôles payants. Activer une authentification renforcée si disponible.

## Rédiger / publier

Deux mécanismes protègent l’affichage public : le brouillon natif de Sanity et le champ **Visibilité sur le site**. Un document doit avoir `Publié sur le site` **et** être publié dans Sanity. Les modifications en brouillon restent exclues de la lecture publique.

- **Services** : nom, slug, description courte, description détaillée, prestations, icône, ordre. Les quatre choix du formulaire correspondent aux quatre domaines du cahier des charges ; renommer un domaine implique de vérifier aussi cette liste.
- **Réalisations** : titre, slug, catégorie, résumé, description, image et alternative. Confirmer les droits de publication. Le filtre et le détail s’activent dès que des projets sont publiés. La version actuelle utilise une fenêtre de détail, pas des routes projet individuelles.
- **Articles** : titre, slug, résumé, contenu enrichi (paragraphes, H2/H3, gras, italique, citations, liens sûrs), catégorie, couverture, alternative, date et SEO. Une date future est masquée par la requête jusqu’à échéance, sous réserve de la disponibilité du service et du délai de cache. Ce n’est pas un service d’envoi ni une garantie de publication à la seconde.
- **FAQ** : question, réponse approuvée et ordre.
- **Paramètres** : un seul document. Titre / texte d’accueil, présentation, SEO de l’accueil, adresse, coordonnées confirmées, réseaux officiels et textes juridiques.

L’e-mail officiel `optimaworksgn@gmail.com` est confirmé et sert de valeur de secours publique. Les autres coordonnées restent vides tant qu’elles ne sont pas confirmées. L’e-mail affiché dans le CMS n’est pas le destinataire technique du formulaire : celui-ci est défini dans `CONTACT_TO` pour éviter les modifications accidentelles de routage.

## Dépublier / supprimer

Passer le statut à « Brouillon — privé » puis publier ce changement, ou utiliser la dépublication native de Sanity. Le contenu disparaît du site après renouvellement du cache (environ 60 secondes, selon les règles de cache de l’hébergeur). Vérifier avec une fenêtre privée.

Avant suppression ou changement de slug, relever les anciennes URL. Ajouter une redirection permanente dans `next.config.ts` (`redirects`) et déployer. Les routes d’articles absents renvoient une vraie 404. Les redirections ne sont pas encore administrables dans le CMS.

## Prévisualisation et droits

Les titres, images et états sont prévisualisés dans les listes du Studio. Pour vérifier le rendu du site, utiliser un dataset de préproduction et une instance non indexable du frontend. **Le rendu public de brouillons par URL sécurisée n’est pas encore implémenté** : ne pas publier un brouillon sur le dataset de production pour le prévisualiser.

Les droits de contributeur sans publication, les workflows et le nombre d’utilisateurs dépendent de l’offre Sanity choisie. Ils doivent être configurés et testés avec de vrais comptes avant recette R05. Ne pas promettre ces droits sans vérifier leur disponibilité dans l’offre.

## Limites de cette première version

Les sections d’approche, les libellés de navigation, certains CTA, les valeurs et la mise en page sont encore gérés dans le code. Le CMS ne comprend pas encore un constructeur de pages/blocs ni le remplacement du logo. Le blog emploie une catégorie par article, sans recherche interne. La galerie secondaire et l’auteur facultatif ne sont pas inclus dans ce prototype. Le périmètre final de ces champs est à valider avant développement complémentaire.
