import { supabase, isSupabaseConfigured } from './supabaseClient'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

// Registers the service worker (if needed), subscribes to Web Push, and
// saves the subscription server-side so the send-due-reminders Edge
// Function can deliver notifications even with every tab closed. Silently
// no-ops if push isn't supported or Supabase isn't configured — the
// in-tab reminder (Notification API, already wired up) still works either
// way.
export async function enablePushNotifications(userId) {
  if (!isSupabaseConfigured || !userId) return { ok: false }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { ok: false }
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) return { ok: false }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  }

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: 'endpoint' }
  )
  return { ok: !error }
}

export async function disablePushNotifications() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) {
    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    if (isSupabaseConfigured) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    }
  }
}
