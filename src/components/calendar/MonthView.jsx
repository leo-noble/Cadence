import { useMemo, useState } from 'react'
import { toISODate, startOfDay, buildTimeline } from '../../lib/srs'
import { blockChapters, blockColor, blockTitle, minutesToLabel, monthMatrix } from '../../lib/timeGrid'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// How many chips fit a cell before the rest collapse into "+N more". The grid
// is six rows of whatever height the viewport gives it, so this can't be a
// pixel measurement — three is what fits the shortest sensible row, and the
// overflow is one click from the day itself.
const MAX_CHIPS = 3

/**
 * One entry in a day cell — a study block or a review. Both are chips rather
 * than dots: a dot heat-map tells you *that* something is on a day, which is
 * the one thing the number already implies. The chip tells you what.
 */
function Chip({ entry, onClick }) {
  if (entry.type === 'review') {
    return (
      <button
        onClick={onClick}
        title={`Review ${entry.reviewNumber} — ${entry.title}`}
        className="w-full min-w-0 flex items-center gap-1 rounded-[4px] px-1 py-[1px] text-left bg-brand/10 hover:bg-brand/20 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/50"
      >
        <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-brand" />
        <span className="truncate text-[11px] text-brand font-medium">{entry.title}</span>
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      title={`${entry.timeLabel} — ${entry.title}`}
      className="w-full min-w-0 flex items-center gap-1 rounded-[4px] px-1 py-[1px] text-left hover:bg-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/50"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${entry.done ? 'opacity-40' : ''}`}
        style={{ backgroundColor: entry.color }}
      />
      {entry.timeLabel && (
        <span className="shrink-0 text-[10.5px] text-ink-soft font-tabular">{entry.timeLabel}</span>
      )}
      <span
        className={`truncate text-[11px] ${entry.done ? 'text-ink-soft line-through' : 'text-ink'}`}
      >
        {entry.title}
      </span>
      {entry.extra > 0 && (
        <span className="shrink-0 text-[10.5px] text-ink-soft/70 font-tabular">+{entry.extra}</span>
      )}
    </button>
  )
}

export default function MonthView({
  cursorDate,
  blocks,
  chapters,
  chapterMap,
  subjectMap,
  onOpenBlock,
  onOpenChapter,
  onOpenDay,
  onCreateOnDate,
}) {
  const todayISO = useMemo(() => toISODate(new Date()), [])
  const cursor = useMemo(() => {
    const d = startOfDay(cursorDate)
    return { year: d.getFullYear(), month: d.getMonth() }
  }, [cursorDate])

  // Which cells have had their "+N more" expanded. Keyed by ISO date so paging
  // months doesn't carry an expansion over to an unrelated day.
  const [expanded, setExpanded] = useState(() => new Set())

  // Every entry a day holds, in the order it'd be read: timed study by clock
  // time, then untimed, then the reviews Cadence scheduled.
  const entriesByDate = useMemo(() => {
    const map = new Map()
    const push = (date, entry) => {
      const list = map.get(date)
      if (list) list.push(entry)
      else map.set(date, [entry])
    }

    blocks.forEach((block) => {
      const blockCh = blockChapters(block, chapterMap)
      if (blockCh.length === 0) return
      const timed = Number.isFinite(block.startMinute)
      const extra = blockCh.length - 1
      push(block.date, {
        type: 'block',
        key: block.id,
        block,
        sort: timed ? block.startMinute : -1,
        title: blockTitle(block, blockCh),
        extra,
        color: blockColor(block, subjectMap.get(blockCh[0].subjectId)),
        timeLabel: timed ? minutesToLabel(block.startMinute, { omitMinutes: true }) : '',
        done: block.done,
      })
    })

    chapters.forEach((c) => {
      if (c.status === 'mastered') return
      buildTimeline(c).forEach((t) => {
        if (t.state !== 'next' && t.state !== 'upcoming') return
        push(t.date, {
          type: 'review',
          key: `review-${c.id}-${t.reviewNumber}`,
          chapter: c,
          sort: 24 * 60 + t.reviewNumber, // reviews sort after every timed block
          title: c.title,
          reviewNumber: t.reviewNumber,
        })
      })
    })

    // Untimed study (sort -1) leads, then the clock, then reviews.
    map.forEach((list) => list.sort((a, b) => a.sort - b.sort))
    return map
  }, [blocks, chapters, chapterMap, subjectMap])

  const cells = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor])

  return (
    // Six equal rows, each with a floor so a light month doesn't collapse to
    // unreadably short cells and a busy one still ends flush at the bottom.
    <div className="h-full flex flex-col min-h-0">
      <div className="grid grid-cols-7 border-b border-divider/60 shrink-0">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-[10px] uppercase tracking-wideish text-ink-soft/70 font-medium py-2"
          >
            {w}
          </div>
        ))}
      </div>

      <div
        className="flex-1 min-h-0 grid grid-cols-7"
        style={{ gridTemplateRows: 'repeat(6, minmax(84px, 1fr))' }}
      >
        {cells.map((cell, i) => {
          const iso = toISODate(cell.date)
          const entries = entriesByDate.get(iso) || []
          const isToday = iso === todayISO
          const isExpanded = expanded.has(iso)
          const visible = isExpanded ? entries : entries.slice(0, MAX_CHIPS)
          const hidden = entries.length - visible.length
          const isFirstOfMonth = cell.date.getDate() === 1

          return (
            <div
              key={i}
              // The whole cell creates on double-click — the chips inside stop
              // it from reaching here.
              onDoubleClick={() => onCreateOnDate(iso)}
              className="group relative min-w-0 min-h-0 flex flex-col border-r border-b border-divider/60 [&:nth-child(7n)]:border-r-0 overflow-hidden"
            >
              <div className="px-1.5 pt-1 shrink-0">
                <button
                  onClick={() => onOpenDay(iso)}
                  className={`inline-flex items-center gap-1 rounded-[6px] px-1 -ml-1 text-[11.5px] font-tabular hover:bg-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/50 ${
                    cell.inMonth ? 'text-ink-soft' : 'text-ink-soft/40'
                  }`}
                >
                  {/* The 1st carries its month name, so a padded row reads as
                      "Sep 1" rather than an unexplained jump back to 1. */}
                  {isFirstOfMonth && (
                    <span className="font-body font-medium">
                      {cell.date.toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                  )}
                  <span
                    className={
                      isToday
                        ? 'text-brand font-semibold'
                        : cell.inMonth
                        ? 'text-ink font-medium'
                        : ''
                    }
                  >
                    {cell.date.getDate()}
                  </span>
                </button>
              </div>

              <div className="min-h-0 flex-1 flex flex-col gap-[2px] px-1 pt-0.5 pb-1 overflow-y-auto overscroll-contain">
                {visible.map((entry) => (
                  <Chip
                    key={entry.key}
                    entry={entry}
                    onClick={() =>
                      entry.type === 'review' ? onOpenChapter(entry.chapter) : onOpenBlock(entry.block)
                    }
                  />
                ))}
                {hidden > 0 && (
                  <button
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev)
                        next.add(iso)
                        return next
                      })
                    }
                    className="px-1 text-left text-[10.5px] font-medium text-ink-soft hover:text-brand transition-colors duration-150 shrink-0"
                  >
                    +{hidden} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
