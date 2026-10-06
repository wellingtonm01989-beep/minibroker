// Service worker: guarda os arquivos do jogo para ele abrir mesmo sem internet.
// Com internet, busca sempre a versão mais nova (e atualiza a cópia guardada); sem internet, usa a cópia.
// Ao mudar a lista de arquivos, troque a versão para apagar a cópia antiga.
const CACHE = 'minibroker-v1';
const ARQUIVOS = [
    './',
    './investimentos.html',
    './app.js',
    './vida.js',
    './noticias.js',
    './manifest.webmanifest',
    './icones/icone-192.png',
    './icones/icone-512.png',
    './icones/icone-maskable-512.png',
    './icones/apple-touch-icon.png',
    './icones/favicon-32.png'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys()
        .then(nomes => Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n))))
        .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    const req = e.request;
    // Só os arquivos do próprio jogo. A Selic e o IPCA do Banco Central vão direto para a internet.
    if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
    e.respondWith(
        fetch(req)
            .then(resp => {
                if (resp.ok) {
                    const copia = resp.clone();
                    caches.open(CACHE).then(c => c.put(req, copia));
                }
                return resp;
            })
            .catch(() => caches.match(req).then(r => r || caches.match('./investimentos.html')))
    );
});
