import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()

// Injected at build time by vite-plugin-pwa (injectManifest strategy) with
// the list of files to precache for offline support.
precacheAndRoute(self.__WB_MANIFEST)

// Real push notifications: shown even when Cadence isn't open in any tab.
// The payload comes from the send-due-reminders Edge Function.
self.addEventListener('push', (event) => {
  let payload = { title: 'Cadence', body: 'You have chapters due.' }
  try {
    if (event.data) payload = event.data.json()
  } catch {
    // fall back to the default payload above
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'cadence-due-reminder',
    })
  )
})

// Clicking the notification focuses an existing Cadence tab if one is open,
// or opens a new one straight to the dashboard.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes('/app'))
      if (existing) return existing.focus()
      return self.clients.openWindow('/app')
    })
  )
})
