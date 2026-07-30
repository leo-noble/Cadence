import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Download, Upload, Trash2, AlertTriangle, BarChart3, Check, BellRing, Sun, Moon, Monitor, CalendarDays } from 'lucide-react'
import { exportAllData, importAllData, deleteAllData, exportChaptersToICS } from '../lib/storage'
import { useAuth } from '../lib/useAuth'
import { enablePushNotifications, disablePushNotifications } from '../lib/push'
import PageHeader from '../components/PageHeader'
import SegmentedControl from '../components/SegmentedControl'

// Preview swatches for the theme picker — the only place these literal hex
// values live outside index.css, since a card previewing "Forest" has to
// show Forest's colors even while a different theme is active. Each family
// carries its own handcrafted light AND dark swatch, since the preview
// should reflect whichever mode is currently selected, not just light.
const THEMES = [
  {
    id: 'slate',
    name: 'Slate',
    blurb: 'Clean, neutral, professional',
    light: { paper: '#F3F4F6', surface: '#FFFFFF', accent: '#3F5872', ink: '#1C2027' },
    dark: { paper: '#101216', surface: '#191C21', accent: '#7FA1C4', ink: '#E7E9EC' },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    blurb: 'Elegant, with a quiet multi-color glow',
    light: {
      paper: '#F7F5FA',
      surface: '#FFFFFF',
      accent: '#6C5CC2',
      ink: '#201D29',
      gradient: 'linear-gradient(135deg, #2FA893, #6C5CC2, #D9A441)',
    },
    dark: {
      paper: '#0E0D14',
      surface: '#17151F',
      accent: '#9484E8',
      ink: '#F0EEF5',
      gradient: 'linear-gradient(135deg, #3FC8AF, #9484E8, #E0B05A)',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    blurb: 'Emerald, olive, and sandstone',
    light: { paper: '#F3F1E6', surface: '#FDFCF6', accent: '#3F6B4A', ink: '#23271E' },
    dark: { paper: '#11140E', surface: '#191C13', accent: '#74B382', ink: '#EAE7D9' },
  },
]

function GroupHeader({ children }) {
  return <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft mb-2 px-1">{children}</h2>
}

function GroupFooter({ children }) {
  return <p className="text-[13px] text-ink-soft mt-2 px-1 leading-relaxed">{children}</p>
}

function Group({ children }) {
  return (
    <div className="rounded-card bg-surface border border-divider divide-y divide-divider overflow-hidden shadow-elevated">
      {children}
    </div>
  )
}

function Row({ children, onClick, className = '' }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
        onClick ? 'hover:bg-paper active:bg-paper transition-colors duration-150' : ''
      } ${className}`}
    >
      {children}
    </Comp>
  )
}

function RowIcon({ icon: Icon, tone = 'brand' }) {
  const toneClasses = tone === 'danger' ? 'bg-status-overdue/10 text-status-overdue' : 'bg-brand/10 text-brand'
  return (
    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${toneClasses}`}>
      <Icon size={16} />
    </div>
  )
}

function Switch({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-[51px] h-[31px] rounded-full overflow-hidden transition-colors duration-180 shrink-0 ${
        on ? 'bg-brand' : 'bg-divider'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-[27px] w-[27px] rounded-full bg-white shadow transition-transform duration-180 ${
          on ? 'translate-x-[20px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function SettingsPage({ cadence }) {
  const { prefs, updatePrefs, refreshAll, subjects, chapters, events } = cadence
  const navigate = useNavigate()
  const { user, displayName, signOut } = useAuth()
  const [message, setMessage] = useState('')
  const [dataMessage, setDataMessage] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const fileInputRef = useRef(null)
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isStandalone = typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches
  const profile = user ? { name: displayName, email: user.email } : null

  const completedReviews = events.filter((e) => e.action === 'completed').length

  function flash(setter, text, ms = 3000) {
    setter(text)
    setTimeout(() => setter(''), ms)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  async function handleNotificationToggle() {
    if (!('Notification' in window)) {
      flash(setMessage, 'Notifications aren\u2019t supported in this browser.')
      return
    }
    if (prefs.notificationsEnabled) {
      updatePrefs({ notificationsEnabled: false })
      disablePushNotifications()
      return
    }
    if (Notification.permission === 'denied') {
      flash(setMessage, 'Notifications are blocked for this site \u2014 enable them in your browser\u2019s site settings, then try again.', 4500)
      return
    }
    try {
      const perm = await Notification.requestPermission()
      updatePrefs({ notificationsEnabled: perm === 'granted' })
      if (perm === 'granted') {
        new Notification('Cadence', { body: 'Reminders are on \u2014 you\u2019ll hear from us here when something\u2019s due.' })
        enablePushNotifications(user?.id)
      } else {
        flash(setMessage, 'Permission was not granted.')
      }
    } catch {
      flash(setMessage, 'Couldn\u2019t request notification permission in this browser.')
    }
  }

  function handleTestNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    new Notification('Cadence', { body: 'This is a test \u2014 if you can see it, reminders are working.' })
    flash(setMessage, 'Test notification sent.')
  }

  function handleExport() {
    const json = exportAllData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cadence-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    flash(setDataMessage, 'Backup downloaded.')
  }

  function handleExportICS() {
    const ics = exportChaptersToICS()
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cadence-reviews.ics'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    flash(setDataMessage, 'Calendar file downloaded — import it into Google/Apple/Outlook Calendar.')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = importAllData(String(reader.result))
      if (result.ok) {
        refreshAll()
        flash(setDataMessage, 'Backup restored.')
      } else {
        flash(setDataMessage, result.error || 'Couldn\u2019t read that backup file.', 4000)
      }
    }
    reader.onerror = () => flash(setDataMessage, 'Couldn\u2019t read that file.')
    reader.readAsText(file)
  }

  function handleDeleteAll() {
    deleteAllData()
    refreshAll()
    setConfirmingDelete(false)
    navigate('/app', { replace: true })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-10">
      <PageHeader eyebrow="Your account" title="Settings" />

      {profile?.name && (
        <div className="mb-6">
          <Group>
            <Row>
              <div className="h-11 w-11 rounded-full bg-brand/10 text-brand flex items-center justify-center text-base font-semibold shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-medium text-ink truncate">{profile.name}</p>
                {profile.email && <p className="text-[13px] text-ink-soft truncate">{profile.email}</p>}
              </div>
            </Row>
          </Group>
        </div>
      )}

      <div className="mb-6">
        <GroupHeader>Theme</GroupHeader>
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          {THEMES.map((t) => {
            const active = prefs.theme === t.id
            const resolvedMode = prefs.themeMode === 'system'
              ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
              : prefs.themeMode
            const swatch = resolvedMode === 'dark' ? t.dark : t.light
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => updatePrefs({ theme: t.id })}
                className={`relative rounded-card border p-2.5 text-left transition-all duration-180 ${
                  active ? 'border-brand shadow-elevated' : 'border-divider hover:border-ink-soft/40'
                }`}
                style={{ backgroundColor: swatch.surface }}
              >
                {active && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-brand flex items-center justify-center">
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <div
                  className="h-9 rounded-control mb-2 overflow-hidden"
                  style={{ background: swatch.gradient || swatch.paper }}
                >
                  <div className="h-2 w-8 rounded-full mt-1.5 ml-1.5" style={{ backgroundColor: swatch.accent }} />
                </div>
                <p className="text-[13px] font-medium leading-tight" style={{ color: swatch.ink }}>
                  {t.name}
                </p>
                <p className="text-[10.5px] leading-tight mt-0.5 opacity-70" style={{ color: swatch.ink }}>
                  {t.blurb}
                </p>
              </button>
            )
          })}
        </div>
        <SegmentedControl
          layoutId="theme-mode-segment"
          value={prefs.themeMode}
          onChange={(mode) => updatePrefs({ themeMode: mode })}
          options={[
            { id: 'light', label: (<span className="flex items-center gap-1.5"><Sun size={13} /> Light</span>) },
            { id: 'dark', label: (<span className="flex items-center gap-1.5"><Moon size={13} /> Dark</span>) },
            { id: 'system', label: (<span className="flex items-center gap-1.5"><Monitor size={13} /> System</span>) },
          ]}
        />
      </div>

      <div className="mb-6">
        <GroupHeader>Notifications</GroupHeader>
        <Group>
          <Row className="justify-between">
            <span className="flex items-center gap-3 text-[15px] text-ink">
              <RowIcon icon={Bell} /> Daily due-today reminder
            </span>
            <Switch on={prefs.notificationsEnabled} onToggle={handleNotificationToggle} />
          </Row>
          {prefs.notificationsEnabled && (
            <Row className="justify-between">
              <span className="text-[15px] text-ink pl-12">Remind me at</span>
              <input
                type="time"
                value={prefs.notificationTime || '09:00'}
                onChange={(e) => updatePrefs({ notificationTime: e.target.value })}
                className="bg-paper text-ink text-[14px] font-tabular rounded-control border border-divider px-2.5 py-1.5 focus:outline-none focus:border-brand"
              />
            </Row>
          )}
          {prefs.notificationsEnabled && (
            <Row onClick={handleTestNotification}>
              <RowIcon icon={BellRing} />
              <span className="text-[15px] text-ink">Send a test notification</span>
            </Row>
          )}
        </Group>
        <GroupFooter>
          {message
            ? message
            : <>
                {isIOS && !isStandalone && "On iPhone, add Cadence to your Home Screen first — that's what lets reminders work reliably on iOS. "}
                This fires while Cadence is open in a browser tab. Your Dashboard count is always accurate regardless of whether a reminder happened to fire.
              </>}
        </GroupFooter>
      </div>

      <div className="mb-6">
        <GroupHeader>Your progress</GroupHeader>
        <Group>
          <Row>
            <RowIcon icon={BarChart3} />
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-display text-lg font-semibold text-ink font-tabular leading-none">{subjects.length}</p>
                <p className="text-[11px] text-ink-soft mt-1">subjects</p>
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-ink font-tabular leading-none">{chapters.length}</p>
                <p className="text-[11px] text-ink-soft mt-1">chapters</p>
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-ink font-tabular leading-none">{completedReviews}</p>
                <p className="text-[11px] text-ink-soft mt-1">reviews done</p>
              </div>
            </div>
          </Row>
        </Group>
      </div>

      <div className="mb-6">
        <GroupHeader>Your data</GroupHeader>
        <Group>
          <Row onClick={handleExportICS}>
            <RowIcon icon={CalendarDays} />
            <span className="text-[15px] text-ink">Export calendar (.ics)</span>
          </Row>
          <Row onClick={handleExport}>
            <RowIcon icon={Download} />
            <span className="text-[15px] text-ink">Export backup</span>
          </Row>
          <Row onClick={handleImportClick}>
            <RowIcon icon={Upload} />
            <span className="text-[15px] text-ink">Import backup</span>
          </Row>
        </Group>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        <GroupFooter>
          {dataMessage || 'Your data syncs to your account automatically, so signing in on another device picks up right where you left off. Export a backup anytime as extra insurance.'}
        </GroupFooter>
      </div>

      <div className="mb-6">
        <GroupHeader>Danger zone</GroupHeader>
        <Group>
          {!confirmingDelete ? (
            <Row onClick={() => setConfirmingDelete(true)} className="justify-center">
              <RowIcon icon={Trash2} tone="danger" />
              <span className="text-[15px] font-medium text-status-overdue">Delete all data</span>
            </Row>
          ) : (
            <div className="px-4 py-4">
              <div className="flex items-start gap-2.5 mb-3.5">
                <AlertTriangle size={16} className="text-status-overdue shrink-0 mt-0.5" />
                <p className="text-[13.5px] text-ink leading-relaxed">
                  This permanently deletes every subject, chapter, and review on this device. Export a backup first if you want to keep it.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 rounded-capsule border border-divider text-[14px] font-medium py-2 hover:bg-paper transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  className="flex-1 rounded-capsule bg-status-overdue text-white text-[14px] font-medium py-2 hover:brightness-110 transition-[filter] duration-150"
                >
                  Yes, delete everything
                </button>
              </div>
            </div>
          )}
        </Group>
      </div>

      {profile?.name && (
        <div className="mb-6">
          <Group>
            <Row onClick={handleSignOut} className="justify-center">
              <RowIcon icon={LogOut} tone="danger" />
              <span className="text-[15px] font-medium text-status-overdue">Sign Out</span>
            </Row>
          </Group>
        </div>
      )}

      <p className="text-[13px] text-ink-soft text-center mt-10">Cadence — study in rhythm.</p>
    </div>
  )
}
