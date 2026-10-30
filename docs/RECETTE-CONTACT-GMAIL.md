# Rapport de recette — contact Gmail SMTP

Date : **30 octobre 2026**. Branche de travail : `arena/6086771e-optima-works`.

## Conclusion

**Implémentation et tests automatisés réalisés. Mise en production non clôturée.** Il manque le nouveau mot de passe d’application Google, les clés Turnstile pour activer l’accusé et une recette réelle sur un hébergement commercial validé. Aucun message n’a été envoyé à Gmail par ces tests. Ni réception Gmail, ni accusé réel, ni réponse depuis Gmail ne sont attestés.

## Analyse préalable

- Next.js installé : **16.4.3** ; React 19 ; TypeScript ; **App Router** (`src/app`).
- Formulaire existant : `src/components/contact-form.tsx` ; champs nom, entreprise, e-mail, téléphone, service, objet, message, consentement, honeypot.
- API existante : `src/app/api/contact/route.ts`, runtime Node.js.
- Nodemailer, types et transport Gmail existaient ; Resend conservé pour compatibilité.
- Hébergement existant : projet Vercel `optima-works`, sortie `.next`, Node 26.x. Recette locale sous **Node 22.22.3**.
- Au contrôle initial, aucune variable dans le projet Vercel. Les sept variables non secrètes ont été créées pour Production et Preview ; aucun mot de passe ou clé de challenge ajouté.
- Aucun doublon de formulaire/API, nouvelle dépendance, modification de CSS, reconstruction du site ou changement des autres pages.

## Commandes exécutées et résultats

| Contrôle                                  | Résultat                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm test`                                | **52/52 réussis** (validation, configuration, API, SMTP simulé, challenge simulé, contrôle de secrets)   |
| `npm run typecheck`                       | Réussi                                                                                                   |
| `npm run build`                           | Réussi, routes App Router et API Node.js générées                                                        |
| `npm run check:secrets`                   | Réussi sur les fichiers examinés ; pas une analyse exhaustive de l’historique                            |
| `npm audit --omit=dev`                    | 0 vulnérabilité signalée pour les dépendances de production au moment du test                            |
| `npm run test:e2e` sur `next start` local | **16/16 réussis**, Chromium 153 ; configurations de formulaire et API simulées pour le succès/panne SMTP |
| `git check-ignore .env.local`             | Fichier ignoré ; créé avec secrets vides, permissions 600, non versionné                                 |
| `git diff --check`                        | Réussi                                                                                                   |

Les tests E2E utilisent Playwright, axe-core et le navigateur déjà fourni par `@sparticuz/chromium`. Dans Arena, lancement avec `CHROMIUM_EXECUTABLE_PATH=/tmp/chromium` et `LD_LIBRARY_PATH=/tmp/ow-chromium/lib`, après extraction des bibliothèques du paquet Chromium. Ces fichiers temporaires ne sont pas ajoutés au dépôt.

## Critères de recette

| Cas                                          | Résultat automatisé                                                                                              | Vérification réelle restante                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Demande valide                               | SMTP simulé accepte le destinataire avec 250 ; API 200                                                           | Réception dans Gmail en local autorisé et production                            |
| E-mail invalide / champs vides               | Refus côté validation, API 400                                                                                   | Contrôle manuel production                                                      |
| Message trop court / trop long               | Refus                                                                                                            | Contrôle manuel production                                                      |
| Honeypot rempli                              | Aucune transmission ; refus sans faux succès                                                                     | Contrôle manuel recette                                                         |
| Soumissions répétitives                      | 429 après 5 tentatives ; IP distincte non bloquée dans la même instance                                          | Comportement multi-instance à durcir si quota global requis                     |
| HTML / injection d’en-têtes                  | HTML échappé ; CRLF refusé dans e-mail et objet ; expéditeur/objet d’en-tête fixes                               | Rendu dans les clients Gmail/mobile à contrôler                                 |
| SMTP indisponible / authentification refusée | API 502 sans détail technique ; transport fermé                                                                  | Panne à simuler sur environnement de recette uniquement                         |
| Timeout SMTP                                 | Deadline 20 secondes simulée par horloge contrôlée, fermeture et échec                                           | Connectivité smtp.gmail.com:465 à confirmer chez l’hébergeur                    |
| From et Reply-To                             | Compte authentifié fixe ; prospect en Reply-To vérifié par assertions                                            | Cliquer Répondre dans Gmail et recevoir la réponse sur le compte externe        |
| Accusé                                       | Après principal accepté seulement ; échec indépendant, pas de renvoi du principal                                | Réception sur un compte externe contrôlé                                        |
| Turnstile                                    | Succès strict, action et hostname validés ; pannes, jeton manquant et configuration partielle refusés            | Widget et clés réelles, domaines autorisés et expiration à tester en production |
| Succès frontend                              | Texte demandé, champs réinitialisés ; échec de l’accusé reste un succès principal                                | Envoi réel production                                                           |
| Erreur frontend                              | Données conservées, bouton réactivé, nouvel essai possible                                                       | Contrôle manuel production                                                      |
| Double soumission                            | Une seule requête pendant un traitement en attente                                                               | Vérification manuelle sur connexions lentes                                     |
| Méthodes HTTP                                | GET et PUT renvoient 405 sur le vrai serveur Next.js                                                             | Même contrôle en production                                                     |
| Mobile / ordinateur                          | Succès simulé à 390 et 1440 px ; aucun débordement à 360/390/768/1440 px                                         | Gmail mobile et vrai téléphone à contrôler                                      |
| Accessibilité et non-régression              | Audit axe WCAG AA automatisé sans violation ; navigation, FAQ, menu, logo, visuels et mouvement réduit : réussis | Audit humain complet non remplacé par ces tests                                 |
| Logs                                         | Métadonnées horodatées uniquement ; assertions d’absence de données personnelles, jetons et secrets              | Vérifier accès/rétention des logs hébergeur                                     |

## Protections et limites à connaître

- Le quota IP est **en mémoire par instance**, pas distribué entre les fonctions Vercel. Ne pas présenter ce contrôle comme un quota global garanti. Turnstile est intégré mais ses clés restent à configurer.
- L’accusé est volontairement désactivé par défaut et nécessite un challenge vérifié. L’activer sans challenge bloque le service avec 503.
- Pas de stockage de prospects, file persistante, retransmission automatique ou promesse « exactement une fois » après perte réseau. Après timeout ambigu, vérifier la boîte avant de renvoyer.
- Les logs applicatifs sont sans contenu ni coordonnées, mais les fournisseurs peuvent conserver leurs propres journaux d’accès et les e-mails ; définir conservation et information de confidentialité.
- L’ancien mot de passe potentiellement exposé doit être révoqué par le propriétaire. Aucun secret historique n’a été réutilisé.

## Incidents rencontrés pendant la recette

- Le premier lancement navigateur était bloqué par des bibliothèques système absentes (`libnspr4`, `libnss3`, `libnssutil3`). Extraction depuis le paquet Chromium déjà installé, puis **16 tests repassés avec succès**. Aucun changement du site requis pour ce problème d’environnement.
- Le build avertit de l’absence de `SITE_URL`/`metadataBase` : définir l’URL réelle avant lancement pour les URL de partage. Pas d’échec de compilation.
- L’API expérimentale Node MockTimers émet un avertissement lors du test de deadline ; test réussi.
- Aucun accès SMTP sortant à Gmail depuis Arena et aucun mot de passe configuré sur Vercel : envoi réel volontairement non tenté avec de faux identifiants.

## Fichiers livrés

### Modifiés

- `.env.example` : variables SMTP, Turnstile, accusé et alias sans secrets ; correction de la coquille `EEMAIL_PROVIDER`.
- `src/lib/mail.ts` : configuration SMTP compatible, HTML/texte, échappement, accusé et deadline.
- `src/lib/contact.ts` : validation anti-CRLF et limite du jeton.
- `src/app/api/contact/route.ts` : vérification challenge, envois ordonnés, erreurs indépendantes, logs minimaux, traitement IP Vercel et durée maximale.
- `src/components/contact-form.tsx` : états demandés, verrou immédiat anti-double envoi, conservation/reset et intégration challenge.
- `scripts/check-secrets.mjs` : protection des variables se terminant par `SECRET_KEY`.
- `tests/contact.test.ts`, `tests/mail.test.ts`, `tests/route.test.ts`, `tests/security.test.mjs` : couverture des nouveaux comportements.
- `tests/e2e/site.spec.ts` : libellés actualisés sans changer les tests de non-régression.
- `README.md`, `docs/EMAIL-GMAIL.md` : activation, architecture et limites actualisées.

### Créés

- `src/components/contact-challenge.tsx` : widget Turnstile réutilisable et renouvellement des jetons.
- `src/lib/turnstile.ts` : validation serveur indépendante.
- `tests/turnstile.test.ts` : vérification des réponses et défaillances Cloudflare.
- `tests/e2e/contact.spec.ts` : succès, échec, mobile/desktop, reset, anti-double soumission et méthodes HTTP.
- `docs/RECETTE-CONTACT-GMAIL.md` : ce rapport.
- `.env.local` : configuration **locale privée ignorée par Git**, mot de passe vide ; ne fait pas partie du patch versionné.

## Actions administrateur avant clôture

Voir [le guide de configuration et déploiement](EMAIL-GMAIL.md).

1. Révoquer l’ancien mot de passe Google potentiellement exposé, créer et renseigner **`SMTP_PASSWORD`** dans la configuration privée.
2. Configurer le widget Turnstile et les deux clés, autoriser les hôtes concernés ; passer **`CONTACT_AUTOREPLY_ENABLED=true`** après configuration des deux clés.
3. Valider l’hébergement commercial, les contenus/l’information de confidentialité et `SITE_URL`. Aucun abonnement payant n’est autorisé ou acheté par cette mise à jour.
4. Publier la révision contenant ces changements après validation, avec les bonnes variables avant le build. La prévisualisation n’est pas une mise en production.
5. Effectuer les vrais tests principal, accusé, Répondre depuis Gmail, local autorisé/production, mobile/ordinateur, puis compléter la fiche ci-dessous.

### Fiche de validation finale — non renseignée

- Date / administrateur : à renseigner.
- URL de production et révision : à renseigner.
- Envoi depuis le site et réception dans Gmail : **non vérifiés**.
- Accusé reçu par le prospect : **non vérifié**.
- Réponse Gmail reçue par le prospect : **non vérifiée**.
- Turnstile réel / protection anti-spam : **non vérifiés**.
- Recette locale réelle et production, mobile / ordinateur : **à effectuer**.
- Validation de clôture : **en attente**.
