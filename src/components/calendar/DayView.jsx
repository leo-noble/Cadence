import { useMemo, useRef } from 'react'
import { toISODate, buildTimeline } from '../../lib/srs'
import { dayWindow, GUTTER_WIDTH } from '../../lib/timeGrid'
import AllDayStrip from './AllDayStrip'
import TimeGrid from './TimeGrid'

// Day view: one column filling the width, same structure as Week — one
// scrollport owning both axes, so the header and the hour gutter pin.
export default function DayView({
  cursorDate,
  blocks,
  chapters,
  chapterMap,
  subjectMap,
  onMoveBlock,
  onResizeBlock,
  onCreateAt,
  onToggleDone,
  onOpenBlock,
  onOpenChapter,
}) {
  const iso = useMemo(() => toISODate(cursorDate), [cursorDate])
  const dates = useMemo(() => [iso], [iso])
  const scrollRef = useRef(null)

  const blocksByDate = useMemo(() => {
    const map = new Map()
    map.set(iso, blocks.filter((b) => b.date === iso))
    return map
  }, [blocks, iso])

  const reviews = useMemo(() => {
    const list = []
    chapters.forEach((c) => {
      if (c.status === 'mastered') return
      const match = buildTimeline(c).find(
        (t) => t.date === iso && (t.state === 'next' || t.state === 'upcoming')
      )
      if (match) list.push({ chapterId: c.id, reviewNumber: match.reviewNumber, onOpen: onOpenChapter })
    })
    return list
  }, [chapters, iso, onOpenChapter])

  const untimed = useMemo(
    () => (blocksByDate.get(iso) || []).filter((b) => !Number.isFinite(b.startMinute)),
    [blocksByDate, iso]
  )

  // The hour range to draw — widened past 7:00–23:00 by anything this day
  // has booked outside it.
  const win = useMemo(() => dayWindow(blocksByDate.get(iso) || []), [blocksByDate, iso])

  const d = new Date(iso + 'T00:00:00')
  const isToday = iso === toISODate(new Date())

  return (
    <div ref={scrollRef} className="h-full overflow-auto overscroll-contain">
      {/* Day header */}
      <div className="flex items-baseline gap-2 border-b border-divider bg-surface sticky top-0 z-50 px-4 py-2.5">
        <span className="text-[11px] uppercase tracking-wideish font-medium text-ink-soft">
          {d.toLocaleDateString(undefined, { weekday: 'long' })}
        </span>
        <span className={`text-[14px] font-semibold font-tabular ${isToday ? 'text-brand' : 'text-ink'}`}>
          {d.getDate()}
        </span>
        <span className="text-[12.5px] text-ink-soft">
          {d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* All-day strip */}
      {(reviews.length > 0 || untimed.length > 0) && (
        <div className="flex border-b border-divider bg-surface-2/30">
          <div
            style={{ width: GUTTER_WIDTH }}
            className="shrink-0 flex items-center justify-end pr-3"
          >
            <span className="text-[10px] text-ink-soft/60 font-medium">All day</span>
          </div>
          <div className="flex-1 min-w-0">
            <AllDayStrip
              reviews={reviews}
              untimedBlocks={untimed}
              chapterMap={chapterMap}
              subjectMap={subjectMap}
              onToggleDone={onToggleDone}
              onOpenBlock={onOpenBlock}
            />
          </div>
        </div>
      )}

      {/* Hour canvas */}
      <TimeGrid
        dates={dates}
        blocksByDate={blocksByDate}
        chapterMap={chapterMap}
        subjectMap={subjectMap}
        window={win}
        onMoveBlock={onMoveBlock}
        onResizeBlock={onResizeBlock}
        onCreateAt={onCreateAt}
        onToggleDone={onToggleDone}
        onOpenBlock={onOpenBlock}
        scrollParentRef={scrollRef}
      />
    </div>
  )
}
