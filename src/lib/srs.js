// Cadence spaced-repetition engine
//
// The schedule is defined as an interval *since the previous review*:
// +1, +3, +7, +30 days — i.e. Day 1 (learn) → Day 2 → Day 5 → Day 12 →
// Day 42. Internally we store the cumulative "days after Day 0" for each
// review (since that's what the date math needs), but the rule that
// matters is the interval-from-previous-review one — each step is
// deliberately wider than the last, so a review can be pushed a day or
// two late without breaking the schedule, but the schedule itself is
// fixed from the moment a chapter is logged, not recalculated from when
// a review actually happens.
const INTERVALS_SINCE_PREVIOUS = [1, 3, 7, 30]
export const INTERVALS_FROM_DAY0 = (() => {
  let cumulative = 0
  return INTERVALS_SINCE_PREVIOUS.map((n) => (cumulative += n))
})() // [1, 4, 11, 41]
export const MAX_REVIEW_INDEX = INTERVALS_FROM_DAY0.length // 4
export const MAX_CONSECUTIVE_SNOOZES = 2

const DAY_MS = 24 * 60 * 60 * 1000

// Returns a Date pinned to local midnight of the given day.
//
// This is the one place that has to be careful about timezones. A plain
// "YYYY-MM-DD" string passed to `new Date(...)` is parsed as UTC midnight
// per the JS spec — then converting that back to a local date can land on
// the *previous or next* calendar day depending on which side of UTC the
// user's timezone is on. Splitting the string and using the (year, month,
// day) constructor instead is always interpreted in local time, so it's
// unambiguous everywhere.
export function startOfDay(date) {
  if (typeof date === 'string') {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Adds whole calendar days using the local date's own day-of-month setter
// (rather than raw millisecond math), so this stays correct across
// daylight-saving-time transitions, where a "day" isn't exactly 24 hours.
export function addDays(date, days) {
  const d = startOfDay(date)
  d.setDate(d.getDate() + days)
  return d
}

export function daysBetween(a, b) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS)
}

// Formats a Date as "YYYY-MM-DD" using its *local* calendar-date
// components — never via toISOString(), which reports the UTC date and
// would silently shift by a day for roughly half the world's timezones.
export function toISODate(date) {
  const d = startOfDay(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Compute the next_review_date for a chapter given its studied_date and current_review_index (0-based, count of reviews completed). */
export function nextReviewDateForIndex(studiedDate, reviewIndex) {
  if (reviewIndex >= MAX_REVIEW_INDEX) return null
  const offset = INTERVALS_FROM_DAY0[reviewIndex]
  return toISODate(addDays(studiedDate, offset))
}

/** Build a full projected timeline (past + upcoming) for a chapter. */
export function buildTimeline(chapter) {
  return INTERVALS_FROM_DAY0.map((offset, i) => {
    const date = toISODate(addDays(chapter.studiedDate, offset))
    let state = 'upcoming'
    if (i < chapter.currentReviewIndex) state = 'done'
    else if (i === chapter.currentReviewIndex) {
      state = chapter.status === 'mastered' ? 'done' : 'next'
    }
    return { reviewNumber: i + 1, date, state }
  })
}

/** Derive display status (overdue/due/upcoming/mastered) for "today". */
export function deriveStatus(chapter, today = new Date()) {
  if (chapter.status === 'mastered') return 'mastered'
  if (!chapter.nextReviewDate) return 'mastered'
  const diff = daysBetween(today, chapter.nextReviewDate)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'due'
  return 'upcoming'
}

export function isDueOrOverdue(chapter, today = new Date()) {
  const s = deriveStatus(chapter, today)
  return s === 'due' || s === 'overdue'
}

/** Mark a chapter as revised: advances to next interval, or Mastered if it was the last. */
export function markRevised(chapter, today = new Date()) {
  const nextIndex = chapter.currentReviewIndex + 1
  const isLast = chapter.currentReviewIndex === MAX_REVIEW_INDEX - 1
  if (isLast) {
    return {
      ...chapter,
      currentReviewIndex: MAX_REVIEW_INDEX,
      nextReviewDate: null,
      status: 'mastered',
      struggleFlag: false,
      snoozeStreak: 0,
      lastActionDate: toISODate(today),
    }
  }
  return {
    ...chapter,
    currentReviewIndex: nextIndex,
    nextReviewDate: nextReviewDateForIndex(chapter.studiedDate, nextIndex),
    status: 'active',
    struggleFlag: false,
    snoozeStreak: 0,
    lastActionDate: toISODate(today),
  }
}

/** Snooze by 1 day, capped at MAX_CONSECUTIVE_SNOOZES. Returns { chapter, blocked }. */
export function snoozeChapter(chapter, today = new Date()) {
  const streak = chapter.snoozeStreak || 0
  if (streak >= MAX_CONSECUTIVE_SNOOZES) {
    return { chapter, blocked: true }
  }
  return {
    chapter: {
      ...chapter,
      nextReviewDate: toISODate(addDays(chapter.nextReviewDate, 1)),
      snoozeStreak: streak + 1,
      lastActionDate: toISODate(today),
    },
    blocked: false,
  }
}

/** Flag as struggled — keeps same next date, adds to "needs extra attention". */
export function markStruggled(chapter, today = new Date()) {
  return { ...chapter, struggleFlag: true, lastActionDate: toISODate(today) }
}

/** Confident-student override: ends the review cycle early, marking the chapter Mastered immediately. */
export function masterEarly(chapter, today = new Date()) {
  return {
    ...chapter,
    currentReviewIndex: MAX_REVIEW_INDEX,
    nextReviewDate: null,
    status: 'mastered',
    struggleFlag: false,
    snoozeStreak: 0,
    lastActionDate: toISODate(today),
  }
}
