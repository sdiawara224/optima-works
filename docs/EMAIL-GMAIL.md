# Formulaire de contact — Gmail SMTP

## État de livraison

Mise à jour du site existant : Next.js **16.4.3**, React 19, TypeScript, **App Router**. Le formulaire reste dans `src/components/contact-form.tsx` et l’unique API dans `src/app/api/contact/route.ts`. Nodemailer et ses types étaient déjà installés ; aucune dépendance ajoutée. Aucun changement des autres pages, du CSS ou de la charte graphique.

**Le code est testé, mais la recette Gmail réelle reste obligatoire.** Aucun mot de passe Google n’est fourni dans le dépôt. Les simulations SMTP ne prouvent ni la réception réelle ni le classement en boîte principale. La mission de mise en production ne peut être clôturée avant les vérifications décrites ci-dessous.

## 1. Préparer le compte Google

Avec le compte `optimaworksgn@gmail.com` :

1. Activer la validation en deux étapes dans les paramètres de sécurité Google.
2. Ouvrir [Mots de passe des applications](https://myaccount.google.com/apppasswords).
3. **Révoquer tout ancien mot de passe d’application potentiellement exposé**, puis en créer un nouveau, par exemple « Site OptimaWorks ».
4. Le conserver dans un gestionnaire de mots de passe et le saisir uniquement dans la configuration privée du site. Ne jamais utiliser le mot de passe principal, l’envoyer dans le chat, le mettre dans une PR, une capture ou un fichier versionné.

Si cette option n’est pas disponible, vérifier les restrictions du compte Google sans désactiver sa sécurité.

## 2. Variables d’environnement

| Variable                         | Valeur / rôle                                                      | Exposition                                                               |
| -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `EMAIL_PROVIDER`                 | `gmail`                                                            | Serveur                                                                  |
| `SMTP_HOST`                      | `smtp.gmail.com`                                                   | Serveur                                                                  |
| `SMTP_PORT`                      | `465`                                                              | Serveur                                                                  |
| `SMTP_USER`                      | `optimaworksgn@gmail.com`                                          | Serveur                                                                  |
| `SMTP_PASSWORD`                  | Nouveau mot de passe d’application Google                          | **Secret serveur**                                                       |
| `CONTACT_EMAIL`                  | `optimaworksgn@gmail.com`                                          | Serveur                                                                  |
| `CONTACT_AUTOREPLY_ENABLED`      | `false` au départ, `true` après activation de Turnstile            | Serveur                                                                  |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Clé **publique** du widget de l’administrateur                     | Navigateur, fixée au build                                               |
| `TURNSTILE_SECRET_KEY`           | Clé secrète de validation du widget                                | **Secret serveur**                                                       |
| `SITE_URL`                       | URL HTTPS canonique de production, sans chemin                     | Serveur ; en Production uniquement si l’aperçu utilise une autre origine |
| `SITE_INDEXABLE`                 | `false` jusqu’à validation du contenu et du lancement              | Serveur                                                                  |
| `TRUST_PROXY`                    | `false` hors proxy de confiance ; traitement automatique de Vercel | Serveur                                                                  |

Seuls l’hôte Gmail et le port TLS 465 sont acceptés ; une autre valeur rend la configuration invalide. Les espaces du mot de passe Google sont retirés.

Compatibilité conservée : `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `CONTACT_TO`. Les nouvelles variables `SMTP_USER`, `SMTP_PASSWORD`, `CONTACT_EMAIL` sont prioritaires si elles sont définies. **Un `SMTP_PASSWORD` défini mais vide ne réactive pas un ancien secret** : renseigner la variable canonique ou la supprimer volontairement pour utiliser l’alias. L’alternative existante Resend reste disponible avec `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `CONTACT_FROM` et un destinataire configuré. Aucun basculement automatique vers un autre prestataire en cas d’échec Gmail.

### En local

Un `.env.local` privé, ignoré par Git, est préparé avec mot de passe vide lorsque ce fichier n’existe pas. Sinon conserver ses valeurs et compléter sans l’écraser. Le fichier `.env.example` versionné documente uniquement des secrets **vides**.

Renseigner `SMTP_PASSWORD` dans `.env.local`, puis redémarrer `npm run dev`. En mode production local, configurer avant `npm run build` et relancer `npm start`. Le build décide aussi de la notice de disponibilité du formulaire ; la clé publique Turnstile est intégrée au bundle à ce moment.

### Sur Vercel

Dans le projet **optima-works → Settings → Environment Variables** :

1. Les paramètres non secrets `EMAIL_PROVIDER`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `CONTACT_EMAIL`, `CONTACT_AUTOREPLY_ENABLED=false`, `SITE_INDEXABLE=false` ont été préparés pour **Production et Preview** le 30 octobre 2026.
2. Ajouter `SMTP_PASSWORD` en variable **Sensitive**, sans préfixe `NEXT_PUBLIC_`. Sélectionner Production ; pour une recette en Preview, autoriser également Preview explicitement ou limiter à la branche de recette. Ne pas publier les secrets des environnements de confiance dans des previews non approuvées.
3. Configurer les clés Turnstile comme indiqué ci-dessous, puis activer l’accusé si souhaité.
4. Définir `SITE_URL` pour Production à l’URL réellement utilisée. En Preview, laisser vide pour que l’API vérifie l’origine du déploiement lui-même, ou utiliser l’URL exacte de cet aperçu. Une origine étrangère ou absente est refusée.
5. Vérifier que l’URL de production approuvée est accessible aux visiteurs : la protection des aperçus peut demander une connexion Vercel, mais ne doit pas bloquer le site public. Conserver les aperçus privés ; ne pas désactiver leur protection pour contourner la recette.
6. Redéployer **la révision contenant cette mise à jour**, pas une ancienne révision. Les variables ajoutées ne changent pas un déploiement existant.

Réglages de build : framework **Next.js**, racine du dépôt, installation `npm ci`, build `npm run build`. Laisser l’Output Directory par défaut (override désactivé) ou utiliser **`.next`** pour ce projet ; **ne jamais saisir littéralement « Automatique »**. Aucune modification de `distDir`, aucun export statique : l’API a besoin d’un serveur Node.js. Le projet Vercel existant utilise Node 26.x ; les tests locaux sont exécutés sous Node 22.22.3. La version Node n’a pas été modifiée par cette intégration.

L’hébergement doit autoriser les connexions sortantes vers `smtp.gmail.com:465` et les appels HTTPS Turnstile. L’environnement Arena ne dispose pas de cet accès SMTP : la recette réelle doit se faire depuis un hébergement compatible ou un poste autorisé.

**Aucune souscription payante n’a été créée.** Valider une offre autorisant l’usage commercial d’OptimaWorks avant le lancement ; l’offre Vercel Hobby est réservée à un usage personnel non commercial. L’administrateur doit approuver les services, quotas, coûts et conditions. La génération de builds/aperçus ne vaut pas validation de lancement public.

## 3. Turnstile et accusé de réception

L’intégration Cloudflare Turnstile est facultative pour l’envoi principal, mais **obligatoire pour activer l’accusé automatique**, afin d’éviter un endpoint public envoyant des réponses à des adresses arbitraires sans challenge.

L’administrateur doit créer un widget dans son propre compte Cloudflare, autoriser le domaine réel ainsi que les hôtes de recette choisis, et renseigner les deux clés. Aucun compte ni abonnement Cloudflare n’est créé automatiquement. Faire valider ce tiers et sa mention dans l’information de confidentialité avant lancement. Ne pas utiliser les clés de test Cloudflare en production.

- Clé publique : `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ; seule cette clé est exposée au navigateur.
- Secret : `TURNSTILE_SECRET_KEY`, variable serveur privée.
- Widget chargé seulement quand la clé publique existe ; aucune requête Cloudflare ajoutée au navigateur sans configuration.
- L’API vérifie le jeton auprès de Cloudflare avec un délai maximal de 5 secondes, `success === true`, l’action `contact` et le nom d’hôte de l’origine autorisée. Un jeton manquant/invalide, une panne ou une configuration partielle bloque l’envoi.
- Après une tentative d’envoi, le jeton est effacé et le widget renouvelé ; expiration et erreurs sont gérées. En cas de blocage réseau du widget, un contact par e-mail reste proposé.

Une fois le challenge configuré, définir `CONTACT_AUTOREPLY_ENABLED=true` et redéployer. Si ce drapeau est activé sans challenge, l’API refuse l’envoi avec 503 plutôt que créer un relais abusif.

Le message principal est envoyé d’abord. L’accusé contient uniquement le texte fixe de remerciement, jamais les liens ou le contenu libre du prospect. Si l’envoi principal échoue, aucun accusé n’est tenté. Si seul l’accusé échoue, la réponse reste un succès : la demande principale ne doit pas être renvoyée. Pas de réessai automatique, de file persistante ou de garantie de livraison de l’accusé. Le statut `acknowledgement` vaut `sent`, `failed` ou `disabled`.

## 4. Fonctionnement des messages

Message principal :

- **From** : `OptimaWorks Website <compte SMTP authentifié>`.
- **To** : `optimaworksgn@gmail.com` par défaut, configurable uniquement côté serveur.
- **Reply-To** : adresse validée du prospect. L’adresse du visiteur n’est **pas** utilisée pour usurper un expéditeur Gmail.
- **Objet** : `Nouvelle demande de contact – OptimaWorks` ; l’objet libre est conservé dans le corps.
- Versions HTML et texte : nom, entreprise, e-mail, téléphone, service, objet et message ; contenu libre échappé en HTML. Mise en page e-mail fluide, couleurs de marque, sans image distante ni script.

Les champs entreprise/téléphone restent facultatifs ; les champs et styles existants sont conservés. Validation partagée : nom 2–100 caractères, e-mail valide ≤254, téléphone ≤25, objet 3–150 sur une ligne, message 20–5 000, service choisi et information de confidentialité acceptée.

TLS 465 avec contrôle du certificat, TLS ≥1.2, limites de connexion et délai total **20 secondes par message**. Accès fichiers/URL désactivés dans Nodemailer. Succès uniquement après acceptation du destinataire, absence de rejet et réponse SMTP `250`. L’acceptation SMTP n’est pas la preuve de réception ni une garantie de classement en boîte principale.

## 5. Sécurité, limites et suivi

- Méthode applicative POST uniquement ; GET/PUT refusées par Next.js, JSON requis, origine contrôlée.
- Limite de corps 24 000 octets appliquée aussi en lecture du flux, même sans `Content-Length` fiable.
- Honeypot rempli : refus sans envoi ni faux succès. Aucun détail d’erreur SMTP n’est retourné.
- Au plus 5 tentatives par tranche de 10 minutes et par IP **dans chaque instance serveur**. Sur Vercel, utilisation de l’en-tête IP réécrit par la plateforme. Hors Vercel, `TRUST_PROXY=true` seulement si le proxy de confiance écrase cet en-tête ; sinon quota partagé pour ne pas accepter les IP forgées.
- **Le limiteur mémoire n’est pas distribué** et se réinitialise au redémarrage. Il ne garantit pas un quota global sur Vercel multi-instance. Turnstile ajoute une protection, mais pour un quota global strict, prévoir une règle pare-feu ou un stockage de compteurs distribué validé et chiffré séparément. Aucun service externe payant ou base de prospects ajouté.
- Logs JSON limités à `timestamp`, identifiant aléatoire de requête, événement et fournisseur. Événements : principal accepté/échoué, accusé accepté/échoué, indisponibilité du challenge. Aucun nom, adresse, IP, message, secret, jeton ou réponse SMTP brute dans ces logs applicatifs. Le fournisseur d’hébergement peut avoir ses propres journaux d’accès ; définir leurs accès et conservation.
- Gmail applique ses propres limites anti-abus ; un accusé double le nombre de messages pour une demande. Aucun volume illimité n’est promis.
- Le navigateur bloque les doubles soumissions, réinitialise après succès et conserve les champs en cas d’échec. Pas de garantie « exactement une fois » en cas de perte réseau après acceptation SMTP : vérifier la boîte avant un nouvel envoi dans ce cas ambigu.
- Aucun CRM, aucune base de leads ni journal du contenu. Les messages résident dans les boîtes mail ; définir accès, conservation, suppression et information de confidentialité.

## 6. Recette réelle obligatoire — local et production

Après configuration privée, puis publication de la bonne révision sur un hébergement validé :

1. Depuis un navigateur ordinateur puis mobile, soumettre une demande valide avec un objet de test identifiable et une **adresse externe contrôlée par l’administrateur**. Ne pas employer les adresses `example.com` des tests automatisés.
2. Vérifier l’arrivée réelle dans `optimaworksgn@gmail.com` (réception, Tous les messages et spam), puis contrôler HTML/texte, tous les champs et absence d’exécution HTML.
3. Dans Gmail, cliquer sur **Répondre** : le destinataire doit être le prospect ; envoyer une réponse de test et contrôler sa réception sur l’adresse externe.
4. Avec Turnstile et l’accusé activés, vérifier l’arrivée du remerciement sur l’adresse externe, sans copie du message initial. Contrôler les événements d’acceptation correspondants.
5. Vérifier la confirmation et les champs réinitialisés, le blocage des doubles soumissions, la conservation des données après échec, les refus des champs invalides/courts, du honeypot, d’un challenge manquant et des répétitions.
6. Simuler une panne SMTP uniquement en environnement de recette, jamais en cassant volontairement la production. Vérifier une erreur compréhensible sans secret, puis restaurer la configuration et redéployer.
7. Consigner date, URL, révision, environnement, réception principale, accusé et réponse reçue dans le rapport de recette. Ne pas conserver de capture contenant des identifiants.

Les résultats automatisés et les étapes non exécutées sont consignés dans [RECETTE-CONTACT-GMAIL.md](RECETTE-CONTACT-GMAIL.md).

## Retour arrière

Avant lancement, conserver l’identifiant du précédent déploiement. En cas d’incident, restaurer cette révision dans Vercel, puis vérifier la compatibilité de sa configuration (`GMAIL_*` pour l’ancien code si nécessaire). `CONTACT_AUTOREPLY_ENABLED=false` désactive l’accusé après mise à jour des variables ; redéployer pour une configuration cohérente. En cas de fuite, révoquer immédiatement le mot de passe Google et les clés concernées, puis générer de nouveaux secrets privés. Un rollback de code ne révoque aucun secret.
