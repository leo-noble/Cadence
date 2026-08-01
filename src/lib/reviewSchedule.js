import { INTERVALS_FROM_DAY0 } from './srs'

// Shared shape of the review schedule for the landing page's two diagrams
// (the timeline and the recall chart), derived from the same constants the
// app schedules against — so the marketing visuals can never drift out of
// sync with the engine.

/** Day numbers of every point on a chapter's life: [0, 1, 4, 11, 41]. */
export const REVIEW_DAYS = [0, ...INTERVALS_FROM_DAY0]

/** Days waited before each review: [1, 3, 7, 30]. */
export const REVIEW_GAPS = INTERVALS_FROM_DAY0.map(
  (day, i) => day - (INTERVALS_FROM_DAY0[i - 1] ?? 0)
)

export const LAST_DAY = REVIEW_DAYS[REVIEW_DAYS.length - 1]

// Both diagrams place a day along the x-axis with this scale. A purely
// linear one would squeeze days 0–11 into the leftmost quarter and leave
// no room to label them; a purely logarithmic one flattens the gaps until
// they all look alike. This power curve keeps every gap visibly wider than
// the one before it — which is the whole point being illustrated — while
// still giving the early reviews room to breathe.
const EXPONENT = 0.75

export function dayToFraction(day, maxDay = LAST_DAY) {
  if (day <= 0) return 0
  return Math.pow(day, EXPONENT) / Math.pow(maxDay, EXPONENT)
}

/**
 * The inverse. The recall chart samples its curves at evenly spaced points
 * across the drawing, not evenly spaced days — otherwise the steep first
 * day, which occupies a sliver of the width, gets only a few points and
 * renders as visible corners.
 */
export function fractionToDay(fraction, maxDay = LAST_DAY) {
  if (fraction <= 0) return 0
  return maxDay * Math.pow(fraction, 1 / EXPONENT)
}

/** "3 days" / "1 day" — used for the gap labels between review markers. */
export function formatGap(days) {
  return days === 1 ? '1 day' : `${days} days`
}

/**
 * Split a reading list across a stretch of days: `[{ date, chapterIds }]`,
 * one entry per study session.
 *
 * More chapters than days packs them evenly — 5 chapters over 2 days is
 * 3 + 2, in order, so a session is still a contiguous run of reading. Fewer
 * chapters than days spreads the sessions across the whole span rather than
 * bunching them at the front: 3 chapters over Mon–Fri lands on Mon, Wed, Fri,
 * because a span is a request for pacing, not just a deadline.
 *
 * Pure and total — empty input gives an empty plan, never an empty session.
 */
export function distributeChapters(chapterIds, dates) {
  const ids = (chapterIds || []).filter(Boolean)
  const days = (dates || []).filter(Boolean)
  if (ids.length === 0 || days.length === 0) return []

  const sessions = Math.min(days.length, ids.length)
  const rows = []
  let taken = 0
  for (let i = 0; i < sessions; i += 1) {
    const size = Math.ceil((ids.length - taken) / (sessions - i))
    const day = sessions === 1 ? days[0] : days[Math.round((i * (days.length - 1)) / (sessions - 1))]
    rows.push({ date: day, chapterIds: ids.slice(taken, taken + size) })
    taken += size
  }
  return rows
}
