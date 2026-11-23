
const CACHE_NAME = "hitung-barang-v1.0.44";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./pengumuman.js",
  "./manifest.json",
  "./og-pw-hb-toko.png",
  "./icons/icon-48.png",
  "./icons/icon-96.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Memasang Service Worker dan menyimpan file aplikasi
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// Mengaktifkan Service Worker dan membersihkan cache versi lama
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

// Mengambil file dari cache ketika tersedia

self.addEventListener("fetch", event => {

  const url = new URL(event.request.url);

  // Hanya menangani file dari website aplikasi ini
  if (url.origin !== self.location.origin) return;

  // Menangani file backup yang dibagikan ke HB Toko
  if (
    event.request.method === "POST" &&
    url.searchParams.has("terimaBackup")
  ) {

    event.respondWith(
      (async () => {

        const formData = await event.request.formData();

        const file = formData.get("file");

        if (!file) {
          return Response.redirect(
            "./index.html?backupGagal=1",
            303
          );
        }

        // Simpan file sementara di Cache Storage
        const cache = await caches.open(CACHE_NAME);
        
        const alamatFile = new URL(
          "./file-backup-masuk",
          self.registration.scope
        );
        
        await cache.put(
          alamatFile,
          new Response(file, {
            headers: {
              "Content-Type": file.type || "text/plain",
              "X-File-Name": file.name
            }
          })
        );
        
        // Arahkan ke halaman HB Toko
        const alamatHalaman = new URL(
          "./index.html?backupMasuk=1",
          self.registration.scope
        );
        
        return Response.redirect(alamatHalaman.href, 303);

      })()
    );

    return;
  }

  // Permintaan selain GET tidak ditangani
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {

      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {

        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }

      });

    })
  );

});
