// Kapas Hisaab service worker: app offline bhi khulti hai
const V = "kapas-v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "firebase-config.js", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function keep(r, res) {
  if (res && (res.ok || res.type === "opaque")) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
  return res;
}
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.pathname.startsWith("/__/") || u.hostname.endsWith("googleapis.com") || u.hostname.endsWith("google.com") || u.hostname.endsWith("firebaseio.com")) return;
  if (u.origin === location.origin) {
    // apni files: pehle internet, na ho to saved copy
    e.respondWith(fetch(r).then(res => keep(r, res)).catch(() => caches.match(r).then(m => m || caches.match("index.html"))));
  } else if (u.hostname === "www.gstatic.com" || u.hostname === "cdnjs.cloudflare.com") {
    // Firebase aur PDF libraries: ek dafa download, phir saved copy
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => keep(r, res))));
  }
});
