// Geometry and time math for the week/day hour grid.
//
// Times are stored as whole minutes from *local* midnight — never as an
// absolute instant. Same reasoning srs.js gives for dates: a block the user
// put at 9am has to stay 9am, and an ISO timestamp would shift it by the
// UTC offset. Integers also keep snapping, overlap packing and pixel math
// exact, with no floating-point drift down a 17-hour column.

import { startOfDay, addDays, toISODate } from './srs'

export const SNAP_MINUTES = 15
export const MIN_BLOCK_MINUTES = 15
// What an untimed block becomes when it's given a time, and the length a
// click-to-create block starts at.
export const DEFAULT_BLOCK_MINUTES = 60

// The hours the grid draws by default. A 24-hour canvas spends a third of its
// height on the middle of the night nobody studies in; a hard 7–23 clamp would
// instead hide a 6am session outright. So the window is a *default*, not a
// limit — dayWindow() widens it to the hour around whatever is actually booked.
export const DEFAULT_START_MINUTE = 7 * 60
export const DEFAULT_END_MINUTE = 23 * 60
export const HOUR_HEIGHT = 52 // px per hour; the one number the layout scales from
// Shared by the hour gutter, the day header and the all-day row, so all
// three stay aligned to the same left edge.
export const GUTTER_WIDTH = 52

/**
 * The hour range the grid should draw for a given set of blocks: 7:00–23:00,
 * widened (down/up to the whole hour) to cover anything booked outside it.
 * Every geometry function below takes the result, so the canvas can never
 * clip a block the user can see in the list.
 */
export function dayWindow(blocks = []) {
  let start = DEFAULT_START_MINUTE
  let end = DEFAULT_END_MINUTE
  blocks.forEach((b) => {
    if (!Number.isFinite(b?.startMinute) || !Number.isFinite(b?.endMinute)) return
    if (b.startMinute < start) start = Math.floor(b.startMinute / 60) * 60
    if (b.endMinute > end) end = Math.ceil(b.endMinute / 60) * 60
  })
  return { startMinute: Math.max(0, start), endMinute: Math.min(24 * 60, end) }
}

export function gridHeight(win) {
  return ((win.endMinute - win.startMinute) / 60) * HOUR_HEIGHT
}

export function clampMinute(minute, win) {
  return Math.max(win.startMinute, Math.min(win.endMinute, minute))
}

export function snapMinutes(minute) {
  return Math.round(minute / SNAP_MINUTES) * SNAP_MINUTES
}

/** 540 → "9:00 AM". Uses the user's locale for the 12h/24h decision. */
export function minutesToLabel(minute, { omitMinutes = false } = {}) {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  const d = new Date(2000, 0, 1, h, m)
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    ...(omitMinutes && m === 0 ? {} : { minute: '2-digit' }),
  })
}

/** "09:00" for <input type="time">, which is always 24h regardless of locale. */
export function minutesToInputValue(minute) {
  const h = String(Math.floor(minute / 60)).padStart(2, '0')
  const m = String(minute % 60).padStart(2, '0')
  return `${h}:${m}`
}

export function inputValueToMinutes(value) {
  const [h, m] = String(value).split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

/**
 * The chapters a block covers, resolved and filtered. A block can hold
 * several — a two-hour sitting is often two chapters — so everything that
 * labels or colours a block starts here.
 */
export function blockChapters(block, chapterMap) {
  const ids = Array.isArray(block?.chapterIds) ? block.chapterIds : []
  return ids.map((id) => chapterMap.get(id)).filter(Boolean)
}

/**
 * What a block is called on the calendar. It shows its first chapter's title
 * unless the user typed something else in the edit sheet — so renaming a
 * chapter still re-labels every block that never got an override.
 */
export function blockTitle(block, chapters) {
  const custom = typeof block?.title === 'string' ? block.title.trim() : ''
  if (custom) return custom
  const list = Array.isArray(chapters) ? chapters : [chapters]
  return list[0]?.title || 'Study'
}

/** A block's accent colour: its own override, else its first subject's tag. */
export function blockColor(block, subject) {
  return block?.color || subject?.colorTag || 'var(--color-brand)'
}

/** Pixel offset from the top of the grid for a given minute. */
export function minutesToY(minute, win) {
  return ((minute - win.startMinute) / 60) * HOUR_HEIGHT
}

/** Inverse of minutesToY — turns a pointer offset back into a minute. */
export function yToMinutes(y, win) {
  return win.startMinute + (y / HOUR_HEIGHT) * 60
}

/** Every hour boundary in the visible window, for the rules and gutter. */
export function hourMarks(win) {
  const marks = []
  for (let m = win.startMinute; m <= win.endMinute; m += 60) marks.push(m)
  return marks
}

/** "9:00 AM – 10:30 AM" — the drag readout and the month chips share this. */
export function formatRange(startMinute, endMinute) {
  return `${minutesToLabel(startMinute)} – ${minutesToLabel(endMinute)}`
}

/** Sunday-first, matching the existing month grid's weekday order. */
export function startOfWeek(date) {
  const d = startOfDay(date)
  return addDays(d, -d.getDay())
}

/** The 7 ISO dates of the week containing `date`. */
export function weekDates(date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i)))
}

/**
 * Always a full 6-row (42-cell) grid, padded with real dates from the
 * neighbouring months rather than blank cells — the standard calendar look,
 * and it keeps the grid the same height every month so nothing reflows when
 * you page through. Month view and the date popover's mini-month share it.
 */
export function monthMatrix(year, month) {
  const startWeekday = new Date(year, month, 1).getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true })
  }
  let nextDay = 1
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, nextDay), inMonth: false })
    nextDay += 1
  }
  return cells
}

/**
 * Side-by-side packing for blocks that overlap in time, the way Notion and
 * Google Calendar do it: group blocks into runs that transitively overlap,
 * then within a run give each block the first column that's free by the time
 * it starts. Returns each block with { column, columns } so the caller can
 * turn that into a width and left offset.
 *
 * Two blocks that merely touch (one ends exactly when the next begins) are
 * not overlapping — otherwise back-to-back sessions would each render at
 * half width for no reason.
 */
export function layoutOverlaps(blocks) {
  const sorted = [...blocks].sort(
    (a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute
  )

  const out = []
  let run = []
  let runEnd = -Infinity

  const flush = () => {
    if (run.length === 0) return
    // Column assignment within one overlapping run.
    const columnEnds = [] // last end-minute placed in each column
    const placed = run.map((b) => {
      let col = columnEnds.findIndex((end) => end <= b.startMinute)
      if (col === -1) {
        col = columnEnds.length
        columnEnds.push(b.endMinute)
      } else {
        columnEnds[col] = b.endMinute
      }
      return { ...b, column: col }
    })
    placed.forEach((b) => out.push({ ...b, columns: columnEnds.length }))
    run = []
    runEnd = -Infinity
  }

  sorted.forEach((b) => {
    if (run.length > 0 && b.startMinute >= runEnd) flush()
    run.push(b)
    runEnd = Math.max(runEnd, b.endMinute)
  })
  flush()

  return out
}
