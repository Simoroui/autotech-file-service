const CACHE_NAME = 'autotech-cache-v1';
const RESOURCES_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/header.css',
    '/css/footer.css',
    '/css/dyno.css',
    '/css/results.css',
    '/js/header.js',
    '/js/vehicle-selector.js',
    '/images/logo.png',
    '/images/Logo-H.png',
    '/images/hero-bg.webp',
    '/images/hero-bg.jpg',
    '/images/dyno-main.webp',
    '/images/dyno-main.jpg',
    '/images/echappement.webp',
    '/images/echappement.jpg',
    '/images/bmc.jpg',
    '/images/rapport1.webp',
    '/images/rapport1.jpg',
    '/images/rapport2.webp',
    '/images/rapport2.jpg',
    '/images/rapport3.webp',
    '/images/rapport3.jpg'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(RESOURCES_TO_CACHE);
            })
    );
});

// Stratégie de cache : Network First avec fallback sur le cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la requête réseau réussit, mettre en cache et retourner la réponse
                if (response.ok) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                // En cas d'échec réseau, essayer le cache
                return caches.match(event.request)
                    .then((response) => {
                        return response || new Response('Offline content not available');
                    });
            })
    );
});

// Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
}); 