import { Check } from 'lucide-react'
import { formatRange, blockTitle, blockColor } from '../../lib/timeGrid'

// One positioned study block in the hour canvas.
//
// Pointer events, not HTML5 drag-and-drop: HTML5 DnD has no touch support,
// which would leave the phone with no way to move a block at all. A single
// pointerdown handler covers mouse, touch and pen identically, and gives
// continuous feedback while dragging instead of a snapshot on drop.
//
// The parent owns the drag maths (it's the one that knows the grid geometry
// and which day column the pointer is over); this component only reports
// where a gesture started and on which handle.
export default function StudyBlock({
  block,
  chapters, // every chapter this sitting covers, resolved
  subject, // the first chapter's subject — the block's colour
  layout, // { top, height, column, columns } in px / counts
  dragging,
  onPointerDownMove,
  onPointerDownResize,
  onToggleDone,
  onOpen,
}) {
  const color = blockColor(block, subject)
  const title = blockTitle(block, chapters)
  const timed = Number.isFinite(block.startMinute)
  const extra = Math.max(0, chapters.length - 1)

  // Side-by-side packing for overlapping blocks. A 2px gutter keeps the
  // right edge of one block off the left rail of the next.
  const width = `calc(${100 / layout.columns}% - 2px)`
  const left = `calc(${(layout.column * 100) / layout.columns}% + 1px)`

  const timeLabel = timed ? formatRange(block.startMinute, block.endMinute) : 'All day'
  const fullLabel = extra > 0 ? `${timeLabel} — ${title} +${extra} more` : `${timeLabel} — ${title}`

  // At 52px an hour a 45-minute block is 39px tall — a title and a time on
  // separate lines don't fit. Under ~44px the time drops away and only the
  // title survives; under ~26px the checkbox goes too (the block still opens
  // on click, and its sheet carries the same toggle).
  const short = layout.height < 44
  const tiny = layout.height < 26

  return (
    <div
      style={{
        top: layout.top,
        height: Math.max(layout.height, 18),
        width,
        left,
        // A tint of the subject's hue with a solid rail down the left. No
        // border and no shadow: on a ruled grid both read as extra lines.
        borderLeftColor: color,
        backgroundColor: `color-mix(in srgb, ${color} 11%, var(--color-surface))`,
        touchAction: 'none', // a vertical drag moves the block, it doesn't scroll the page
      }}
      className={`group absolute rounded-[6px] border-l-[3px] overflow-hidden select-none transition-opacity duration-150 ${
        dragging ? 'z-20 opacity-90' : 'z-10'
      } ${block.done ? 'opacity-50' : ''}`}
    >
      <div
        onPointerDown={onPointerDownMove}
        className={`h-full w-full cursor-grab active:cursor-grabbing pl-2 pr-1.5 ${
          tiny ? 'py-0' : 'py-1'
        }`}
      >
        <div className={`flex gap-1.5 ${tiny ? 'items-center h-full' : 'items-start'}`}>
          {!tiny && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()} // don't start a drag from the checkbox
              onClick={onToggleDone}
              role="checkbox"
              aria-checked={block.done}
              aria-label={`Mark ${title} studied`}
              className={`mt-[2px] h-[15px] w-[15px] shrink-0 rounded-full border flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                block.done
                  ? 'bg-brand border-brand text-white'
                  : 'border-divider bg-surface hover:border-brand/60'
              }`}
            >
              {block.done && <Check size={9} strokeWidth={3.5} />}
            </button>
          )}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onOpen}
            title={fullLabel}
            className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-[4px]"
          >
            <span
              className={`block text-[12px] leading-[1.35] font-medium truncate ${
                block.done ? 'text-ink-soft line-through' : 'text-ink'
              }`}
            >
              {title}
            </span>
            {!short && (
              <span className="block text-[11px] leading-[1.35] text-ink-soft truncate font-tabular">
                {timeLabel}
              </span>
            )}
            {/* What the block holds beyond its first chapter. Without it a
                two-chapter sitting is indistinguishable from a one-chapter
                one — the title only ever shows the first. */}
            {extra > 0 && !short && (
              <span className="block text-[11px] leading-[1.35] text-ink-soft/70 truncate">
                +{extra} more
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Resize handle — only timed blocks have an end to drag. */}
      {timed && (
        <div
          onPointerDown={onPointerDownResize}
          role="separator"
          aria-label={`Resize ${title}`}
          className="absolute bottom-0 inset-x-0 h-2 cursor-ns-resize group/resize"
        >
          <span className="block mx-auto mt-1 h-[2px] w-6 rounded-full bg-ink-soft/0 group-hover/resize:bg-ink-soft/40 transition-colors duration-150" />
        </div>
      )}
    </div>
  )
}
