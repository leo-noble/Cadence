// Offline-first local persistence for Cadence.
// Everything lives in localStorage as JSON — no network required.
// Shape mirrors the data model in the blueprint (Subject / Chapter / ReviewEvent),
// using camelCase JS keys internally.

import { toISODate, addDays, daysBetween, nextReviewDateForIndex, MAX_REVIEW_INDEX } from './srs'

const KEYS = {
  subjects: 'cadence.subjects',
  chapters: 'cadence.chapters',
  events: 'cadence.events',
  prefs: 'cadence.prefs',
  streak: 'cadence.streak',
  plans: 'cadence.studyPlans', // now stores blocks, not date-range plans
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
  const removedIds = new Set(getChapters().filter((c) => c.subjectId === subjectId).map((c) => c.id))
  saveChapters(getChapters().filter((c) => c.subjectId !== subjectId))
  saveStudyBlocks(pruneChapterRefs(getStudyBlocks(), (id) => removedIds.has(id)))
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
  saveStudyBlocks(pruneChapterRefs(getStudyBlocks(), (cid) => cid === id))
}

/**
 * Cascade-delete for blocks: drop the dead chapter ids from every block, then
 * remove only the blocks left holding none. Filtering whole blocks out instead
 * would destroy a three-chapter sitting because one of its chapters was
 * deleted — the other two are still something the user planned to do.
 */
function pruneChapterRefs(blocks, isRemoved) {
  return blocks
    .map((b) => ({ ...b, chapterIds: b.chapterIds.filter((cid) => !isRemoved(cid)) }))
    .filter((b) => b.chapterIds.length > 0)
}

// ---------- Study blocks ----------
// A block is one or more chapters booked on one specific day, optionally at a
// specific time. Several chapters per block because one sitting is often spent
// across two or three of them, and splitting that into separate blocks would
// mean three overlapping rectangles for what the user thinks of as one session.
// Timed blocks carry startMinute/endMinute as minutes from
// local midnight — never a timestamp, so a block at 9am stays at 9am if
// the device changes timezone. Untimed blocks leave both null and live in
// the all-day strip.
//
// A session spread across several days is stored as one block per day,
// sharing a seriesId. That keeps completion independent per sitting, and
// it means dragging Wednesday's block to Friday moves only that day —
// while still allowing "edit the whole series" as a deliberate choice.
//
// Distinct from review events: a block is something the user decided to
// do; a review is something the schedule asked for.
export function getStudyBlocks() {
  return normalizeBlocks(read(KEYS.plans, []))
}
export function saveStudyBlocks(blocks) {
  write(KEYS.plans, blocks)
}

// Every calendar date a legacy date-range plan covered, inclusive of both
// ends. The clamp guards against a corrupt or hand-edited range producing
// a runaway loop — nothing in the UI could create a span this long.
function eachLegacyDate(plan) {
  const dates = []
  const span = Math.min(Math.max(daysBetween(plan.startDate, plan.endDate || plan.startDate), 0), 366)
  for (let i = 0; i <= span; i++) dates.push(toISODate(addDays(plan.startDate, i)))
  return dates
}

/**
 * Coerces whatever is in storage into the block shape. Runs on every read
 * rather than once behind a migration flag, so a stale record synced down
 * from another device that hasn't updated yet still lands correctly — and
 * so a half-finished migration can't leave the app reading two shapes.
 *
 * Two legacy shapes are accepted: a single-`chapterId` block (wrapped into a
 * one-element `chapterIds`), and a date-range plan, which explodes into one
 * untimed block per day it covered, preserving which days were ticked off.
 */
export function normalizeBlocks(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  raw.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return
    // Single-chapter blocks predate multi-chapter ones; either shape reads.
    const chapterIds = (
      Array.isArray(entry.chapterIds) ? entry.chapterIds : [entry.chapterId]
    ).filter((id) => typeof id === 'string' && id)
    if (chapterIds.length === 0) return

    // Already a block.
    if (typeof entry.date === 'string') {
      const hasTime = Number.isFinite(entry.startMinute) && Number.isFinite(entry.endMinute)
      out.push({
        id: entry.id || uid(),
        chapterIds,
        date: entry.date,
        startMinute: hasTime ? entry.startMinute : null,
        endMinute: hasTime ? entry.endMinute : null,
        done: !!entry.done,
        seriesId: entry.seriesId || null,
        // Optional per-block overrides. Null means "inherit from the
        // chapter / its subject", which is what almost every block does.
        title: typeof entry.title === 'string' && entry.title.trim() ? entry.title.trim() : null,
        color: typeof entry.color === 'string' && entry.color ? entry.color : null,
        createdAt: entry.createdAt || new Date().toISOString(),
      })
      return
    }

    // Legacy range plan → one untimed block per covered day.
    if (typeof entry.startDate !== 'string') return
    const completed = new Set(Array.isArray(entry.completedDates) ? entry.completedDates : [])
    const dates = eachLegacyDate(entry)
    const seriesId = dates.length > 1 ? entry.id || uid() : null
    dates.forEach((iso, i) => {
      out.push({
        id: i === 0 ? entry.id || uid() : `${entry.id || uid()}-${i}`,
        chapterIds,
        date: iso,
        startMinute: null,
        endMinute: null,
        done: completed.has(iso),
        seriesId,
        title: null,
        color: null,
        createdAt: entry.createdAt || new Date().toISOString(),
      })
    })
  })
  return out
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
// Builds a standard .ics calendar so both halves of the schedule can be
// imported into Google/Apple/Outlook: one all-day VEVENT per active
// chapter's next review date, plus one per planned study block. Mastered
// chapters have no nextReviewDate and are skipped.
export function exportChaptersToICS() {
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  const dateOnly = (iso) => iso.replace(/-/g, '')
  // Floating local time (no Z, no TZID): a 9am block imports as 9am in
  // whatever timezone the importing calendar is set to, which is what a
  // study block stored as minutes-from-midnight actually means.
  const localStamp = (iso, minute) =>
    `${dateOnly(iso)}T${pad(Math.floor(minute / 60))}${pad(minute % 60)}00`
  const subjects = new Map(getSubjects().map((s) => [s.id, s]))
  const allChapters = getChapters()
  const chapters = allChapters.filter((c) => c.nextReviewDate)
  const now = stamp(new Date())
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cadence//Study Reminders//EN', 'CALSCALE:GREGORIAN']
  chapters.forEach((c) => {
    const subjectName = subjects.get(c.subjectId)?.name || 'Cadence'
    lines.push(
      'BEGIN:VEVENT',
      `UID:${c.id}@cadence.app`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateOnly(c.nextReviewDate)}`,
      `SUMMARY:Review — ${subjectName}: ${c.title}`,
      'END:VEVENT'
    )
  })
  const chapterMap = new Map(allChapters.map((c) => [c.id, c]))
  getStudyBlocks().forEach((block) => {
    const blockChapters = block.chapterIds.map((id) => chapterMap.get(id)).filter(Boolean)
    if (blockChapters.length === 0) return
    const subjectName = subjects.get(blockChapters[0].subjectId)?.name || 'Cadence'
    const timed = Number.isFinite(block.startMinute) && Number.isFinite(block.endMinute)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${block.id}@cadence.app`,
      `DTSTAMP:${now}`,
      ...(timed
        ? [
            `DTSTART:${localStamp(block.date, block.startMinute)}`,
            `DTEND:${localStamp(block.date, block.endMinute)}`,
          ]
        : [`DTSTART;VALUE=DATE:${dateOnly(block.date)}`]),
      `SUMMARY:Study — ${subjectName}: ${block.title || blockChapters.map((c) => c.title).join(', ')}`,
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
      blocks: getStudyBlocks(),
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
    return { ok: false, error: 'That file isn’t valid JSON.' }
  }
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Unrecognized backup file.' }
  }
  if (Array.isArray(data.subjects)) saveSubjects(data.subjects)
  if (Array.isArray(data.chapters)) saveChapters(data.chapters)
  if (Array.isArray(data.events)) saveEvents(data.events)
  // Accept both old 'plans' and new 'blocks' keys; normalizeBlocks coerces either.
  if (Array.isArray(data.blocks)) saveStudyBlocks(data.blocks)
  else if (Array.isArray(data.plans)) saveStudyBlocks(data.plans)
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
  localStorage.removeItem(KEYS.plans)
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
