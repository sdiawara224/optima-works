# Recevoir les formulaires dans le Gmail officiel

Le formulaire peut envoyer directement par le serveur SMTP de Google, sans Resend et sans nom de domaine. Le destinataire par défaut est **optimaworksgn@gmail.com**. Aucun envoi réel n’a encore été vérifié : un mot de passe d’application Google est nécessaire, à renseigner uniquement dans la configuration privée.

## 1. Préparer le compte Google

Avec le compte `optimaworksgn@gmail.com` :

1. Ouvrir les paramètres de sécurité du compte Google et activer la validation en deux étapes.
2. Ouvrir [Mots de passe des applications](https://myaccount.google.com/apppasswords).
3. Créer un mot de passe d’application nommé, par exemple, « Site OptimaWorks ».
4. Conserver ce secret dans un gestionnaire de mots de passe. **Ne pas l’envoyer dans le chat, le commiter ou utiliser le mot de passe habituel du compte.**

Si l’option n’est pas disponible, vérifier les restrictions du compte et les politiques de sécurité Google. Ne pas désactiver la sécurité du compte pour contourner une restriction ; une solution alternative approuvée sera nécessaire.

## 2. Configurer le site

### Sur votre ordinateur

Créer `.env.local` à la racine du projet (ou compléter le fichier existant, sans écraser ses autres variables) :

```env
EMAIL_PROVIDER=gmail
GMAIL_USER=optimaworksgn@gmail.com
GMAIL_APP_PASSWORD=REMPLACER_PAR_LE_MOT_DE_PASSE_APPLICATION_GOOGLE
CONTACT_TO=optimaworksgn@gmail.com
```

La valeur de démonstration ci-dessus doit être remplacée par le vrai secret, uniquement dans votre fichier privé. Les espaces de regroupement du mot de passe Google sont retirés par l’application. `.env.local` est ignoré par Git.

Redémarrer `npm run dev`. En mode production, définir les variables avant `npm run build`, puis redémarrer `npm start`.

### Sur le site hébergé

Renseigner ces quatre variables dans le gestionnaire de variables d’environnement de l’hébergeur, puis redéployer. Les variables du poste local ne configurent pas automatiquement l’aperçu Arena ni le site distant. Ne jamais préfixer ce secret par `NEXT_PUBLIC_`.

L’hébergement doit autoriser les connexions sortantes vers `smtp.gmail.com:465`. L’environnement de développement Arena n’autorise pas cet accès : la livraison réelle doit être testée depuis votre ordinateur ou un hébergement compatible. Aucune souscription n’a été créée.

## 3. Faire une vraie recette

1. Soumettre une demande de test depuis le formulaire avec un nom, un e-mail externe, un service, un objet et une description.
2. Vérifier sa réception dans `optimaworksgn@gmail.com` : boîte de réception, Tous les messages et éventuellement dossier Envoyés (l’expéditeur et le destinataire sont ici le même compte).
3. Contrôler tous les champs, y compris entreprise et téléphone facultatifs.
4. Cliquer sur Répondre : la réponse doit cibler l’e-mail du visiteur grâce à `Reply-To`, pas le compte du site.
5. Vérifier qu’une configuration absente ou une erreur Google n’affiche jamais de faux succès.

Le succès est retourné uniquement après acceptation SMTP du destinataire avec réponse `250`, pas simplement après la soumission du formulaire. L’acceptation ne garantit pas un classement en boîte principale. En cas de timeout après acceptation, vérifier la boîte avant de renvoyer pour éviter un doublon.

## 4. Données et sécurité

Le mail contient nom, entreprise, e-mail, téléphone, service, objet et description du besoin. Le site ne conserve pas ces demandes dans une base de prospects et n’enregistre pas leur contenu dans les logs applicatifs. Les e-mails restent dans le compte Google ; OptimaWorks doit définir accès, conservation et suppression, et adapter sa politique de confidentialité.

L’expéditeur est fixe et authentifié, le destinataire provient de la configuration serveur (Gmail officiel par défaut), jamais d’un champ libre du visiteur. SMTP utilise TLS, vérifie le certificat et désactive les accès aux fichiers/URL dans les messages. Le honeypot, la validation et le limiteur existants sont conservés. Le limiteur distribué reste à prévoir selon l’hébergement.

Les limites d’envoi et contrôles anti-abus dépendent du compte Google. Aucun volume illimité n’est promis. Révoquer le mot de passe d’application si l’accès n’est plus nécessaire ou en cas de fuite. Ne pas enregistrer les erreurs SMTP détaillées avec les identifiants.

## Alternative existante

Resend reste disponible avec `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `CONTACT_FROM` (expéditeur autorisé) et `CONTACT_TO`. Il n’est pas utilisé lorsque `EMAIL_PROVIDER=gmail`, même si une ancienne clé Resend est encore présente. Un échec Gmail n’est pas basculé silencieusement vers un autre prestataire.
