import { useMemo } from 'react'
import { toISODate, startOfDay } from '../../lib/srs'
import { monthMatrix } from '../../lib/timeGrid'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * The rail's month picker. Deliberately not a shrunken MonthView: at 28px a
 * cell there's no room for anything but the number, so load is a single dot
 * under it and the week you're looking at is shown as a tinted row — which is
 * the one thing a mini-month has to answer that the big grid can't ("where am
 * I?").
 */
export default function MiniMonth({ cursorDate, weekDates, loadByDate, onSelectDate, onShiftMonth }) {
  const todayISO = useMemo(() => toISODate(new Date()), [])
  const { year, month } = useMemo(() => {
    const d = startOfDay(cursorDate)
    return { year: d.getFullYear(), month: d.getMonth() }
  }, [cursorDate])

  const cells = useMemo(() => monthMatrix(year, month), [year, month])
  const inWeek = useMemo(() => new Set(weekDates), [weekDates])

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2 pl-1">
        <p className="font-display text-[13.5px] font-semibold text-ink">
          {new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onShiftMonth(-1)}
            aria-label="Previous month"
            className="h-6 w-6 flex items-center justify-center rounded-[6px] text-ink-soft hover:bg-hover hover:text-ink transition-colors duration-150 text-[13px] leading-none"
          >
            ‹
          </button>
          <button
            onClick={() => onShiftMonth(1)}
            aria-label="Next month"
            className="h-6 w-6 flex items-center justify-center rounded-[6px] text-ink-soft hover:bg-hover hover:text-ink transition-colors duration-150 text-[13px] leading-none"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[9.5px] text-ink-soft/70 font-medium pb-1">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          const iso = toISODate(cell.date)
          const isToday = iso === todayISO
          const selected = inWeek.has(iso)
          const load = loadByDate.get(iso) || 0
          // Both this grid and the week are Sunday-first, so a selected week is
          // always exactly one row — the band's ends are the row's ends.
          const col = i % 7
          return (
            <button
              key={i}
              onClick={() => onSelectDate(iso)}
              className={`relative h-[26px] flex items-start justify-center pt-[3px] text-[11px] font-tabular transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/50 ${
                // The current week reads as one continuous band with rounded
                // ends — seven separately-rounded cells would look like seven
                // selections rather than one range.
                selected
                  ? `bg-selected ${col === 0 ? 'rounded-l-[6px]' : ''} ${col === 6 ? 'rounded-r-[6px]' : ''}`
                  : 'rounded-[6px] hover:bg-hover'
              }`}
            >
              <span
                className={
                  isToday
                    ? 'h-[17px] w-[17px] rounded-full bg-brand text-white font-semibold inline-flex items-center justify-center'
                    : cell.inMonth
                    ? 'text-ink'
                    : 'text-ink-soft/40'
                }
              >
                {cell.date.getDate()}
              </span>
              {load > 0 && cell.inMonth && !isToday && (
                <span className="absolute bottom-[3px] h-[3px] w-[3px] rounded-full bg-brand/50" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
