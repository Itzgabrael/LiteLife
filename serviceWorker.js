const CACHE_NAME='litelife-v1';
const urlsToCache= [
    'index.html',
    'style.css',
    'app.js',
    'data.js',
    'manifest.json',
    'icon-192.png',
    'icon-512.png',
    'favorites.html',
    'help.html',
    'suggest.html',
    'themeManager.js',
    'premiumManager.js'
];
//Install service worker
self.addEventListener('install', e=>{
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache=>{
            return cache.addAll(urlsToCache);
        })
    );
});
//Activate
self.addEventListener('activate',e=>{
    e.waitUntil(
        caches.keys().then(keys=>{
            return Promise.all(
                keys.filter(k=> k!==CACHE_NAME).map(k=>
                    caches.delete(k))
            );
        })
    );
});
//Fetch cached files
self.addEventListener('fetch',e=>{
    e.respondWith(
        caches.match(e.request).then(response=>{
            return response||fetch(e.request);
        })
    );
});