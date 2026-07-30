// Offline-first local persistence for Cadence.
// Everything lives in localStorage as JSON — no network required.
// Shape mirrors the data model in the blueprint (Subject / Chapter / ReviewEvent),
// using camelCase JS keys internally.

import { toISODate, nextReviewDateForIndex, MAX_REVIEW_INDEX } from './srs'

const KEYS = {
  subjects: 'cadence.subjects',
  chapters: 'cadence.chapters',
  events: 'cadence.events',
  prefs: 'cadence.prefs',
  streak: 'cadence.streak',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export const DEFAULT_PREFS = {
  theme: 'slate', // slate | aurora | forest — pick a family, then a mode
  themeMode: 'light', // light | dark — independent of the theme family
  notificationsEnabled: false,
  notificationTime: '09:00',
  onboarded: false,
  pomodoroWork: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroAutoTransition: false,
  pomodoroSound: true,
}

export const SUBJECT_COLORS = [
  '#1B181C', '#7A2E3A', '#A5342A', '#8B8B85', '#4A4448', '#726D70',
]

// ---------- Subjects ----------
export function getSubjects() {
  return read(KEYS.subjects, [])
}
export function saveSubjects(subjects) {
  write(KEYS.subjects, subjects)
}
export function addSubject({ name, colorTag }) {
  const subjects = getSubjects()
  const subject = { id: uid(), name, colorTag: colorTag || SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length], createdAt: new Date().toISOString() }
  saveSubjects([...subjects, subject])
  return subject
}
export function deleteSubject(subjectId) {
  saveSubjects(getSubjects().filter((s) => s.id !== subjectId))
  saveChapters(getChapters().filter((c) => c.subjectId !== subjectId))
}

// ---------- Chapters ----------
export function getChapters() {
  return read(KEYS.chapters, [])
}
export function saveChapters(chapters) {
  write(KEYS.chapters, chapters)
}
export function getChapter(id) {
  return getChapters().find((c) => c.id === id) || null
}
export function upsertChapter(chapter) {
  const chapters = getChapters()
  const idx = chapters.findIndex((c) => c.id === chapter.id)
  if (idx === -1) {
    saveChapters([...chapters, chapter])
  } else {
    const next = [...chapters]
    next[idx] = chapter
    saveChapters(next)
  }
  return chapter
}
export function deleteChapter(id) {
  saveChapters(getChapters().filter((c) => c.id !== id))
  saveEvents(getEvents().filter((e) => e.chapterId !== id))
}

// ---------- Review Events ----------
export function getEvents() {
  return read(KEYS.events, [])
}
export function saveEvents(events) {
  write(KEYS.events, events)
}
export function logEvent({ chapterId, scheduledDate, action }) {
  const events = getEvents()
  const event = {
    id: uid(),
    chapterId,
    scheduledDate,
    completedDate: toISODate(new Date()),
    action, // completed | snoozed | struggled | skipped_ahead
  }
  saveEvents([...events, event])
  return event
}

// ---------- Prefs ----------
const OLD_THEME_MIGRATION = {
  linen: { theme: 'forest', themeMode: 'light' },
  fog: { theme: 'slate', themeMode: 'light' },
  graphite: { theme: 'slate', themeMode: 'dark' },
  verdant: { theme: 'forest', themeMode: 'dark' },
}

export function getPrefs() {
  const stored = read(KEYS.prefs, {})
  const migrated = OLD_THEME_MIGRATION[stored.theme]
  const merged = { ...DEFAULT_PREFS, ...stored }
  if (migrated) Object.assign(merged, migrated)
  return merged
}
export function savePrefs(prefs) {
  write(KEYS.prefs, { ...getPrefs(), ...prefs })
}

// ---------- Streak ----------
export function getStreakData() {
  return read(KEYS.streak, { count: 0, lastCompletedDay: null })
}
export function saveStreakData(data) {
  write(KEYS.streak, data)
}

// ---------- Reminder bookkeeping ----------
// Separate from prefs since it's internal housekeeping, not a user setting.
const LAST_NOTIFIED_KEY = 'cadence.lastNotifiedDate'
export function getLastNotifiedDate() {
  return read(LAST_NOTIFIED_KEY, null)
}
export function setLastNotifiedDate(dateStr) {
  write(LAST_NOTIFIED_KEY, dateStr)
}

// ---------- Pomodoro session log ----------
// One entry per calendar day: how many focus sessions were completed and
// how many minutes that adds up to. Used for the "today's stats" readout.
const POMODORO_LOG_KEY = 'cadence.pomodoroLog'
export function getPomodoroLog() {
  return read(POMODORO_LOG_KEY, {}) // { 'YYYY-MM-DD': { sessions: n, minutes: n } }
}
export function logPomodoroSession(dateStr, minutes) {
  const log = getPomodoroLog()
  const entry = log[dateStr] || { sessions: 0, minutes: 0 }
  log[dateStr] = { sessions: entry.sessions + 1, minutes: entry.minutes + minutes }
  write(POMODORO_LOG_KEY, log)
  return log[dateStr]
}

// ---------- Pomodoro timer state ----------
// Persisted so the timer survives a page refresh or a backgrounded tab.
// We never store a raw "seconds remaining" counter — that drifts the
// moment a tab is throttled in the background. Instead we store the
// wall-clock instant the current phase is due to end (`endAt`) while
// running, or the frozen remaining duration (`remainingMs`) while paused
// or idle. Every read derives the displayed time from `Date.now()`
// against `endAt`, so it's always correct regardless of how long the tab
// was backgrounded or how late a timer callback fires.
const TIMER_STATE_KEY = 'cadence.pomodoroTimerState'
export function getTimerState() {
  return read(TIMER_STATE_KEY, null)
}
export function saveTimerState(state) {
  write(TIMER_STATE_KEY, state)
}
export function clearTimerState() {
  localStorage.removeItem(TIMER_STATE_KEY)
}

// ---------- Backup / restore ----------
// Builds a standard .ics calendar (one all-day VEVENT per active chapter's
// next review date) so review dates can be imported into Google/Apple/
// Outlook calendars. Mastered chapters have no nextReviewDate and are
// skipped.
export function exportChaptersToICS() {
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  const dateOnly = (iso) => iso.replace(/-/g, '')
  const subjects = new Map(getSubjects().map((s) => [s.id, s]))
  const chapters = getChapters().filter((c) => c.nextReviewDate)
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cadence//Study Reminders//EN', 'CALSCALE:GREGORIAN']
  chapters.forEach((c) => {
    const subjectName = subjects.get(c.subjectId)?.name || 'Cadence'
    lines.push(
      'BEGIN:VEVENT',
      `UID:${c.id}@cadence.app`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART;VALUE=DATE:${dateOnly(c.nextReviewDate)}`,
      `SUMMARY:Review — ${subjectName}: ${c.title}`,
      'END:VEVENT'
    )
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function exportAllData() {
  return JSON.stringify(
    {
      app: 'cadence',
      version: 1,
      exportedAt: new Date().toISOString(),
      subjects: getSubjects(),
      chapters: getChapters(),
      events: getEvents(),
      prefs: getPrefs(),
      streak: getStreakData(),
    },
    null,
    2
  )
}

export function importAllData(jsonString) {
  let data
  try {
    data = JSON.parse(jsonString)
  } catch {
    return { ok: false, error: 'That file isn\u2019t valid JSON.' }
  }
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Unrecognized backup file.' }
  }
  if (Array.isArray(data.subjects)) saveSubjects(data.subjects)
  if (Array.isArray(data.chapters)) saveChapters(data.chapters)
  if (Array.isArray(data.events)) saveEvents(data.events)
  if (data.prefs && typeof data.prefs === 'object') savePrefs(data.prefs)
  if (data.streak && typeof data.streak === 'object') saveStreakData(data.streak)
  return { ok: true }
}

// Wipes every trace of Cadence from this browser, including the profile —
// used by Settings > Delete all data. Irreversible; the caller is
// responsible for confirming with the user first.
export function deleteAllData() {
  localStorage.removeItem(KEYS.subjects)
  localStorage.removeItem(KEYS.chapters)
  localStorage.removeItem(KEYS.events)
  localStorage.removeItem(KEYS.prefs)
  localStorage.removeItem(KEYS.streak)
}

// ---------- Schedule migration ----------
// The review cadence changed from a 7-step schedule to the current
// 4-step one (+1 / +3 / +7 / +30 days from the studied date). Existing
// chapters keep their studiedDate and their count of completed reviews
// (currentReviewIndex) — only nextReviewDate is recalculated against the
// new intervals, so nobody loses progress they'd already made. A chapter
// that had already completed 4+ reviews under the old schedule is now
// past every step of the new one, so it's considered fully mastered.
// Runs once per browser, guarded by a flag so it never re-applies.
const SCHEDULE_MIGRATION_KEY = 'cadence.scheduleMigrationV2'

export function migrateScheduleIfNeeded() {
  try {
    if (localStorage.getItem(SCHEDULE_MIGRATION_KEY) === '1') return
    const chapters = getChapters()
    const migrated = chapters.map((c) => {
      if (c.status === 'mastered') return c
      if (typeof c.currentReviewIndex !== 'number') return c
      if (c.currentReviewIndex >= MAX_REVIEW_INDEX) {
        return { ...c, currentReviewIndex: MAX_REVIEW_INDEX, nextReviewDate: null, status: 'mastered' }
      }
      return { ...c, nextReviewDate: nextReviewDateForIndex(c.studiedDate, c.currentReviewIndex) }
    })
    saveChapters(migrated)
    localStorage.setItem(SCHEDULE_MIGRATION_KEY, '1')
  } catch {
    // best-effort — never block app load on a migration failure
  }
}

export { uid }
