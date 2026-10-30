# Secrets et configuration privée

## État constaté

La version de `main` utilisée pour cette correction (`cf4db17`, « Remove GMAIL_APP_PASSWORD from .env.example ») contient déjà des champs `GMAIL_APP_PASSWORD` et `RESEND_API_KEY` vides. Aucun fichier dotenv privé n’est suivi dans cette version.

Cela ne signifie pas qu’un mot de passe publié précédemment est sécurisé. Un secret supprimé du fichier courant peut rester dans les anciens commits, les clones et les copies de pull requests.

## Action indispensable du propriétaire du compte Google

1. Se connecter au compte officiel `optimaworksgn@gmail.com`.
2. Ouvrir https://myaccount.google.com/apppasswords et révoquer le mot de passe d’application qui a été publié. Si son identité n’est pas certaine, révoquer les mots de passe d’application concernés et reconfigurer les applications légitimes.
3. Vérifier l’activité de sécurité récente du compte Google et la validation en deux étapes.
4. Créer un nouveau mot de passe d’application, seulement après révocation de l’ancien.
5. Le renseigner uniquement dans `.env.local` sur le poste local ou dans les variables privées de l’hébergeur, puis redémarrer/redéployer et tester la réception réelle.

Ne pas envoyer ce secret dans la conversation, le saisir dans `.env.example`, le mettre dans une variable `NEXT_PUBLIC_*` ou le copier dans un ticket GitHub. L’agent ne peut pas révoquer un mot de passe Google ni confirmer cette révocation sans accès au compte ; la présente correction ne prétend pas le faire.

## Contrôle automatique ajouté

```bash
npm run check:secrets
```

Ce contrôle :

- refuse les champs de mots de passe, secrets, jetons et clés privées/API non vides dans les fichiers `.env.example` ;
- signale les fichiers `.env`, `.env.local`, etc., s’ils sont suivis par Git ;
- reconnaît certaines signatures de clés privées, de jetons GitHub et de clés d’accès AWS dans les fichiers texte ;
- affiche uniquement le chemin, le numéro de ligne et le type d’anomalie, jamais la valeur trouvée.

Les fichiers privés locaux ignorés par Git ne sont pas lus par ce contrôle. Les images et autres fichiers binaires sont ignorés. Les coordonnées publiques et identifiants non secrets peuvent rester dans les exemples.

Lors d’un build à partir d’un ZIP ou sans dossier `.git`, le contrôle est explicitement limité aux deux fichiers d’exemple disponibles ; il ne lit pas les fichiers privés injectés à l’exécution.

Le workflow `.github/workflows/security.yml` l’exécute lors des pushes et des pull requests, avec sept tests de non-régression. Le `prebuild` l’exécute également avant `npm run build`. Pour rendre le contrôle obligatoire avant fusion, le propriétaire du dépôt doit configurer une règle de protection exigeant ce job ; la correction n’a pas modifié les protections du dépôt.

**Limites :** il s’agit d’un garde-fou ciblé, pas d’un audit exhaustif ni d’un scanner de tout l’historique. Il ne détecte pas tous les formats de secrets, n’empêche pas un contournement volontaire et ne remplace jamais leur révocation.

## Historique Git

Aucune réécriture destructive de l’historique, aucun force-push sur `main`, aucune suppression de branche ni rotation du compte Google n’a été effectuée. Un nettoyage historique demande une opération coordonnée sur les branches, tags, clones et références concernés, distincte de cette correction. Révoquer l’ancien secret reste la première mesure, même si un nettoyage de l’historique est décidé ensuite.
