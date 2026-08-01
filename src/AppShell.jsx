import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import Nav from './components/Nav'
import AddChapterSheet from './components/AddChapterSheet'
import ChapterDetailSheet from './components/ChapterDetailSheet'
import Dashboard from './pages/Dashboard'
import LibraryPage from './pages/LibraryPage'
import CalendarPage from './pages/CalendarPage'
import FocusPage from './pages/FocusPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import { useCadence } from './lib/useCadence'
import { useAuth } from './lib/useAuth'
import { getLastNotifiedDate, setLastNotifiedDate } from './lib/storage'
import { toISODate } from './lib/srs'

const SIDEBAR_KEY = 'cadence.sidebarCollapsed'

export default function AppShell() {
  const navigate = useNavigate()
  const { user, displayName, signOut } = useAuth()
  const cadence = useCadence(user?.id)
  const [tab, setTab] = useState('today')
  const [showAdd, setShowAdd] = useState(false)
  const [openChapterId, setOpenChapterId] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1')
  const profile = user ? { name: displayName, email: user.email } : null

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0')
      return next
    })
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  // Theme: a family — 'slate' | 'aurora' | 'forest' — plus an independent
  // 'light' | 'dark' mode, applied as two data attributes that every CSS
  // variable in index.css keys off of.
  useEffect(() => {
    document.documentElement.dataset.theme = cadence.prefs.theme || 'slate'
  }, [cadence.prefs.theme])

  useEffect(() => {
    const mode = cadence.prefs.themeMode || 'light'
    if (mode !== 'system') {
      document.documentElement.dataset.mode = mode
      return
    }
    // 'system' follows the OS preference live — no reload needed if the
    // user flips their OS's light/dark switch mid-session.
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => { document.documentElement.dataset.mode = mq.matches ? 'dark' : 'light' }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [cadence.prefs.themeMode])

  // Keep the stored preference honest: if the user granted permission once
  // but later revoked it from the browser's own site settings (outside this
  // app entirely), prefs.notificationsEnabled would otherwise keep showing
  // "on" forever with no way to notice. Re-check on every mount/focus.
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    function sync() {
      const actuallyGranted = Notification.permission === 'granted'
      if (cadence.prefs.notificationsEnabled && !actuallyGranted) {
        cadence.updatePrefs({ notificationsEnabled: false })
      }
    }
    sync()
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cadence.prefs.notificationsEnabled])

  // Mastery celebration — auto-dismiss
  useEffect(() => {
    if (!cadence.justMastered) return
    const t = setTimeout(() => cadence.clearJustMastered(), 2400)
    return () => clearTimeout(t)
  }, [cadence.justMastered, cadence])

  // Best-effort daily reminder: this only fires while the app/tab is
  // actually open in a browser — it checks once a minute whether we've
  // passed the configured time today and there's still something due, and
  // fires a local Notification at most once a day.
  useEffect(() => {
    if (!cadence.prefs.notificationsEnabled) return
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return

    function checkAndNotify() {
      const now = new Date()
      const today = toISODate(now)
      if (getLastNotifiedDate() === today) return
      const [h, m] = (cadence.prefs.notificationTime || '09:00').split(':').map(Number)
      const dueAt = new Date(now)
      dueAt.setHours(h || 0, m || 0, 0, 0)
      if (now < dueAt) return
      const count = cadence.overdue.length + cadence.dueToday.length
      if (count === 0) return
      setLastNotifiedDate(today)
      new Notification('Cadence', { body: `${count} chapter${count === 1 ? '' : 's'} due today.` })
    }

    checkAndNotify()
    const id = setInterval(checkAndNotify, 60000)
    return () => clearInterval(id)
  }, [cadence.prefs.notificationsEnabled, cadence.prefs.notificationTime, cadence.overdue, cadence.dueToday])

  const openChapter = openChapterId ? cadence.chapters.find((c) => c.id === openChapterId) : null

  return (
    <div className="flex bg-paper min-h-screen">
      <Nav active={tab} onChange={setTab} profile={profile} onSignOut={handleSignOut} collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} />

      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === 'today' && (
              <Dashboard cadence={cadence} profile={profile} onOpenChapter={(c) => setOpenChapterId(c.id)} onAddChapter={() => setShowAdd(true)} />
            )}
            {tab === 'library' && (
              <LibraryPage cadence={cadence} onOpenChapter={(c) => setOpenChapterId(c.id)} onAddChapter={() => setShowAdd(true)} />
            )}
            {tab === 'calendar' && <CalendarPage cadence={cadence} onOpenChapter={(c) => setOpenChapterId(c.id)} />}
            {tab === 'focus' && <FocusPage cadence={cadence} />}
            {tab === 'stats' && <StatsPage cadence={cadence} />}
            {tab === 'settings' && <SettingsPage cadence={cadence} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating quick-capture button. */}
      {tab !== 'settings' && tab !== 'focus' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => setShowAdd(true)}
          className="fixed right-5 bottom-[5.5rem] md:bottom-8 md:right-8 z-20 p-4 rounded-full bg-brand text-white shadow-fab"
          aria-label="Add chapter"
        >
          <Plus size={22} />
        </motion.button>
      )}

      <AnimatePresence>
        {showAdd && (
          <AddChapterSheet
            key="add-chapter"
            subjects={cadence.subjects}
            onClose={() => setShowAdd(false)}
            onCreateSubject={cadence.createSubject}
            onCreateChapter={cadence.createChapter}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openChapter && (
          <ChapterDetailSheet
            key="chapter-detail"
            chapter={openChapter}
            subject={cadence.subjectMap.get(openChapter.subjectId)}
            onClose={() => setOpenChapterId(null)}
            onRevise={cadence.reviseChapter}
            onSnooze={cadence.snoozeChapterAction}
            onStruggle={cadence.struggleChapterAction}
            onMasterEarly={cadence.masterEarlyAction}
            onRename={cadence.renameChapter}
            onDelete={cadence.removeChapter}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cadence.justMastered && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed inset-x-0 top-6 z-[60] flex justify-center pointer-events-none px-4"
          >
            <div className="pointer-events-auto flex items-center gap-2.5 rounded-capsule bg-status-mastered text-white px-5 py-3 shadow-fab">
              <span className="font-display font-medium text-[15px]">You've fully retained this chapter. Nice work.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
