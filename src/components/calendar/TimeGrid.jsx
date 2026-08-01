import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  HOUR_HEIGHT,
  GUTTER_WIDTH,
  MIN_BLOCK_MINUTES,
  DEFAULT_BLOCK_MINUTES,
  gridHeight,
  hourMarks,
  minutesToLabel,
  minutesToY,
  yToMinutes,
  snapMinutes,
  clampMinute,
  blockChapters,
  layoutOverlaps,
} from '../../lib/timeGrid'
import StudyBlock from './StudyBlock'

// The hour canvas — gutter down the left, one column per visible day, and
// every drag gesture the calendar supports.
//
// This component owns the drag state machine rather than the page, because
// it's the only thing that knows the grid's geometry: turning a pointer
// position into a (date, minute) pair needs the column rect and the scroll
// offset. The page only hears about committed results.
//
// Drag preview is local state, so a pointermove repaints this subtree
// instead of the whole calendar, and nothing is written to storage until
// the pointer comes up.
export default function TimeGrid({
  dates,
  blocksByDate,
  chapterMap,
  subjectMap,
  // The hour range to draw, computed by the view from the blocks it holds.
  // Passed in rather than derived here so the day headers and the all-day
  // band above resolve against exactly the same window.
  window: win,
  onMoveBlock,
  onResizeBlock,
  onCreateAt,
  onToggleDone,
  onOpenBlock,
  // Both Week and Day scroll from one parent element that owns both axes, so
  // the sticky hour gutter and sticky day headers have a scrollport to resolve
  // against. The views pass their own ref here; this component never renders a
  // scroller of its own.
  scrollParentRef,
}) {
  const scrollRef = scrollParentRef
  const columnsRef = useRef(null)
  const didScrollRef = useRef(false)
  const [drag, setDrag] = useState(null)
  // Where a click would land right now, so an empty grid advertises that it's
  // clickable instead of looking like dead space.
  const [hover, setHover] = useState(null)

  const marks = useMemo(() => hourMarks(win), [win])
  const height = gridHeight(win)

  // The window starts at 7am, so on a tall viewport the whole day is already
  // in view and this does nothing. On a short one it opens on the morning
  // rather than at whatever hour the widened window happens to begin.
  useEffect(() => {
    const el = scrollRef?.current
    if (didScrollRef.current || !el) return
    didScrollRef.current = true
    el.scrollTop = Math.max(0, minutesToY(8 * 60, win))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Turns a pointer event into the (date, minute) it's over. Reads the live
   * bounding rect so it stays correct mid-scroll and after a resize, and
   * clamps the column so dragging off the edge lands on the nearest day
   * rather than dropping the gesture.
   */
  const pointToSlot = useCallback(
    (e) => {
      const el = columnsRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      const colWidth = rect.width / dates.length
      const rawCol = Math.floor((e.clientX - rect.left) / colWidth)
      const col = Math.max(0, Math.min(dates.length - 1, rawCol))
      const minute = clampMinute(snapMinutes(yToMinutes(e.clientY - rect.top, win)), win)
      return { date: dates[col], minute }
    },
    [dates, win]
  )

  // Capturing on the columns wrapper (not the block) means every later
  // pointermove/up for this pointer id is delivered here even when the
  // finger leaves the block, the column, or the window entirely — which is
  // exactly what a drag across day columns needs.
  const capture = useCallback((e) => {
    columnsRef.current?.setPointerCapture?.(e.pointerId)
  }, [])

  const handleDownMove = useCallback(
    (e, block) => {
      if (e.button != null && e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      capture(e)
      setHover(null)
      const slot = pointToSlot(e)
      setDrag({
        mode: 'move',
        blockId: block.id,
        pointerId: e.pointerId,
        // Where in the block the user grabbed, so it doesn't jump so its top
        // snaps to the cursor.
        grabOffset: slot ? slot.minute - block.startMinute : 0,
        duration: block.endMinute - block.startMinute,
        moved: false,
        preview: { date: block.date, startMinute: block.startMinute, endMinute: block.endMinute },
      })
    },
    [capture, pointToSlot]
  )

  const handleDownResize = useCallback(
    (e, block) => {
      if (e.button != null && e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      capture(e)
      setHover(null)
      setDrag({
        mode: 'resize',
        blockId: block.id,
        pointerId: e.pointerId,
        moved: false,
        preview: { date: block.date, startMinute: block.startMinute, endMinute: block.endMinute },
      })
    },
    [capture]
  )

  const handleDownCanvas = useCallback(
    (e, date) => {
      if (e.button != null && e.button !== 0) return
      e.preventDefault()
      capture(e)
      setHover(null)
      const slot = pointToSlot(e)
      if (!slot) return
      setDrag({
        mode: 'create',
        pointerId: e.pointerId,
        anchor: slot.minute,
        moved: false,
        preview: { date, startMinute: slot.minute, endMinute: slot.minute },
      })
    },
    [capture, pointToSlot]
  )

  const handlePointerMove = useCallback(
    (e) => {
      if (!drag) {
        // Only the bare canvas advertises a create slot — over a block the
        // cursor already means "grab", and a ghost row underneath it would
        // just be noise.
        if (e.target?.dataset?.canvas !== 'true') {
          setHover((prev) => (prev ? null : prev))
          return
        }
        const slot = pointToSlot(e)
        setHover((prev) =>
          prev && prev.date === slot?.date && prev.minute === slot?.minute ? prev : slot
        )
        return
      }
      if (e.pointerId !== drag.pointerId) return
      const slot = pointToSlot(e)
      if (!slot) return

      setDrag((prev) => {
        if (!prev) return prev
        if (prev.mode === 'move') {
          // Keep the whole block inside the window, and keep its length.
          const start = Math.min(
            Math.max(win.startMinute, slot.minute - prev.grabOffset),
            win.endMinute - prev.duration
          )
          const next = { date: slot.date, startMinute: start, endMinute: start + prev.duration }
          const moved =
            prev.moved || next.date !== prev.preview.date || next.startMinute !== prev.preview.startMinute
          return { ...prev, moved, preview: next }
        }
        if (prev.mode === 'resize') {
          const end = Math.max(prev.preview.startMinute + MIN_BLOCK_MINUTES, slot.minute)
          return {
            ...prev,
            moved: prev.moved || end !== prev.preview.endMinute,
            preview: { ...prev.preview, endMinute: Math.min(end, win.endMinute) },
          }
        }
        // create — the anchor stays put and the other edge follows the pointer
        const start = Math.min(prev.anchor, slot.minute)
        const end = Math.max(prev.anchor, slot.minute)
        return {
          ...prev,
          moved: prev.moved || end - start >= MIN_BLOCK_MINUTES,
          preview: { ...prev.preview, startMinute: start, endMinute: end },
        }
      })
    },
    [drag, pointToSlot, win]
  )

  const handlePointerUp = useCallback(
    (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return
      const { mode, blockId, preview, moved } = drag
      setDrag(null)

      if (mode === 'create') {
        // A plain click (no meaningful drag) still creates — at the default
        // length, starting where they clicked.
        const start = preview.startMinute
        const end = moved
          ? preview.endMinute
          : Math.min(start + DEFAULT_BLOCK_MINUTES, win.endMinute)
        if (end - start < MIN_BLOCK_MINUTES) return
        onCreateAt({ date: preview.date, startMinute: start, endMinute: end })
        return
      }

      if (!moved) return // a click that didn't move shouldn't write anything
      if (mode === 'move') onMoveBlock(blockId, { date: preview.date, startMinute: preview.startMinute })
      else onResizeBlock(blockId, preview.endMinute)
    },
    [drag, onCreateAt, onMoveBlock, onResizeBlock, win]
  )

  // Blocks positioned per column, with the in-flight drag applied so the
  // block follows the pointer before anything is committed.
  const columns = useMemo(() => {
    return dates.map((iso) => {
      let items = (blocksByDate.get(iso) || []).filter(
        (b) => Number.isFinite(b.startMinute) && Number.isFinite(b.endMinute)
      )

      if (drag?.blockId) {
        // The dragged block renders from the preview, and moves between
        // columns as the preview's date changes.
        items = items.filter((b) => b.id !== drag.blockId)
        if (drag.preview.date === iso) {
          const source = dates
            .flatMap((d) => blocksByDate.get(d) || [])
            .find((b) => b.id === drag.blockId)
          if (source) items = [...items, { ...source, ...drag.preview }]
        }
      }

      const laid = layoutOverlaps(items).map((b) => ({
        ...b,
        top: minutesToY(b.startMinute, win),
        height: minutesToY(b.endMinute, win) - minutesToY(b.startMinute, win),
      }))
      return { iso, laid }
    })
  }, [dates, blocksByDate, drag, win])

  return (
    <div className="flex" style={{ height }}>
      {/* Hour gutter — scrolls with the canvas so labels stay aligned, and
          stays pinned while a narrow week pans sideways. Above the columns so
          nothing slides over the labels, but below the day headers, which pin
          on the other axis in the same scrollport. */}
      <div
        style={{ width: GUTTER_WIDTH }}
        className="relative shrink-0 select-none sticky left-0 z-40 bg-surface"
      >
        {/* The first and last marks are the window's own edges — a label there
            would sit half outside the grid. */}
        {marks.slice(1, -1).map((m) => (
          <span
            key={m}
            style={{ top: minutesToY(m, win) }}
            className="absolute right-3 -translate-y-1/2 text-[11px] text-ink-soft/60 font-tabular whitespace-nowrap"
          >
            {minutesToLabel(m, { omitMinutes: true })}
          </span>
        ))}
      </div>

      {/* Day columns */}
      <div
        ref={columnsRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHover(null)}
        className="flex-1 flex relative"
        style={{ touchAction: drag ? 'none' : 'auto' }}
      >
        {/* One rule per hour, and nothing between them. At 52px an hour the
            eye reads a block's start off its position; a second :30 weight
            just doubles the number of lines on the page. */}
        {marks.map((m) => (
          <span
            key={m}
            style={{ top: minutesToY(m, win) }}
            className="absolute inset-x-0 border-t border-divider/60 pointer-events-none"
          />
        ))}

        {columns.map(({ iso, laid }) => (
          <div key={iso} className="flex-1 min-w-0 relative border-l border-divider/60 first:border-l-0">
            {/* Empty canvas: drag (or click) to create. Sits under the
                blocks, which stop pointerdown from reaching it. */}
            <div
              data-canvas="true"
              onPointerDown={(e) => handleDownCanvas(e, iso)}
              className="absolute inset-0"
              style={{ touchAction: 'none' }}
              aria-hidden="true"
            />

            {/* Where a click would land — a plain tint at the size of what
                you'd get. No icon, no time label: the affordance is the shape,
                and the hour is already legible in the gutter. */}
            {!drag && hover?.date === iso && (
              <div
                style={{
                  top: minutesToY(hover.minute, win),
                  height:
                    minutesToY(Math.min(hover.minute + DEFAULT_BLOCK_MINUTES, win.endMinute), win) -
                    minutesToY(hover.minute, win),
                }}
                className="absolute inset-x-[3px] rounded-[6px] bg-brand/[0.06] pointer-events-none z-[5]"
              />
            )}

            {/* In-flight create preview */}
            {drag?.mode === 'create' && drag.preview.date === iso && (
              <div
                style={{
                  top: minutesToY(drag.preview.startMinute, win),
                  height: Math.max(
                    minutesToY(drag.preview.endMinute, win) - minutesToY(drag.preview.startMinute, win),
                    2
                  ),
                }}
                className="absolute inset-x-[3px] rounded-[6px] bg-brand/15 pointer-events-none z-10"
              />
            )}

            {laid.map((b) => {
              const chapters = blockChapters(b, chapterMap)
              if (chapters.length === 0) return null
              return (
                <StudyBlock
                  key={b.id}
                  block={b}
                  chapters={chapters}
                  subject={subjectMap.get(chapters[0].subjectId)}
                  layout={{ top: b.top, height: b.height, column: b.column, columns: b.columns }}
                  dragging={drag?.blockId === b.id}
                  onPointerDownMove={(e) => handleDownMove(e, b)}
                  onPointerDownResize={(e) => handleDownResize(e, b)}
                  onToggleDone={() => onToggleDone(b.id)}
                  onOpen={() => onOpenBlock(b)}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
