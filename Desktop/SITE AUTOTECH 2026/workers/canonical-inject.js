/**
 * Cloudflare Worker : injection de la balise canonique pour les URLs /reprogrammation/*
 *
 * Pour les pages SPA (ex. /reprogrammation/cars/bmw/z4/...), le HTML initial
 * sert toujours index.html avec canonical = accueil. Ce Worker récupère le HTML,
 * remplace la balise canonical par l’URL réelle de la page, puis renvoie la réponse.
 * Ainsi Google reçoit dès le premier octet la bonne canonique (SEO).
 *
 * Route à configurer : https://autotech-tunisia.com/reprogrammation/*
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/reprogrammation/')) {
      return fetch(request);
    }

    const originReq = new Request(url.origin + '/', {
      method: 'GET',
      headers: request.headers,
    });
    const originRes = await fetch(originReq);

    if (!originRes.ok || !originRes.headers.get('Content-Type')?.includes('text/html')) {
      return originRes;
    }

    let html = await originRes.text();
    const canonicalUrl = url.origin + url.pathname + (url.search || '');

    html = html.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${canonicalUrl.replace(/"/g, '&quot;')}">`
    );

    const headers = new Headers(originRes.headers);
    headers.set('Content-Type', 'text/html; charset=utf-8');

    return new Response(html, {
      status: originRes.status,
      statusText: originRes.statusText,
      headers,
    });
  },
};
