import { Check } from 'lucide-react'
import { blockTitle, blockColor, blockChapters } from '../../lib/timeGrid'

// The all-day strip sits above the hour canvas and holds two kinds of entry:
// reviews (read-only, brand-tinted) and untimed study blocks (movable, subject-colored).
// They're deliberately drawn in different visual languages so the grid never
// needs decoding — reviews are Cadence's, blocks are yours.
export default function AllDayStrip({
  reviews,
  untimedBlocks,
  chapterMap,
  subjectMap,
  onToggleDone,
  onOpenBlock,
  compact = false,
}) {
  const entries = [
    ...reviews.map((r) => ({ type: 'review', ...r })),
    ...untimedBlocks.map((b) => ({ type: 'block', ...b })),
  ]

  if (entries.length === 0) return null

  // Day view has the whole page width, so entries sit inline and wrap. A week
  // column is only ~140px, where an inline entry overflows into the next day —
  // there each one becomes a full-width bar on its own row and truncates.
  return (
    <div className={compact ? 'p-1' : 'border-b border-divider bg-surface-2/30 px-2 py-1.5'}>
      <div className={compact ? 'flex flex-col gap-1' : 'flex flex-wrap items-center gap-1.5'}>
        {entries.map((entry) => {
          if (entry.type === 'review') {
            const chapter = chapterMap.get(entry.chapterId)
            const subject = chapter ? subjectMap.get(chapter.subjectId) : null
            if (!chapter) return null
            return (
              <button
                key={`review-${entry.chapterId}`}
                onClick={() => entry.onOpen?.(chapter)}
                title={`Review ${entry.reviewNumber} — ${chapter.title}`}
                className={`inline-flex items-center gap-1 rounded-capsule bg-brand/10 text-brand font-medium hover:bg-brand/15 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                  compact ? 'w-full min-w-0 px-1.5 py-[3px] text-[10.5px]' : 'px-2 py-0.5 text-[11px]'
                }`}
              >
                {subject && (
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: subject.colorTag }} />
                )}
                <span className={`truncate text-left ${compact ? 'min-w-0 flex-1' : 'max-w-[140px]'}`}>
                  {chapter.title}
                </span>
                <span className="shrink-0 text-[10px] opacity-70 font-tabular">
                  {compact ? entry.reviewNumber : `Review ${entry.reviewNumber}`}
                </span>
              </button>
            )
          }

          // Untimed block
          const chapters = blockChapters(entry, chapterMap)
          if (chapters.length === 0) return null
          const subject = subjectMap.get(chapters[0].subjectId)
          const color = blockColor(entry, subject)
          const title = blockTitle(entry, chapters)
          const extra = chapters.length - 1

          return (
            <div
              key={entry.id}
              style={{
                borderLeftColor: color,
                backgroundColor: `color-mix(in srgb, ${color} 11%, var(--color-surface))`,
              }}
              className={`items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-[6px] border-l-[3px] ${
                compact ? 'flex w-full min-w-0' : 'inline-flex'
              } ${entry.done ? 'opacity-50' : ''}`}
            >
              <button
                type="button"
                onClick={() => onToggleDone(entry.id)}
                role="checkbox"
                aria-checked={entry.done}
                aria-label={`Mark ${title} studied`}
                className={`h-[15px] w-[15px] shrink-0 rounded-full border flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                  entry.done ? 'bg-brand border-brand text-white' : 'border-divider bg-surface hover:border-brand/60'
                }`}
              >
                {entry.done && <Check size={9} strokeWidth={3.5} />}
              </button>
              <button
                type="button"
                onClick={() => onOpenBlock(entry)}
                title={extra > 0 ? `${title} +${extra} more` : title}
                className={`font-medium truncate text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-[4px] ${
                  compact ? 'min-w-0 flex-1 text-[11px]' : 'max-w-[160px] text-[11.5px]'
                }`}
              >
                <span className={entry.done ? 'text-ink-soft line-through' : 'text-ink'}>{title}</span>
              </button>
              {extra > 0 && (
                <span className="shrink-0 text-[10.5px] text-ink-soft/70 font-tabular">+{extra}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
