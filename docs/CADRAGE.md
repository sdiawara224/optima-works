# Cadrage de cette itération

## Statut

Prototype interactif et socle technique du site officiel. Le cahier des charges prévoit une validation des maquettes avant le développement complet : cette prévisualisation constitue le support de cette validation, et non une acceptation tacite de la direction artistique ou du périmètre final.

## Choix proposés

- **Next.js + TypeScript** : rendu serveur, métadonnées et route d’envoi dans la même application.
- **CSS et SVG natifs** : pas de vidéo automatique ni de moteur 3D ; animations d’entrée, états de focus et réduction des mouvements.
- **Sanity** : Studio séparé et modèles éditoriaux fournis. Lecture uniquement des contenus publiés. À approuver selon l’offre, les utilisateurs, les permissions, les quotas, l’export et la localisation des données.
- **Resend** : adaptateur serveur simple avec confirmation d’acceptation. À approuver après examen des quotas et conditions. Une autre solution transactionnelle peut remplacer cet adaptateur.

## Services et coûts à confirmer

Aucun montant n’est inventé, aucun abonnement n’est souscrit. Les offres gratuites ne sont pas supposées suffisantes à long terme.

| Poste                        | Situation / validation nécessaire                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Domaine                      | À choisir, vérifier, enregistrer au nom d’OptimaWorks ; renouvellement annuel à chiffrer                                 |
| Hébergement Next.js          | À choisir ; vérifier usage commercial, fonctions serveur, trafic, builds, logs et dépassements                           |
| Sanity                       | À créer ; plan, nombre de comptes/rôles, médias, requêtes, historique, sauvegarde et support à confirmer                 |
| Hébergement du Studio        | À choisir avec le CMS ; vérifier domaine et facturation                                                                  |
| Boîte e-mail professionnelle | Adresse, fournisseur, capacité, conservation et coût à fournir                                                           |
| Resend                       | Compte, domaine autorisé, plafonds journaliers/mensuels, logs, délivrabilité et coût à confirmer                         |
| Protection distribuée        | WAF ou solution approuvée à prévoir selon l’hébergement ; le limiteur local seul n’est pas une protection multi-instance |
| Analytics                    | Non activé ; éventuelle solution et consentement à chiffrer séparément                                                   |
| Médias et polices            | Trois visuels fournis par OptimaWorks, optimisés en WebP ; Manrope sous licence OFL jointe, hébergée localement          |
| Maintenance / support        | Fréquence, responsabilités, durée de garantie et prix à contractualiser                                                  |

Le chiffrage doit préciser devise, taxes, calendrier de paiement, coût ponctuel, total mensuel/annuel et projection sur 12/24 mois. Ce dépôt ne tient pas lieu de devis commercial.

## Inclus dans cette itération

Design responsive, accueil et ancres, quatre détails de services, approche, portfolio filtrable et détails si contenu fourni, journal avec liste/catégories/pagination/articles, contact avec validation et adaptateur d’e-mail, FAQ, pages juridiques de travail, SEO technique conditionnel, Studio et modèles, documentation et tests.

## Compléments avant recette finale

Connexion aux comptes réels ; contenu éditorial de lancement ; autorisations des images ; validation de la déclinaison web du logo officiel fourni ; validation des textes et FAQ ; choix et configuration des permissions CMS ; prévisualisation authentifiée des brouillons si retenue ; administration complète des pages/blocs, CTA et identité visuelle ; redirections éditoriales ; renforcement du limiteur selon hébergement ; tests de livraison et de restauration ; mesure Lighthouse de production ; vérifications manuelles d’accessibilité et appareils réels ; formation effective et validation écrite.

Les modèles portfolio contiennent un slug et un champ SEO réservés à l’évolution, mais le prototype affiche des modales et non des pages projet indexables. Les métadonnées individuelles des services ne s’appliquent pas tant que les services sont des modales.

## Hors périmètre

CRM, stockage de prospects, pipeline, newsletter, paiement, boutique, réservation, espace client, multilingue, recherche interne, 3D/WebGL et analytics. Aucun projet fictif ni avis fictif n’est publié.

## Éléments attendus d’OptimaWorks

1. Validation du prototype desktop/mobile et du texte d’accroche proposé.
2. Logo officiel reçu et intégré ; éventuelles consignes de marque complémentaires à fournir.
3. E-mail officiel reçu : `optimaworksgn@gmail.com` ; service d’envoi du formulaire à configurer et téléphone/WhatsApp public à confirmer.
4. Domaine, liens sociaux et personnes autorisées à administrer.
5. Textes finaux, FAQ, mentions légales et politique de confidentialité.
6. Réalisations et articles autorisés, avec visuels et alternatives.
7. Approbation des services tiers, offres et budgets avant activation.
