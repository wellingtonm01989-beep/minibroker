// Service worker: guarda os arquivos do jogo para ele abrir mesmo sem internet.
// Com internet, busca sempre a versão mais nova (e atualiza a cópia guardada); sem internet, usa a cópia.
// Ao mudar a lista de arquivos, troque a versão para apagar a cópia antiga.
const CACHE = 'minibroker-v2';
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
    e.waitUntil(caches.open(CACHE)
        .then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: 'reload' }))))
        .then(() => self.skipWaiting()));
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
    // cache: 'no-cache' confere com o servidor se o arquivo mudou. Sem isso o navegador pode usar uma cópia
    // de até 10 minutos e misturar a página nova com o app.js antigo (os botões aparecem, mas não funcionam).
    // Uma navegação (abrir a página) não pode ser copiada com opções, por isso vai pelo endereço.
    const rede = req.mode === 'navigate' ? fetch(req.url, { cache: 'no-cache' }) : fetch(req, { cache: 'no-cache' });
    e.respondWith(
        rede
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
