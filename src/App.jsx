import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AppShell from './AppShell'
import { getPrefs } from './lib/storage'
import { useAuth } from './lib/useAuth'

function FadeIn({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Gates /app behind a real Supabase session. `loading` covers the brief
// check for an existing session on first load — render nothing rather
// than flash the login page for a moment before redirecting away from it.
function RequireAuth({ children }) {
  const location = useLocation()
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) {
    // The return path travels as a search param, not router state. `Navigate`
    // lists `state` in its effect deps, so a freshly-built `{ from }` object
    // re-fires the redirect on every render — and because AnimatePresence
    // keeps this subtree mounted through its exit animation, that becomes an
    // infinite navigate → render → navigate loop. A string `to` is stable.
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }
  return children
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<FadeIn><LandingPage /></FadeIn>} />
        <Route path="/login" element={<FadeIn><LoginPage /></FadeIn>} />
        <Route path="/reset-password" element={<FadeIn><ResetPasswordPage /></FadeIn>} />
        <Route
          path="/app"
          element={
            <FadeIn>
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            </FadeIn>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  // Applies light/dark/auto theme globally, on both the landing page and the app.
  useEffect(() => {
    const root = document.documentElement
    function apply() {
      const { theme } = getPrefs()
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isDark = theme === 'dark' || (theme === 'auto' && prefersDark)
      root.classList.toggle('dark', isDark)
    }
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    window.addEventListener('storage', apply)
    return () => {
      mq.removeEventListener('change', apply)
      window.removeEventListener('storage', apply)
    }
  }, [])

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
