# Recette de prévisualisation — 29 octobre 2026

## Résultats exécutés

- Build Next.js de production : **réussi** (Next.js 16.4.3, Node.js 22.22.3).
- Build Sanity Studio : **réussi** avec un identifiant local de vérification, sans connexion à un compte client ni déploiement.
- TypeScript du frontend et du Studio : **réussi**.
- Tests unitaires et route API : **27/27 réussis**.
- Tests navigateur Playwright sur build de production : **12/12 réussis**.
- Contrôle axe-core automatisé de l’accueil (WCAG 2 A/AA, 2.1 AA, 2.2 AA) : **aucune violation détectée** dans les conditions testées. Cela ne certifie pas la conformité intégrale.
- `npm audit` du site et du Studio : **aucune vulnérabilité connue signalée** au moment du contrôle. Les overrides du Studio sont documentés dans le guide d’exploitation.

Les tests navigateur couvrent : navigation vers le journal et vraie 404, détail des services et restitution du focus, FAQ au clavier, validation du formulaire et absence de faux succès sans fournisseur, menu mobile/focus/Échap, absence de débordement à 360/390/768/1440 px, réduction des mouvements et contrôle automatisé d’accessibilité.

Les tests API simulent le fournisseur pour vérifier succès confirmé, erreur et réponse sans identifiant. **Aucun e-mail réel n’a été envoyé.**

## Mesures Lighthouse initiales (avant ajout des images fournies)

Ces scores concernent la version initiale à illustration vectorielle ; ils ne constituent pas une mesure de la version enrichie avec les trois images fournies. Une nouvelle mesure est à effectuer après finalisation des médias.

Accueil sans CMS configuré, build de production servi localement sur le port 3001. Lighthouse **13.6.0**, Chromium headless **153.0.8010.0**, une mesure par profil. Polices et illustration locales, pas de scripts de suivi, pas de contenu média client. Ces résultats de laboratoire ne sont ni une mesure terrain des Core Web Vitals ni une garantie pour le domaine public.

| Mesure                    | Desktop | Mobile simulé |
| ------------------------- | ------: | ------------: |
| Performance               |     100 |            99 |
| Accessibilité automatisée |     100 |           100 |
| Bonnes pratiques          |     100 |           100 |
| SEO                       |      63 |            63 |
| First Contentful Paint    |   0,3 s |         0,9 s |
| Largest Contentful Paint  |   0,3 s |         0,9 s |
| Cumulative Layout Shift   |   0,009 |         0,010 |
| Total Blocking Time       |    0 ms |        120 ms |

**Le score SEO réduit est intentionnel : l’indexation est bloquée par `noindex, nofollow` et robots.txt en préproduction.** Aucun autre échec SEO n’a été relevé dans cette mesure. Ne pas désactiver ce blocage uniquement pour améliorer un score avant validation.

Conditions : desktop 1350 × 940, DPR 1, RTT simulé 40 ms, débit 10 240 Kbit/s, CPU ×1. Mobile : profil Lighthouse standard 412 × 823, DPR 1,75, RTT 150 ms, débit 1 638,4 Kbit/s et CPU ×4, simulation Lantern. Serveur et navigateur sont dans le même environnement ; refaire plusieurs mesures sur le vrai domaine après intégration des médias et services.

Pour reproduire avec un navigateur Chromium disponible : lancer `npm run build` puis `npm start -- --port 3001`, utiliser Lighthouse sur `http://localhost:3001` en profil desktop puis mobile. Les rapports bruts temporaires ne sont pas versionnés.

## Matrice des critères du cahier des charges

| ID  | État de cette itération                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------- |
| R01 | Palette et direction proposées ; logo officiel fourni et intégré ; validation graphique globale en attente                        |
| R02 | Quatre domaines intégrés ; validation des textes en attente                                                                       |
| R03 | Largeurs 360, 390, 768, 1440 testées sans débordement ; appareils et navigateurs réels à compléter                                |
| R04 | Ancres, liens internes, services, blog et 404 testés ; coordonnées externes volontairement absentes tant que non validées         |
| R05 | Modèles et Studio compilés ; création/modification/dépublication par utilisateurs réels non testées                               |
| R06 | Gabarits, catégories, pagination et requêtes publiées implémentés ; recette avec vrais articles et permissions CMS à effectuer    |
| R07 | Adaptateur et confirmation testés par simulation ; réception e-mail réelle non testée                                             |
| R08 | Validation client/serveur et erreurs testées                                                                                      |
| R09 | Erreurs de fournisseur et configuration absente testées ; alternatives affichées uniquement si coordonnées confirmées disponibles |
| R10 | Honeypot, limite de taille et débit local testés ; protection multi-instance à configurer au déploiement                          |
| R11 | Liens générés depuis paramètres validés ; numéro du brief non publié ; test sur téléphone à effectuer après confirmation          |
| R12 | Réduction des mouvements et contenu visible testés ; contrôles sur appareils modestes à compléter                                 |
| R13 | Clavier/focus sur menu, modales, FAQ, formulaire et axe testés ; revue manuelle lecteur d’écran à compléter                       |
| R14 | Métadonnées, Open Graph local, 404, sitemap et robots implémentés ; domaine canonique et indexation de production non configurés  |
| R15 | Pas de secret commité, en-têtes et contrôle d’origine fournis ; HTTPS, comptes et permissions réels à configurer                  |
| R16 | Mesures locales ci-dessus ; nouvelle mesure sur hébergement final requise                                                         |
| R17 | Pages juridiques de travail signalées ; validation obligatoire avant lancement                                                    |
| R18 | Code et instructions présents dans la branche de travail ; transfert des comptes et acceptation formelle non effectués            |
| R19 | Procédure documentée ; sauvegarde et restauration réelles non exécutées                                                           |
| R20 | Documentation fournie ; session de formation et passation effective à organiser                                                   |

## Limites et décisions ouvertes

- Logo officiel reçu et intégré ; textes proposés, pas encore approuvés. Aucun témoignage, statistique, certification, client ou projet fictif.
- Administration partielle des sections : pas encore de constructeur de pages, logo administrable ou prévisualisation sécurisée de brouillons sur le frontend.
- Le Studio n’est ni provisionné ni ouvert à des comptes OptimaWorks.
- Pas de véritable envoi e-mail, de domaine ou de configuration DNS dans cette itération.
- Le limiteur en mémoire est une protection locale, pas un mécanisme distribué de production.
- Safari, Firefox, lecteurs d’écran, orientations et vrais téléphones restent à contrôler.
- Les textes juridiques, les quotas/coûts et la localisation des données restent à valider.
- La disponibilité du CMS, les contenus riches réels, l’export/restauration et le fonctionnement à charge ne sont pas encore validés.

**Décision de lancement : non prise. La validation écrite d’OptimaWorks reste nécessaire.**

## Intégration des visuels fournis

Les trois fichiers transmis le 29 octobre sont intégrés comme visuels de marque, pas comme projets clients :

- `image-1.png` → `public/images/optimaworks-creativite.webp`, dans le hero.
- `image-2.png` → `public/images/optimaworks-vision.webp`, dans « À propos ».
- `image-3.png` → `public/images/optimaworks-public.webp`, dans « Pourquoi OptimaWorks ».

Les images originales de 4219 × 5269 pixels ont été réduites à 1200 × 1499 pixels en WebP (environ 529 Ko au total contre 37 Mo pour les originaux). Leur composition est conservée sans recadrage. Next Image sert les tailles adaptées, précharge le hero et diffère les autres images. Des textes alternatifs sont fournis. Le test navigateur supplémentaire vérifie le chargement des trois images ; les neuf tests navigateur passent sur le build actualisé.

### Série complémentaire « Explorer. Créer. Connecter. »

Trois nouveaux fichiers fournis ont été ajoutés sans remplacer les visuels existants, dans une section de marque dédiée entre « À propos » et « Notre approche ». Ils ne sont pas présentés comme réalisations clients. Les fichiers WebP `optimaworks-explorer.webp`, `optimaworks-createur.webp` et `optimaworks-connecteur.webp` pèsent environ 371 Ko au total, en 1200 × 1499 pixels. Images affichées intégralement, chargement différé, tailles responsives et alternatives textuelles. La série passe de trois colonnes sur ordinateur à une colonne sur mobile. Les dix tests navigateur passent, dont le chargement des six visuels, la conservation des proportions, l’absence de débordement et le contrôle axe. Build et TypeScript réussis. Les scores Lighthouse initiaux ci-dessus ne sont pas des mesures de cette version enrichie.

### Logo officiel

Le logo officiel transmis remplace le mot-symbole et l’astérisque provisoires dans l’en-tête et le pied de page. Le fichier optimisé `public/brand/optimaworks-logo.png` est une découpe des grandes marges vertes du fichier fourni, sans modification des couleurs, du fond ni des proportions de la marque. Le symbole fourni est décliné en favicon PNG et icône Apple ; le logo complet figure aussi dans l’image Open Graph. La version transparente/vectorielle pourra être ajoutée si elle est fournie ultérieurement ; aucun détourage ni logo de substitution n’a été inventé. Les onze tests navigateur passent, incluant le chargement et les proportions des deux logos, les liens d’accueil, les icônes, l’image de partage, les largeurs mobiles et axe. Build de production et contrôle TypeScript réussis.

### E-mail officiel confirmé

`optimaworksgn@gmail.com` est affiché avec un lien `mailto:` dans Contact et le pied de page. L’adresse est centralisée et reste remplaçable depuis les paramètres publiés du CMS. En cas d’échec du formulaire, un lien d’e-mail direct est proposé si aucun téléphone/WhatsApp validé n’est disponible. `.env.example` contient cette adresse dans `CONTACT_TO`. Aucun secret n’est fourni et le service d’envoi n’est pas activé par cet ajout. Les douze tests navigateur et les dix-huit tests unitaires/API passent ; build et TypeScript réussis.

### Remplacement par le logo sur fond blanc

La nouvelle image officielle remplace la version sur fond vert dans l’en-tête, le pied de page et Open Graph. Fichier : `public/brand/optimaworks-logo-clair.png` (1044 × 312 pixels), issu du fichier fourni après retrait des grandes marges blanches, sans recoloration ni déformation. Un nouveau nom de fichier évite de réutiliser en cache l’ancienne version. Les icônes PNG et Apple sont également actualisées à partir du symbole de cette image.

### Envoi Gmail préparé

Adaptateur SMTP Gmail ajouté côté serveur avec TLS et authentification par mot de passe d’application. Destinataire par défaut : `optimaworksgn@gmail.com`. Tous les champs sont transmis en texte brut avec `Reply-To` du visiteur. Succès uniquement après acceptation SMTP du destinataire, erreurs de connexion/authentification/refus sans faux succès ni détail confidentiel au navigateur. Configuration partagée pour l’état de l’interface et la route API ; Resend conservé en alternative. Vingt-sept tests unitaires/API passent, dont neuf nouveaux cas de configuration et SMTP simulé. TypeScript et build réussis. **Aucun mot de passe Google n’a été fourni et aucun envoi réel n’a été effectué** ; l’activation et la recette réelle nécessitent les variables privées décrites dans `docs/EMAIL-GMAIL.md` sur un serveur autorisant SMTP.
