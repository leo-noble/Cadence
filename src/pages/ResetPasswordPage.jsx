import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../lib/useAuth'
import { isSupabaseConfigured } from '../lib/supabaseClient'

// Supabase's password-reset email links here with a recovery token in the
// URL hash. detectSessionInUrl (set on the client) turns that into a
// short-lived session automatically, so by the time this page mounts
// updatePassword() can just be called directly — no token handling needed.
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords don\u2019t match.')
      return
    }
    setSubmitting(true)
    try {
      const { error: updateError } = await updatePassword(password)
      if (updateError) {
        setError(updateError.message || 'Could not update your password. The link may have expired \u2014 request a new one.')
        return
      }
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-8">
          <Logo size={32} />
        </div>

        <div className="rounded-card bg-surface border border-divider shadow-sheet p-7">
          {!isSupabaseConfigured ? (
            <p className="text-[14px] text-ink-soft text-center leading-relaxed">
              This app needs a Supabase project connected before passwords can be reset.
            </p>
          ) : done ? (
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                  <CheckCircle2 size={22} />
                </div>
              </div>
              <h1 className="font-display text-[20px] font-bold text-ink tracking-tight mb-1.5">Password updated</h1>
              <p className="text-[14px] text-ink-soft leading-relaxed mb-5">
                You&rsquo;re all set. Head back to the app and sign in with your new password.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="text-[14px] font-medium text-brand"
              >
                Go to sign in
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-[20px] font-bold text-ink tracking-tight mb-1.5 text-center">
                Set a new password
              </h1>
              <p className="text-[14px] text-ink-soft text-center mb-6">
                Choose something you haven&rsquo;t used before.
              </p>

              <form onSubmit={handleSubmit}>
                <label className="block text-[13px] font-medium text-ink-soft mb-1.5 uppercase tracking-wide">New password</label>
                <input
                  autoFocus
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  minLength={6}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mb-4 rounded-control border border-divider bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
                />

                <label className="block text-[13px] font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Confirm password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  minLength={6}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mb-2 rounded-control border border-divider bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                <p className="text-[12px] text-ink-soft mb-4">At least 6 characters.</p>

                {error && (
                  <div className="flex items-start gap-2 mb-4 mt-1 text-[13px] text-status-overdue">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <motion.button
                  whileTap={password && confirm ? { scale: 0.97 } : {}}
                  type="submit"
                  disabled={!password || !confirm || submitting}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-capsule bg-brand text-white font-medium py-3 text-[15px] disabled:opacity-40 transition-opacity duration-180"
                >
                  {submitting ? 'Updating…' : 'Update password'}
                  {!submitting && <ArrowRight size={16} />}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
