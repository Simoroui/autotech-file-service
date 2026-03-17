# Balise canonique et Worker Cloudflare

## Pourquoi Google dit « La page n'utilise pas la balise Canonique »

La **balise canonique** indique aux moteurs de recherche l’URL principale d’une page. Elle évite les doublons (même contenu accessible via plusieurs URLs) et aide Google à choisir la bonne URL à indexer.

Sur ce site :

- **Pages statiques** (index, dyno, options-reprog, etc.) : le HTML contient déjà `<link rel="canonical" href="...">` dans le `<head>` → pas de message d’erreur.
- **Pages de résultat** (`/reprogrammation/cars/bmw/z4/...`) : le serveur envoie toujours le même `index.html` (SPA), avec une canonique pointant vers l’accueil. Le JavaScript met ensuite à jour la canonique vers l’URL courante, mais **dans le HTML initial** la canonique est celle de l’accueil. Si Google (ou un outil) analyse le HTML **avant** exécution du JS, il considère que la page « n’utilise pas » la bonne canonique.

## Solution : Worker Cloudflare

Un **Worker Cloudflare** intercepte les requêtes vers `/reprogrammation/*`, récupère le HTML de l’accueil, remplace la balise canonique par l’URL réelle de la page, et renvoie ce HTML. Ainsi, la **première réponse** contient déjà la bonne canonique, sans dépendre du JavaScript.

Fichier concerné : **`workers/canonical-inject.js`**.

## Déploiement du Worker

### Prérequis

- Domaine **autotech-tunisia.com** géré par Cloudflare (DNS actif).
- Site hébergé (ex. Cloudflare Pages, ou autre) et répondant sur ce domaine.

### Étapes

1. **Créer le Worker dans Cloudflare**
   - Dashboard Cloudflare → **Workers & Pages** → **Create** → **Create Worker**.
   - Nom suggéré : `autotech-canonical`.
   - Coller le contenu de `workers/canonical-inject.js` dans l’éditeur (en adaptant si vous utilisez l’éditeur en ligne qui attend parfois `addEventListener('fetch', ...)` ; voir variante ci‑dessous).

2. **Ajouter la route**
   - Dans le Worker : **Settings** → **Triggers** → **Routes** → **Add route**.
   - Route : `https://autotech-tunisia.com/reprogrammation/*`
   - Zone : **autotech-tunisia.com**.

3. **Déployer**
   - **Save and Deploy**.

À chaque requête vers une URL sous `/reprogrammation/*`, le Worker renverra le HTML avec la balise canonique déjà corrigée.

### Variante avec `addEventListener` (éditeur Worker classique)

Si l’éditeur Cloudflare attend le format avec `addEventListener` :

```js
addEventListener('fetch', (event) => {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/reprogrammation/')) {
    return fetch(request);
  }
  const originReq = new Request(url.origin + '/', { method: 'GET', headers: request.headers });
  const originRes = await fetch(originReq);
  if (!originRes.ok || !originRes.headers.get('Content-Type')?.includes('text/html')) {
    return originRes;
  }
  let html = await originRes.text();
  const canonicalUrl = url.origin + url.pathname + (url.search || '');
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    '<link rel="canonical" href="' + canonicalUrl.replace(/"/g, '&quot;') + '">'
  );
  const headers = new Headers(originRes.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(html, { status: originRes.status, statusText: originRes.statusText, headers });
}
```

### Déploiement en ligne de commande (Wrangler)

Depuis le dossier **`workers/`** :

```bash
cd workers
npx wrangler deploy
```

Puis ajouter la route **https://autotech-tunisia.com/reprogrammation/*** dans le dashboard (Triggers → Routes).

## Vérification

Après déploiement :

1. Ouvrir une URL de résultat, ex. :  
   `https://autotech-tunisia.com/reprogrammation/cars/bmw/z4/e89-2009-2018/2.0i-184hp/stage1-stage2`
2. Afficher le code source (clic droit → « Afficher le code source de la page »).
3. Dans le `<head>`, vérifier la présence de :  
   `<link rel="canonical" href="https://autotech-tunisia.com/reprogrammation/cars/bmw/z4/...">`  
   avec la même URL que la page.

Si c’est le cas, le message Google « La page n'utilise pas la balise Canonique » devrait disparaître après un prochain passage du robot.
