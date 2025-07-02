// Nome do cache
const CACHE_NAME = 'site-cache-v1'
const FILES_TO_CACHE = ['/converter/', '/converter/index.html', '/converter/version.txt']

// Função auxiliar para buscar o version.txt do servidor
async function fetchServerVersion() {
  try {
    const response = await fetch('/converter/version.txt', { cache: 'no-store' })
    if (response.ok) {
      return response.text()
    }
  } catch (e) {
    // Sem conexão ou erro na requisição
  }
  return null
}

// Função auxiliar para pegar a versão do cache
async function getCachedVersion() {
  const cache = await caches.open(CACHE_NAME)
  const response = await cache.match('/converter/version.txt')
  if (response) {
    return response.text()
  }
  return null
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim())
})

self.addEventListener('fetch', event => {
  event.respondWith(
    (async () => {
      // Somente para GET
      if (event.request.method !== 'GET') {
        return fetch(event.request)
      }

      const cachedResponse = await caches.match(event.request)

      // Checa versão apenas para requisição da página principal
      if (event.request.url.endsWith('/') || event.request.url.endsWith('index.html')) {
        const serverVersion = await fetchServerVersion()
        const cachedVersion = await getCachedVersion()

        if (serverVersion && cachedVersion && serverVersion.trim() !== cachedVersion.trim()) {
          // Versão diferente, limpa cache e atualiza
          const cache = await caches.open(CACHE_NAME)
          await cache.addAll(FILES_TO_CACHE)
          console.log('Nova versão detectada, cache atualizado.')
          return fetch(event.request)
        }
      }

      // Caso sem conexão ou versões iguais, usa o cache
      return cachedResponse || fetch(event.request).catch(() => cachedResponse)
    })(),
  )
})
