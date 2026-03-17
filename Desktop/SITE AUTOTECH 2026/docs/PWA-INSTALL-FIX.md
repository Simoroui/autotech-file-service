# PWA : faire proposer « Installer l’application » par Chrome

## Problème

Sur autotech-tunisia.com, les URLs `/images/*` et même `/logoicon.png` à la racine renvoient **500** en production. Chrome exige que l’icône du manifest réponde en **200** pour proposer l’installation.

## Solution en place

1. **Manifest** : les icônes PWA pointent vers **`/pwa-icon.png`** (et non plus vers `/images/logoicon.png`).
2. **Worker Cloudflare** : le fichier `workers/spa-fallback-zone.js` sert l’icône PWA pour les chemins **`/pwa-icon.png`** et **`/logoicon.png`** avec un **200** (icône embarquée en base64).

Pour que l’installation refonctionne, il faut que **ce Worker soit déployé et attaché à la zone** de façon à intercepter ces URLs.

## Étapes obligatoires (Cloudflare)

1. **Déployer le Worker**
   - Depuis le dossier **`workers/`** du projet :
     ```bash
     cd workers
     npx wrangler deploy -c wrangler-spa.toml
     ```
   - Ou aller dans **Workers & Pages** sur Cloudflare, créer un Worker et coller le contenu de `spa-fallback-zone.js` (avec la constante `PWA_ICON_B64` et la fonction `pwaIconResponse`).

2. **Attacher le Worker à la zone**
   - Le Worker doit être invoqué pour **toutes** les URLs du site, pas seulement `/reprogrammation/*`, sinon `/pwa-icon.png` ne passera pas par le Worker.
   - Dans **Workers & Pages** > votre Worker > **Settings** > **Triggers** (ou **Routes**) :
     - **Route** : `*autotech-tunisia.com/*`  
       (une seule route qui couvre tout le domaine).
   - Si vous aviez seulement `*autotech-tunisia.com/reprogrammation*`, ajoutez ou remplacez par `*autotech-tunisia.com/*` pour que `/pwa-icon.png` soit bien géré.

3. **Vérifier**
   - Ouvrir **https://autotech-tunisia.com/pwa-icon.png** : l’image doit s’afficher (réponse **200**).
   - **Sur mobile (Android Chrome)** :
     - Effacer les données du site (Paramètres Chrome > Confidentialité > Cookies et données des sites > autotech-tunisia.com).
     - Ouvrir https://autotech-tunisia.com/ puis **recharger une fois** (pour que le Service Worker contrôle la page).
     - Attendre ~30 s et toucher la page une fois (Chrome exige un minimum d’engagement).
     - Soit le bandeau apparaît, soit aller dans le **menu du navigateur (⋮)** → « Installer l’application » ou « Ajouter à l’écran d’accueil ».
     - Le bouton « Installer l’application » dans le footer est affiché sur mobile ; s’il ne déclenche pas la boîte d’installation, le message indique d’utiliser le menu (⋮).

## Résumé

- **Cause** : les icônes PWA servies par Pages renvoyaient 500.
- **Correctif** : le manifest pointe vers `/pwa-icon.png`, servi par le Worker avec un **200**.
- **À faire** : déployer `workers/spa-fallback-zone.js` et attacher le Worker à la route **`*autotech-tunisia.com/*`**.
