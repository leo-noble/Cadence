import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Minus, Plus, Search, Trash2, X } from 'lucide-react'
import Grabber from './Grabber'
import { SUBJECT_COLORS } from '../lib/storage'
import { toISODate, addDays, daysBetween, startOfDay } from '../lib/srs'
import { distributeChapters } from '../lib/reviewSchedule'
import {
  minutesToInputValue,
  inputValueToMinutes,
  minutesToLabel,
  MIN_BLOCK_MINUTES,
  DEFAULT_BLOCK_MINUTES,
} from '../lib/timeGrid'

// A study block is planned, not scheduled: the user picks what to read, which
// day(s), and optionally when. That's deliberately separate from the review
// schedule, which Cadence sets itself and the user never edits.
const MAX_SPAN_DAYS = 60
const END_OF_DAY = 24 * 60

const shortDate = (iso) =>
  startOfDay(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

const rowDate = (iso) =>
  startOfDay(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })

export default function StudyPlanSheet({
  chapters,
  subjectMap,
  blocks,
  block,
  defaultDate,
  defaultStartMinute,
  defaultEndMinute,
  onCreate,
  onUpdate,
  onDelete,
  onDeleteSeries,
  onClose,
}) {
  const editing = !!block

  // A block dragged out on the canvas arrives with a time; "Plan study" from
  // the header arrives without one and defaults to a 9am hour.
  const initialStart = editing
    ? block.startMinute
    : Number.isFinite(defaultStartMinute)
    ? defaultStartMinute
    : 9 * 60
  const initialEnd = editing
    ? block.endMinute
    : Number.isFinite(defaultEndMinute)
    ? defaultEndMinute
    : (Number.isFinite(defaultStartMinute) ? defaultStartMinute : 9 * 60) + DEFAULT_BLOCK_MINUTES

  const [selected, setSelected] = useState(() => (block ? [...(block.chapterIds || [])] : []))
  const [spread, setSpread] = useState('single') // single | multi
  const [startDate, setStartDate] = useState(block?.date || defaultDate)
  const [endDate, setEndDate] = useState(block?.date || defaultDate)
  // Days the user struck off the preview. Kept as dates rather than row
  // indexes so the rest can re-flow underneath without the exclusion sliding
  // onto a different day.
  const [dropped, setDropped] = useState(() => new Set())
  const [timed, setTimed] = useState(editing ? Number.isFinite(block.startMinute) : true)
  const [startMinute, setStartMinute] = useState(Number.isFinite(initialStart) ? initialStart : 9 * 60)
  const [endMinute, setEndMinute] = useState(
    Number.isFinite(initialEnd) ? initialEnd : 9 * 60 + DEFAULT_BLOCK_MINUTES
  )
  // Both are overrides: empty means "use the chapter's title" / "use the
  // subject's colour", which is what a block does until it's told otherwise.
  const [title, setTitle] = useState(block?.title || '')
  const [color, setColor] = useState(block?.color || null)
  const [scope, setScope] = useState('single') // single | series
  const [query, setQuery] = useState('')

  // How many blocks share this one's seriesId — decides whether the
  // this-day/whole-series choice is worth showing at all.
  const seriesCount = useMemo(() => {
    if (!editing || !block.seriesId) return 0
    return (blocks || []).filter((b) => b.seriesId === block.seriesId).length
  }, [editing, block, blocks])

  const sorted = useMemo(() => {
    const withSubject = chapters.map((c) => ({ ...c, subject: subjectMap.get(c.subjectId) }))
    return withSubject.sort((a, b) => {
      const s = (a.subject?.name || '').localeCompare(b.subject?.name || '')
      return s !== 0 ? s : a.title.localeCompare(b.title)
    })
  }, [chapters, subjectMap])

  const chapterMap = useMemo(() => new Map(chapters.map((c) => [c.id, c])), [chapters])

  // Whichever chapter leads the selection — the Label placeholder and the
  // "inherit" colour swatch both track it as the selection changes.
  const activeChapter = useMemo(
    () => chapterMap.get(selected[0]) || null,
    [chapterMap, selected]
  )
  const activeSubjectColor = activeChapter
    ? subjectMap.get(activeChapter.subjectId)?.colorTag || null
    : null

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(
      (c) => c.title.toLowerCase().includes(q) || (c.subject?.name || '').toLowerCase().includes(q)
    )
  }, [sorted, query])

  const span = Math.min(daysBetween(startDate, endDate) + 1, MAX_SPAN_DAYS)

  // Any change to the stretch invalidates which days were struck off — the
  // dates themselves have moved.
  function setSpan(days) {
    const n = Math.max(2, Math.min(days, MAX_SPAN_DAYS))
    setEndDate(toISODate(addDays(startDate, n - 1)))
    setDropped(new Set())
  }

  // The end date can never precede the start; nudging the start forward past
  // the end drags the end along rather than rejecting the input.
  function changeStart(value) {
    if (!value) return
    setStartDate(value)
    if (value > endDate) setEndDate(value)
    setDropped(new Set())
  }

  function changeEnd(value) {
    if (!value) return
    setEndDate(value < startDate ? startDate : value)
    setDropped(new Set())
  }

  function changeSpread(next) {
    setSpread(next)
    setDropped(new Set())
    if (next === 'single') {
      setEndDate(startDate)
    } else if (endDate <= startDate) {
      // A fresh span defaults to one day per chapter — the most common thing
      // "over several days" is asked to mean.
      const days = Math.max(2, Math.min(selected.length || 2, 14))
      setEndDate(toISODate(addDays(startDate, days - 1)))
    }
  }

  // Times keep at least MIN_BLOCK_MINUTES between them, in whichever
  // direction the user is editing — so neither field can cross the other.
  function changeStartTime(value) {
    const m = inputValueToMinutes(value)
    if (m === null) return
    setStartMinute(m)
    if (endMinute - m < MIN_BLOCK_MINUTES) {
      setEndMinute(Math.min(m + DEFAULT_BLOCK_MINUTES, END_OF_DAY))
    }
  }

  function changeEndTime(value) {
    const m = inputValueToMinutes(value)
    if (m === null) return
    setEndMinute(Math.max(m, startMinute + MIN_BLOCK_MINUTES))
  }

  // A block can hold several chapters now, so this is a multi-select in both
  // modes — editing retargets the one block, planning fills a stretch.
  function toggleChapter(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const dates = useMemo(
    () => Array.from({ length: span }, (_, i) => toISODate(addDays(startDate, i))),
    [startDate, span]
  )

  // The plan itself: what actually gets created, after the split and after
  // anything the user struck off. Removing a day re-flows its chapters onto
  // the days that are left rather than dropping them.
  const rows = useMemo(() => {
    if (spread === 'single') {
      return selected.length > 0 ? [{ date: startDate, chapterIds: selected }] : []
    }
    return distributeChapters(selected, dates.filter((d) => !dropped.has(d)))
  }, [spread, selected, startDate, dates, dropped])

  const canSave = editing ? selected.length > 0 : rows.length > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSave) return
    const times = timed ? { startMinute, endMinute } : { startMinute: null, endMinute: null }
    if (editing) {
      onUpdate({ id: block.id, chapterIds: selected, date: startDate, ...times, title, color, scope })
    } else {
      onCreate({ rows, ...times })
    }
    onClose()
  }

  const labelClass = 'block text-[13px] font-medium text-ink-soft mb-1.5 uppercase tracking-wide'
  const inputClass =
    'w-full rounded-control border border-divider bg-paper px-3 py-2.5 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/40'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30, transition: { duration: 0.18 } }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full md:max-w-md bg-surface rounded-t-card md:rounded-card shadow-sheet pb-[env(safe-area-inset-bottom)] max-h-[92vh] flex flex-col"
      >
        <Grabber />

        <div className="flex items-center justify-between px-4 py-3 border-b border-divider shrink-0">
          <button type="button" onClick={onClose} className="text-[17px] text-brand active:opacity-50">
            Cancel
          </button>
          <h2 className="font-display text-[17px] font-semibold text-ink">
            {editing ? 'Edit session' : 'Plan study'}
          </h2>
          <button
            type="submit"
            disabled={!canSave}
            className="text-[17px] font-semibold text-brand disabled:opacity-30 active:opacity-50"
          >
            {editing ? 'Save' : 'Add'}
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {/* 1 — What to read. First, because everything below is sized by it:
              the default span, the split, the preview. */}
          <label className={labelClass}>{editing ? 'Chapters' : 'What to study'}</label>

          {chapters.length === 0 ? (
            <p className="text-[14px] text-ink-soft py-3">
              Add a chapter first — planned sessions point at chapters you’ve already logged.
            </p>
          ) : (
            <>
              {sorted.length > 6 && (
                <div className="relative mb-2">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search chapters"
                    aria-label="Search chapters"
                    className="w-full rounded-control border border-divider bg-paper pl-9 pr-3 py-2 text-[14px] text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              )}

              <div className="rounded-card border border-divider divide-y divide-divider overflow-hidden max-h-64 overflow-y-auto">
                {visible.length === 0 && (
                  <p className="text-[14px] text-ink-soft px-3.5 py-3">No chapter matches that.</p>
                )}
                {visible.map((c) => {
                  const isOn = selected.includes(c.id)
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleChapter(c.id)}
                      aria-pressed={isOn}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors duration-150 ${
                        isOn ? 'bg-selected' : 'hover:bg-hover'
                      }`}
                    >
                      <span
                        className={`h-[18px] w-[18px] shrink-0 rounded-[5px] border flex items-center justify-center transition-colors duration-150 ${
                          isOn ? 'bg-brand border-brand text-white' : 'border-divider'
                        }`}
                      >
                        {isOn && <Check size={12} strokeWidth={3} />}
                      </span>
                      {c.subject && (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: c.subject.colorTag }}
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] text-ink truncate">{c.title}</span>
                        {c.subject && (
                          <span className="block text-[12px] text-ink-soft truncate">{c.subject.name}</span>
                        )}
                      </span>
                      {c.derivedStatus === 'mastered' && (
                        <span className="text-[11px] text-ink-soft shrink-0">Mastered</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* 2 — When. Editing targets the one day it already sits on;
              planning chooses between a single sitting and a stretch. */}
          {editing ? (
            <div className="mt-4">
              <label htmlFor="plan-date" className={labelClass}>
                Day
              </label>
              <input
                id="plan-date"
                type="date"
                value={startDate}
                onChange={(e) => e.target.value && setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
          ) : (
            <div className="mt-4">
              <span className={labelClass}>When</span>
              <div className="flex gap-2 mb-3">
                {[
                  { id: 'single', label: 'One day' },
                  { id: 'multi', label: 'Over several days' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => changeSpread(opt.id)}
                    aria-pressed={spread === opt.id}
                    className={`flex-1 rounded-control border px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${
                      spread === opt.id
                        ? 'border-brand bg-selected text-brand'
                        : 'border-divider text-ink-soft hover:bg-hover'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {spread === 'single' ? (
                <input
                  type="date"
                  aria-label="Day"
                  value={startDate}
                  onChange={(e) => changeStart(e.target.value)}
                  className={inputClass}
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="plan-start" className="block text-[12px] text-ink-soft mb-1">
                        From
                      </label>
                      <input
                        id="plan-start"
                        type="date"
                        value={startDate}
                        onChange={(e) => changeStart(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="plan-end" className="block text-[12px] text-ink-soft mb-1">
                        Through
                      </label>
                      <input
                        id="plan-end"
                        type="date"
                        value={startDate > endDate ? startDate : endDate}
                        min={startDate}
                        onChange={(e) => changeEnd(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  {/* The same span counted the other way round. Two views of
                      one number, always in step, so neither has to be the
                      one the user is forced to think in. */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSpan(span - 1)}
                      disabled={span <= 2}
                      aria-label="One day fewer"
                      className="h-8 w-8 flex items-center justify-center rounded-control border border-divider text-ink-soft hover:bg-hover disabled:opacity-30 transition-colors duration-150"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-[13px] text-ink-soft font-tabular">{span} days</span>
                    <button
                      type="button"
                      onClick={() => setSpan(span + 1)}
                      disabled={span >= MAX_SPAN_DAYS}
                      aria-label="One day more"
                      className="h-8 w-8 flex items-center justify-center rounded-control border border-divider text-ink-soft hover:bg-hover disabled:opacity-30 transition-colors duration-150"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Time of day */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-medium text-ink-soft uppercase tracking-wide">Time</span>
              <button
                type="button"
                onClick={() => setTimed((v) => !v)}
                aria-pressed={!timed}
                className={`rounded-capsule border px-2.5 py-1 text-[12px] font-medium transition-colors duration-150 ${
                  timed
                    ? 'border-divider text-ink-soft hover:bg-hover'
                    : 'border-brand bg-selected text-brand'
                }`}
              >
                All day
              </button>
            </div>

            {timed ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  aria-label="Start time"
                  value={minutesToInputValue(startMinute)}
                  onChange={(e) => changeStartTime(e.target.value)}
                  className={`${inputClass} font-tabular`}
                />
                <input
                  type="time"
                  aria-label="End time"
                  value={minutesToInputValue(endMinute)}
                  onChange={(e) => changeEndTime(e.target.value)}
                  className={`${inputClass} font-tabular`}
                />
              </div>
            ) : (
              <p className="text-[13px] text-ink-soft">
                No set time — it’ll sit in the all-day row, above the hours.
              </p>
            )}

            {timed && (
              <p className="text-[12px] text-ink-soft mt-1.5 font-tabular">
                {minutesToLabel(startMinute)} – {minutesToLabel(endMinute)} ·{' '}
                {Math.round(((endMinute - startMinute) / 60) * 10) / 10}h
              </p>
            )}
          </div>

          {/* 3 — The plan itself. Only worth drawing once it's actually a
              split; a single sitting is already fully described above. */}
          {!editing && rows.length > 1 && (
            <div className="mt-4">
              <span className={labelClass}>Plan</span>
              <p className="text-[12.5px] text-ink-soft mb-2">
                {rows.length} sessions · {shortDate(rows[0].date)} –{' '}
                {shortDate(rows[rows.length - 1].date)}
              </p>
              <div className="rounded-card border border-divider divide-y divide-divider overflow-hidden">
                {rows.map((row) => {
                  const first = chapterMap.get(row.chapterIds[0])
                  const extra = row.chapterIds.length - 1
                  return (
                    <div key={row.date} className="flex items-center gap-2.5 px-3 py-2">
                      <span className="shrink-0 w-[52px] text-[12.5px] text-ink-soft font-tabular">
                        {rowDate(row.date)}
                      </span>
                      <span className="min-w-0 flex-1 text-[13.5px] text-ink truncate">
                        {first?.title || 'Study'}
                        {extra > 0 && <span className="text-ink-soft"> +{extra}</span>}
                      </span>
                      {timed && (
                        <span className="shrink-0 text-[12px] text-ink-soft font-tabular">
                          {minutesToLabel(startMinute, { omitMinutes: true })}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setDropped((prev) => new Set(prev).add(row.date))}
                        aria-label={`Drop ${rowDate(row.date)}`}
                        className="shrink-0 h-6 w-6 flex items-center justify-center rounded-[6px] text-ink-soft hover:bg-hover hover:text-ink transition-colors duration-150"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
              {dropped.size > 0 && (
                <button
                  type="button"
                  onClick={() => setDropped(new Set())}
                  className="mt-1.5 text-[12px] font-medium text-brand hover:opacity-80 transition-opacity duration-150"
                >
                  Restore {dropped.size} dropped day{dropped.size === 1 ? '' : 's'}
                </button>
              )}
            </div>
          )}

          {/* Label + colour — overrides, only offered once a block exists */}
          {editing && (
            <>
              <div className="mt-4">
                <label htmlFor="plan-title" className={labelClass}>
                  Label
                </label>
                <input
                  id="plan-title"
                  type="text"
                  value={title}
                  maxLength={80}
                  placeholder={activeChapter?.title || 'Chapter title'}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`${inputClass} placeholder:text-ink-soft`}
                />
                <p className="text-[12px] text-ink-soft mt-1.5">
                  Leave it empty to keep following the chapter’s own title.
                </p>
              </div>

              <div className="mt-4">
                <span className={labelClass}>Colour</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setColor(null)}
                    aria-pressed={!color}
                    aria-label="Match the subject’s colour"
                    className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors duration-150 ${
                      color ? 'border-transparent hover:border-divider' : 'border-brand'
                    }`}
                  >
                    <span
                      className="h-[22px] w-[22px] rounded-full border border-dashed border-ink-soft"
                      style={{ backgroundColor: activeSubjectColor || 'transparent' }}
                    />
                  </button>
                  {SUBJECT_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setColor(hex)}
                      aria-pressed={color === hex}
                      aria-label={`Use colour ${hex}`}
                      className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors duration-150 ${
                        color === hex ? 'border-brand' : 'border-transparent hover:border-divider'
                      }`}
                    >
                      <span className="h-[22px] w-[22px] rounded-full" style={{ backgroundColor: hex }} />
                    </button>
                  ))}
                </div>
                <p className="text-[12px] text-ink-soft mt-1.5">
                  {color ? 'Custom colour for this session.' : 'Following the subject’s colour.'}
                </p>
              </div>
            </>
          )}

          {/* Series scope — only when this block actually has siblings */}
          {editing && seriesCount > 1 && (
            <div className="mt-4">
              <span className={labelClass}>Apply to</span>
              <div className="flex gap-2">
                {[
                  { id: 'single', label: 'This day' },
                  { id: 'series', label: `All ${seriesCount} days` },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setScope(opt.id)}
                    aria-pressed={scope === opt.id}
                    className={`flex-1 rounded-control border px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${
                      scope === opt.id
                        ? 'border-brand bg-selected text-brand'
                        : 'border-divider text-ink-soft hover:bg-hover'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {scope === 'series' && (
                <p className="text-[12px] text-ink-soft mt-1.5">
                  Time, chapters, label and colour apply to every day in the run; each keeps its
                  own date.
                </p>
              )}
            </div>
          )}

          {editing && (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  onDelete(block.id)
                  onClose()
                }}
                className="w-full flex items-center justify-center gap-2 rounded-control border border-divider py-2.5 text-[14px] font-medium text-status-overdue hover:bg-hover transition-colors duration-150"
              >
                <Trash2 size={15} /> Delete this session
              </button>
              {seriesCount > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteSeries(block.id)
                    onClose()
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-control border border-divider py-2.5 text-[14px] font-medium text-status-overdue hover:bg-hover transition-colors duration-150"
                >
                  <Trash2 size={15} /> Delete all {seriesCount} days
                </button>
              )}
            </div>
          )}
        </div>
      </motion.form>
    </motion.div>
  )
}
