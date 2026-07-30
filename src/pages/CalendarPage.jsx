import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toISODate, startOfDay, buildTimeline } from '../lib/srs'
import PageHeader from '../components/PageHeader'

// Always returns a full 6-row (42-cell) grid, padded with real dates from
// the previous/next month rather than blank cells — the standard calendar
// look, and it keeps the grid the same height every month.
function getMonthMatrix(year, month) {
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

function loadColor(count) {
  if (count === 0) return ''
  if (count <= 2) return 'bg-brand/10'
  if (count <= 4) return 'bg-brand/20'
  return 'bg-brand/35'
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function CalendarPage({ cadence, onOpenChapter }) {
  const { chapters, subjectMap } = cadence
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selectedDate, setSelectedDate] = useState(null)

  // Every not-yet-completed review (the next one due, plus every date
  // still ahead of it) gets plotted — not just each chapter's single
  // nearest-term review. All 6 dates are fixed relative to a chapter's
  // studied date from the moment it's added, so the whole schedule is
  // knowable in advance.
  const loadByDate = useMemo(() => {
    const map = new Map()
    chapters.forEach((c) => {
      if (c.status === 'mastered') return
      buildTimeline(c).forEach((t) => {
        if (t.state === 'next' || t.state === 'upcoming') {
          map.set(t.date, (map.get(t.date) || 0) + 1)
        }
      })
    })
    return map
  }, [chapters])

  const cells = useMemo(() => getMonthMatrix(cursor.year, cursor.month), [cursor])
  const todayISO = toISODate(new Date())

  const chaptersOnSelected = useMemo(() => {
    if (!selectedDate) return []
    const results = []
    chapters.forEach((c) => {
      if (c.status === 'mastered') return
      const match = buildTimeline(c).find(
        (t) => t.date === selectedDate && (t.state === 'next' || t.state === 'upcoming')
      )
      if (match) results.push({ chapter: c, reviewNumber: match.reviewNumber })
    })
    return results
  }, [selectedDate, chapters])

  function shiftMonth(delta) {
    setSelectedDate(null)
    setCursor((prev) => {
      let month = prev.month + delta
      let year = prev.year
      if (month < 0) { month = 11; year -= 1 }
      if (month > 11) { month = 0; year += 1 }
      return { year, month }
    })
  }

  function handleDayClick(cell, iso, count) {
    if (!cell.inMonth) {
      // Jumping to an adjacent-month day: switch the visible month too.
      setCursor({ year: cell.date.getFullYear(), month: cell.date.getMonth() })
      setSelectedDate(count > 0 ? iso : null)
      return
    }
    setSelectedDate(count > 0 ? iso : null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-10">
      <PageHeader eyebrow="Review activity" title="Calendar" />

      <div className="rounded-card bg-surface border border-divider shadow-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftMonth(-1)} className="h-8 w-8 flex items-center justify-center rounded-full text-brand active:bg-paper">
            <ChevronLeft size={18} />
          </button>
          <p className="font-display text-[17px] font-semibold text-ink">
            {new Date(cursor.year, cursor.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </p>
          <button onClick={() => shiftMonth(1)} className="h-8 w-8 flex items-center justify-center rounded-full text-brand active:bg-paper">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="text-center text-[12px] text-ink-soft font-medium py-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const iso = toISODate(cell.date)
            const count = loadByDate.get(iso) || 0
            const isToday = iso === todayISO
            const isSelected = iso === selectedDate
            return (
              <button
                key={i}
                onClick={() => handleDayClick(cell, iso, count)}
                className="aspect-square flex items-center justify-center relative"
              >
                <span
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-[14px] font-tabular transition-colors duration-150 ${
                    !cell.inMonth
                      ? 'text-ink-soft/40'
                      : isToday
                      ? 'bg-brand text-white font-semibold'
                      : isSelected
                      ? 'bg-brand/15 text-brand font-medium'
                      : `${loadColor(count)} text-ink`
                  }`}
                >
                  {cell.date.getDate()}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 text-[12px] text-ink-soft">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand/10" />Light</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand/20" />Moderate</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand/35" />Heavy</span>
        </div>
      </div>

      {selectedDate && chaptersOnSelected.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft mb-2 px-1">
            {startOfDay(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          <div className="rounded-card bg-surface border border-divider divide-y divide-divider overflow-hidden shadow-elevated">
            {chaptersOnSelected.map(({ chapter: c, reviewNumber }) => {
              const s = subjectMap.get(c.subjectId)
              return (
                <button
                  key={c.id}
                  onClick={() => onOpenChapter(c)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left active:bg-paper transition-colors duration-100"
                >
                  {s && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.colorTag }} />}
                  <span className="text-[15px] text-ink truncate flex-1">{c.title}</span>
                  <span className="text-[12px] text-ink-soft shrink-0">Review {reviewNumber}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
