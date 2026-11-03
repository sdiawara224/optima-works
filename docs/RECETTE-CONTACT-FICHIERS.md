# Contact : fichier de description et validation de l’adresse

Date : **2 novembre 2026**. Évolution du formulaire existant dans la PR nº 3, branche `arena/6086771e-optima-works`.

## Fonctionnement ajouté

- Un fichier de description **facultatif**, PDF ou TXT UTF-8, **2 Mo maximum** (2 097 152 octets). Le message de 20–5 000 caractères reste obligatoire.
- Tous les champs métier de la capture sont collectés : nom, entreprise, e-mail, téléphone, service/besoin, objet, message et acceptation de l’information de confidentialité. Les champs entreprise/téléphone restent facultatifs.
- Envoi du document comme pièce jointe du message principal, avec données textuelles dans les versions HTML/texte ; destinataire configuré `optimaworksgn@gmail.com`, compte authentifié en From et visiteur en Reply-To. Le visiteur ne choisit jamais le destinataire du message principal.
- Transport multipart uniquement si un fichier est sélectionné ; compatibilité JSON conservée sans fichier.
- Contrôles de format d’e-mail partagés navigateur/serveur, caractères de nom Gmail, alias `+tag` conservés ; domaine en minuscules. Aucune preuve d’existence/propriété de la boîte et aucune correction silencieuse de domaine.
- Un seul fichier autorisé, taille/extension/MIME et contenu contrôlés côté serveur. Signature et fin PDF identifiées ; TXT décodé strictement en UTF-8 et rejet du contenu binaire. Les noms sont nettoyés pour les en-têtes, sans chemin disque ou URL.
- Lecture du corps bornée avant parsing multipart ; doublons de champs/fichiers, fichiers sous d’autres champs et champs inconnus refusés.
- Aucune écriture de fichiers sur disque, aucune URL publique, aucune dépendance ou base ajoutée, aucun contenu/nom de fichier dans les logs. La copie reçue dans Gmail reste soumise à la politique de conservation de l’entreprise.
- La pièce jointe n’est jamais incluse dans l’accusé. Un échec conserve champs et fichier pour réessayer ; un succès réinitialise aussi le champ fichier. Styles existants conservés ; aucun CSS ou autre page modifié.

## Limites et sécurité

Formats volontairement limités : pas de DOC/DOCX, archive, image ou exécutable. Le nom comporte une seule extension. Le plafond du corps multipart est de **2 161 152 octets**, enveloppe comprise ; les valeurs texte sont limitées ensemble à 24 000 octets. Sans fichier, la limite JSON reste 24 000 octets.

La reconnaissance de format **n’est pas un antivirus**, ne garantit pas qu’un PDF est inoffensif et ne constitue pas une analyse complète de sa structure interne. Les documents ne sont pas exécutés ou rendus par le serveur. Conserver les précautions habituelles à l’ouverture d’une pièce jointe reçue.

Le rate limiting existant reste par instance ; Turnstile reste configurable et requis pour l’accusé automatique. Aucun stockage distribué ni service payant ajouté.

## Vérifications exécutées

| Vérification                | Résultat                                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                  | **64/64 réussis**, dont contrôle des fichiers, multipart, collecte complète, adresses, SMTP/Resend simulés et accusé sans fichier                                           |
| `npm run typecheck`         | Réussi                                                                                                                                                                      |
| `npm run build`             | Réussi                                                                                                                                                                      |
| `npm run check:secrets`     | Réussi sur les fichiers examinés                                                                                                                                            |
| Playwright sur `next start` | **22/22 réussis**, dont succès avec fichier à 390 et 1440 px, refus local avant réseau, conservation/reset du fichier, Gmail invalide et vrai parsing multipart par Next.js |
| Audit axe automatisé        | Sans violation sur le périmètre existant testé                                                                                                                              |
| `npm audit --omit=dev`      | 0 vulnérabilité signalée dans les dépendances de production                                                                                                                 |
| Audit npm complet           | 5 alertes modérées dans l’outillage de développement Lighthouse et ses transitifs ; aucune correction forcée ou modification de dépendance dans cette évolution ciblée      |

Les succès d’envoi ont été simulés ; aucun e-mail n’a été envoyé à une personne réelle par ces tests. Le test HTTP réel du serveur local prouve qu’un TXT valide atteint la vérification de configuration (503 sans secret) et qu’un faux PDF est refusé (400), pas la livraison Gmail. Le fixture PDF de test vérifie seulement les marqueurs de format ; la recette finale doit employer un vrai document PDF.

Un problème de typage Buffer/BodyInit dans le nouveau test navigateur a été corrigé avant le build réussi. Le build conserve l’avertissement de `SITE_URL` non défini ; aucun domaine fictif n’a été ajouté.

## Diagnostic de la capture et blocage restant

Contrôle Vercel effectué le 2 novembre : le domaine `optima-works.vercel.app` sert encore la révision principale **12ecd9a**, antérieure à la PR nº 3. Cela explique l’ancien bouton et l’absence du champ fichier. Les paramètres non secrets SMTP existent sur le projet, mais **`SMTP_PASSWORD` n’est pas configuré**, et aucun ancien secret `GMAIL_APP_PASSWORD` n’y est présent. Le refus affiché signifie qu’aucun message n’a été transmis ; il ne constitue pas un diagnostic d’adresse visiteur invalide.

Ne pas enlever la notice ou retourner un faux succès pour masquer cette configuration manquante. Aucune tentative n’a été faite avec un ancien secret exposé, aucun secret demandé dans le chat et aucune lecture de boîte mail effectuée.

## Fichiers de cette évolution

Créés :

- `src/lib/contact-file.ts` : limites et contrôles de métadonnées partagés.
- `src/lib/contact-attachment.ts` : contrôle des octets et pièce jointe en mémoire côté serveur.
- `tests/contact-attachment.test.ts` : tests des formats/limites/noms/contenus.
- `docs/RECETTE-CONTACT-FICHIERS.md` : ce rapport.

Modifiés :

- `src/components/contact-form.tsx` : champ fichier, validation et transport multipart conditionnel.
- `src/app/api/contact/route.ts` : parsing borné, contrôle des parts, pièce jointe transmise au mail.
- `src/lib/contact.ts` : règles de format Gmail et normalisation du domaine.
- `src/lib/mail.ts` : pièce jointe Nodemailer, compatibilité Resend encodée, accusé inchangé.
- `tests/contact.test.ts`, `tests/mail.test.ts`, `tests/route.test.ts`, `tests/e2e/contact.spec.ts` : validations et non-régression.
- `docs/EMAIL-GMAIL.md`, `docs/RECETTE-CONTACT-GMAIL.md` : documentation et renvoi au rapport courant.

## Recette de production à terminer

1. Saisir un **nouveau mot de passe d’application Google** dans `SMTP_PASSWORD`, variable privée/sensible Vercel. Ne pas le transmettre dans le chat. Révoquer tout ancien mot de passe potentiellement exposé.
2. Valider puis publier la révision contenant la PR nº 3 et cette évolution ; le site de la capture ne se met pas à jour par le seul ajout d’une variable. Redéployer après configuration.
3. Depuis mobile et ordinateur, soumettre une demande avec une adresse contrôlée et un vrai document de test non sensible. Confirmer dans `optimaworksgn@gmail.com` tous les champs et la pièce jointe reçue ; cliquer Répondre pour contrôler le destinataire prospect.
4. Tester les refus sans joindre de fichier malveillant réel. Pour l’accusé, configurer les deux clés Turnstile, autoriser les hôtes, activer `CONTACT_AUTOREPLY_ENABLED=true`, redéployer et vérifier sa réception séparément.
5. Valider l’hébergement commercial, la confidentialité, l’URL et les conditions de lancement existantes. Aucun abonnement payant ni changement de protection d’accès n’a été effectué ici.

**Livraison/réception Gmail en production : non vérifiées, mission d’activation non clôturée.**
