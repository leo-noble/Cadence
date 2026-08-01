import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { toISODate, startOfDay, addDays } from '../lib/srs'
import { startOfWeek, weekDates as weekDatesOf } from '../lib/timeGrid'
import PageHeader from '../components/PageHeader'
import SegmentedControl from '../components/SegmentedControl'
import StudyPlanSheet from '../components/StudyPlanSheet'
import MiniMonth from '../components/calendar/MiniMonth'
import WeekView from '../components/calendar/WeekView'
import DayView from '../components/calendar/DayView'
import MonthView from '../components/calendar/MonthView'

const VIEWS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

// Phones get Day by default — seven hour-columns on a 375px screen would be
// about 46px each, too narrow to read a chapter title in, let alone drag
// within. The switcher still reaches Week and Month on every size.
const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 768

export default function CalendarPage({ cadence, onOpenChapter }) {
  const {
    chapters,
    subjectMap,
    blocks,
    createStudyBlocks,
    updateStudyBlock,
    moveStudyBlock,
    resizeStudyBlock,
    removeStudyBlock,
    removeStudySeries,
    toggleStudyBlockDone,
  } = cadence

  const todayISO = toISODate(new Date())
  const [view, setView] = useState(() => (isNarrow() ? 'day' : 'week'))
  // One cursor date drives every view, so switching Week → Day → Month keeps
  // you where you were rather than snapping back to today.
  const [cursor, setCursor] = useState(todayISO)
  const [sheet, setSheet] = useState(null) // { block } to edit, { date, startMinute, endMinute } to create
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)

  const chapterMap = useMemo(() => new Map(chapters.map((c) => [c.id, c])), [chapters])
  const pickerWeek = useMemo(() => weekDatesOf(cursor), [cursor])
  // The mini-month's only extra signal: a dot on days that already have work.
  const loadByDate = useMemo(() => {
    const map = new Map()
    blocks.forEach((b) => map.set(b.date, (map.get(b.date) || 0) + 1))
    return map
  }, [blocks])

  function shift(delta) {
    setCursor((prev) => {
      if (view === 'day') return toISODate(addDays(prev, delta))
      if (view === 'week') return toISODate(addDays(prev, delta * 7))
      const d = startOfDay(prev)
      return toISODate(new Date(d.getFullYear(), d.getMonth() + delta, 1))
    })
  }

  // Dismiss the date popover on outside click or Escape.
  useEffect(() => {
    if (!pickerOpen) return
    function onDown(e) {
      if (!pickerRef.current?.contains(e.target)) setPickerOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen])

  const rangeLabel = useMemo(() => {
    const d = startOfDay(cursor)
    if (view === 'day') {
      return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    }
    if (view === 'month') {
      return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    }
    // Week — collapse a same-month range to "Mar 3 – 9, 2026"
    const start = startOfWeek(d)
    const end = addDays(start, 6)
    const sameMonth = start.getMonth() === end.getMonth()
    const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString(
      undefined,
      sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' }
    )
    return `${startStr} – ${endStr}, ${end.getFullYear()}`
  }, [cursor, view])

  const openDay = (iso) => {
    setCursor(iso)
    setView('day')
  }

  const viewProps = {
    cursorDate: cursor,
    blocks,
    chapters,
    chapterMap,
    subjectMap,
    onMoveBlock: moveStudyBlock,
    onResizeBlock: resizeStudyBlock,
    onCreateAt: ({ date, startMinute, endMinute }) => setSheet({ date, startMinute, endMinute }),
    onToggleDone: toggleStudyBlockDone,
    onOpenBlock: (block) => setSheet({ block }),
    onOpenChapter,
    onSelectDate: openDay,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-10">
      <PageHeader
        eyebrow="Your schedule"
        title="Plan"
        action={
          <button
            onClick={() => setSheet({ date: cursor })}
            className="rounded-control bg-brand text-white px-4 py-2 text-[13px] font-medium hover:opacity-90 active:opacity-80 transition-opacity duration-150"
          >
            Plan study
          </button>
        }
      />

      {/* One line of controls: where you are on the left, how you're looking at
          it on the right. Everything else the old toolbar carried is either in
          the header or reachable from the date popover. */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center -ml-1.5">
          <button
            onClick={() => shift(-1)}
            aria-label={`Previous ${view}`}
            className="h-8 w-8 flex items-center justify-center rounded-[8px] text-ink-soft hover:bg-hover hover:text-ink transition-colors duration-150"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => shift(1)}
            aria-label={`Next ${view}`}
            className="h-8 w-8 flex items-center justify-center rounded-[8px] text-ink-soft hover:bg-hover hover:text-ink transition-colors duration-150"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="relative min-w-0" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
            className="flex items-center gap-1.5 min-w-0 rounded-[8px] px-2 py-1 -mx-1 hover:bg-hover transition-colors duration-150"
          >
            <span className="font-display text-[16px] md:text-[17px] font-semibold text-ink truncate">
              {rangeLabel}
            </span>
            <ChevronDown size={14} className="shrink-0 text-ink-soft" />
          </button>

          <AnimatePresence>
            {pickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-full mt-1.5 z-30 w-[248px] origin-top-left rounded-card border border-divider bg-surface p-3 shadow-elevated"
              >
                <MiniMonth
                  cursorDate={cursor}
                  weekDates={view === 'week' ? pickerWeek : [cursor]}
                  loadByDate={loadByDate}
                  onSelectDate={(iso) => {
                    setCursor(iso)
                    setPickerOpen(false)
                  }}
                  onShiftMonth={(delta) =>
                    setCursor((prev) => {
                      const d = startOfDay(prev)
                      return toISODate(new Date(d.getFullYear(), d.getMonth() + delta, 1))
                    })
                  }
                />
                <button
                  onClick={() => {
                    setCursor(todayISO)
                    setPickerOpen(false)
                  }}
                  className="mt-2 w-full rounded-control border border-divider py-1.5 text-[12.5px] font-medium text-ink-soft hover:bg-hover hover:text-ink transition-colors duration-150"
                >
                  Today
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SegmentedControl
          options={VIEWS}
          value={view}
          onChange={setView}
          layoutId="calendar-view-pill"
          className="ml-auto shrink-0"
        />
      </div>

      {/* The grid is a card on the page like every other panel in the app. It
          scrolls internally so the hour gutter and day headers have something
          to pin against, but the page around it scrolls normally. */}
      <div className="rounded-card border border-divider bg-surface overflow-hidden h-[min(620px,calc(100vh-260px))] min-h-[420px]">
        {view === 'week' && <WeekView {...viewProps} />}
        {view === 'day' && <DayView {...viewProps} />}
        {view === 'month' && (
          <MonthView
            cursorDate={cursor}
            blocks={blocks}
            chapters={chapters}
            chapterMap={chapterMap}
            subjectMap={subjectMap}
            onOpenBlock={(block) => setSheet({ block })}
            onOpenChapter={onOpenChapter}
            onOpenDay={openDay}
            onCreateOnDate={(date) => setSheet({ date })}
          />
        )}
      </div>

      <AnimatePresence>
        {sheet && (
          <StudyPlanSheet
            key="study-plan"
            chapters={chapters}
            subjectMap={subjectMap}
            blocks={blocks}
            block={sheet.block}
            defaultDate={sheet.date || cursor}
            defaultStartMinute={sheet.startMinute}
            defaultEndMinute={sheet.endMinute}
            onCreate={({ rows, startMinute, endMinute }) => {
              createStudyBlocks({ rows, startMinute, endMinute })
              if (rows?.[0]?.date) setCursor(rows[0].date)
            }}
            onUpdate={(next) => {
              updateStudyBlock(next)
              if (next.date) setCursor(next.date)
            }}
            onDelete={removeStudyBlock}
            onDeleteSeries={removeStudySeries}
            onClose={() => setSheet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
