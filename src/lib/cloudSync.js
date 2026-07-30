import { supabase, isSupabaseConfigured } from './supabaseClient'

// Multi-device sync, kept deliberately simple: one JSON blob per user in
// `cadence_data` (RLS-scoped to auth.uid()), not a normalized schema. On
// sign-in, if this browser has no local data yet, pull the cloud copy down
// (first sync on a new device). After that, every local change is pushed
// up (debounced) so the next device to sign in sees it. This is "last
// write wins" rather than a true merge — fine for a single person using a
// couple of their own devices, which is the actual use case here.

export async function pullCloudData(userId) {
  if (!isSupabaseConfigured || !userId) return null
  const { data, error } = await supabase.from('cadence_data').select('data').eq('user_id', userId).maybeSingle()
  if (error || !data) return null
  return data.data
}

let pushTimer = null
export function pushCloudDataDebounced(userId, payload, delayMs = 1500) {
  if (!isSupabaseConfigured || !userId) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    supabase
      .from('cadence_data')
      .upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.warn('Cadence cloud sync failed:', error.message)
      })
  }, delayMs)
}
