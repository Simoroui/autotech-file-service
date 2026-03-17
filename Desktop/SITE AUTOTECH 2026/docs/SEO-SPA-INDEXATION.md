# Pourquoi Google affiche 404 sur les pages de résultat

## Problème

Les URLs du type  
`https://autotech-tunisia.com/reprogrammation/cars/bmw/z4/e89-2009-2018/2.0i-184hp/stage1-stage2`  
sont des **routes côté client** (SPA) : il n’existe pas de fichier physique à ce chemin.

Sur **GitHub Pages** :
- Toute requête vers un chemin sans fichier → **réponse HTTP 404**
- Même si la page `404.html` est servie (contenu de l’app), le **code de statut reste 404**
- Google considère une page en 404 comme **non indexable** → « Demande d’indexation refusée »

## Solution : répondre 200 pour ces URLs

Il faut que le serveur (ou un proxy) réponde **HTTP 200** en servant le contenu de `index.html` pour tout chemin sous `/reprogrammation/*`. Le JavaScript du site affichera ensuite la bonne page selon l’URL.

GitHub Pages **ne permet pas** de faire ce type de règle (rewrite avec 200). Il faut donc soit changer d’hébergeur, soit mettre un proxy devant.

---

## Option 1 : Netlify

1. Crée un site Netlify (compte sur [netlify.com](https://netlify.com)).
2. Connecte le dépôt Git ou déploie le dossier du site.
3. Le fichier **`_redirects`** à la racine du projet est déjà configuré :
   ```
   /reprogrammation/*    /index.html   200
   ```
4. Déploie. Netlify appliquera cette règle : les URLs `/reprogrammation/*` renverront `index.html` avec un **200**.

---

## Option 2 : Vercel

1. Crée un projet sur [vercel.com](https://vercel.com) à partir du dépôt.
2. Le fichier **`vercel.json`** à la racine est déjà configuré :
   ```json
   {
     "rewrites": [
       { "source": "/reprogrammation/(.*)", "destination": "/index.html" }
     ]
   }
   ```
3. Déploie. Les URLs `/reprogrammation/*` serviront `index.html` avec **200**.

---

## Option 3 : Cloudflare (domaine déjà sur Cloudflare)

Si `autotech-tunisia.com` utilise **Cloudflare** (DNS ou proxy) :

1. Va dans **Workers & Pages** → **Create** → **Worker**.
2. Colle le script ci-dessous (il renvoie le contenu de ta page d’accueil avec 200 pour `/reprogrammation/*`).
3. Enregistre le Worker, puis dans **Workers Routes** (ou **Rules** → **Worker**) ajoute une route :  
   `*autotech-tunisia.com/reprogrammation*` → ce Worker.

**Script Worker (exemple) :**

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/reprogrammation/')) {
      const indexUrl = new URL('/', url.origin);
      const res = await fetch(indexUrl.toString(), request);
      const newRes = new Response(res.body, {
        status: 200,
        statusText: 'OK',
        headers: res.headers
      });
      return newRes;
    }
    return env.ASSETS.fetch(request);
  }
};
```

(Si ton site est hébergé sur GitHub Pages, il faudra peut-être faire un `fetch` vers l’URL réelle du site, ex. `https://simoroui.github.io/autotech_reprog/`, puis renvoyer ce corps avec status 200.)

**SEO – Balise canonique :** pour que le HTML initial contienne la bonne balise canonique sur les URLs `/reprogrammation/*` (et éviter le message Google « La page n'utilise pas la balise Canonique »), tu peux utiliser le Worker décrit dans **[SEO-CANONICAL-WORKER.md](SEO-CANONICAL-WORKER.md)** (`workers/canonical-inject.js`). Il renvoie déjà un 200 et injecte la canonique.

---

## Option 4 : Cloudflare Pages

Si tu déploies le site sur **Cloudflare Pages** (au lieu de GitHub Pages) :

1. Dans le build, ajoute un fichier **`_redirects`** dans le répertoire de sortie (comme pour Netlify), ou utilise la config **Redirects** dans le dashboard.
2. Règle :  
   `/reprogrammation/*` → `/index.html` avec **status 200** (ou équivalent « rewrite »).

---

## Après la mise en place

1. Redéploie le site (Netlify / Vercel / Cloudflare) ou active le Worker.
2. Vérifie dans un navigateur ou avec `curl -I` qu’une URL comme  
   `https://autotech-tunisia.com/reprogrammation/cars/bmw/z4/e89-2009-2018/2.0i-184hp/stage1-stage2`  
   renvoie bien **HTTP 200**.
3. Dans Google Search Console, utilise **Inspection d’URL** puis **Demander une indexation** pour une de ces URLs.

Une fois que le serveur répond 200, Google pourra indexer ces pages.
