import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { Reveal } from './Reveal'
import { EASE } from './anim'
import { focusRing } from './links'

// The three steps, told as a scroll story: the copy column scrolls, the mock
// column is pinned. Each step is a real screen the user will meet on day one,
// so "how it works" is a tour rather than a diagram.

function StepCard({ children }) {
  return (
    <div className="rounded-card bg-surface border border-divider shadow-elevated p-5">{children}</div>
  )
}

const STEPS = [
  {
    n: 1,
    title: 'Add the chapter the day you study it',
    body: 'Pick the subject, type the title, save. That is the only typing Cadence ever asks for, and it takes about ten seconds.',
    mock: (
      <StepCard>
        <p className="text-[11px] font-semibold uppercase tracking-wideish text-ink-soft mb-3">
          New chapter
        </p>
        <div className="space-y-2.5">
          <div className="rounded-control bg-surface-2/50 px-3 py-2.5">
            <p className="text-[10px] text-ink-soft mb-0.5">Subject</p>
            <p className="text-[13px] font-medium">Higher Math</p>
          </div>
          <div className="rounded-control bg-surface-2/50 px-3 py-2.5 ring-1 ring-brand/30">
            <p className="text-[10px] text-ink-soft mb-0.5">Chapter</p>
            <p className="text-[13px] font-medium">
              Coordinate Geometry
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-px h-[13px] align-middle bg-brand ml-0.5"
              />
            </p>
          </div>
        </div>
        <div className="mt-3.5 rounded-capsule bg-brand text-white text-[12px] font-medium py-2 text-center">
          Save chapter
        </div>
      </StepCard>
    ),
  },
  {
    n: 2,
    title: 'Four review dates appear on their own',
    body: 'Tomorrow, then three days later, then a week, then a month. You do not choose the dates and you cannot get them wrong, because there is nothing to configure.',
    mock: (
      <StepCard>
        <p className="text-[11px] font-semibold uppercase tracking-wideish text-ink-soft mb-3">
          Scheduled automatically
        </p>
        <div className="space-y-2">
          {[
            ['Review 1', 'Tomorrow', 'Day 1'],
            ['Review 2', 'Fri 12 Sep', 'Day 4'],
            ['Review 3', 'Fri 19 Sep', 'Day 11'],
            ['Review 4', 'Sun 19 Oct', 'Day 41'],
          ].map(([label, when, day], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.09, ease: EASE }}
              className="flex items-center gap-3 rounded-chip bg-surface-2/40 px-3 py-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
              <p className="text-[12px] font-medium flex-1">{label}</p>
              <p className="text-[11.5px] text-ink-soft font-tabular">{when}</p>
              <span className="text-[10px] font-semibold text-brand bg-brand/10 rounded-full px-1.5 py-0.5 font-tabular">
                {day}
              </span>
            </motion.div>
          ))}
        </div>
      </StepCard>
    ),
  },
  {
    n: 3,
    title: 'Clear the short list each morning',
    body: 'Open Today, revise what is due straight from your own notes, tick it off. When the list is empty you are finished for the day, and that is the whole system.',
    mock: (
      <StepCard>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wideish text-ink-soft">Today</p>
          <p className="text-[11px] text-brand font-medium font-tabular">1 left</p>
        </div>
        <div className="space-y-2">
          {[
            ['Periodic Trends', true],
            ['Vector Algebra', true],
            ['Coordinate Geometry', false],
          ].map(([title, done]) => (
            <div
              key={title}
              className={`flex items-center gap-2.5 rounded-chip px-3 py-2.5 ${
                done ? 'bg-surface-2/40' : 'bg-surface border border-divider'
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                  done ? 'bg-brand' : 'border-[1.5px] border-ink-soft/40'
                }`}
              >
                {done && <Check size={9} strokeWidth={3.5} className="text-white" />}
              </span>
              <p
                className={`text-[12.5px] font-medium truncate ${
                  done ? 'text-ink-soft line-through' : ''
                }`}
              >
                {title}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-ink-soft mt-3.5 text-center">Roughly six minutes of work.</p>
      </StepCard>
    ),
  },
]

// Each copy block reports when it's the one under the reader's eye. The
// narrow viewport margin means only the block crossing the middle band counts,
// so `active` is a single index rather than "everything on screen".
function useActiveStep(count) {
  const refs = useRef([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    const nodes = refs.current.filter(Boolean)
    if (nodes.length === 0 || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry nearest the middle of the band rather than the first
        // one to fire — two steps can straddle it during a fast scroll.
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const best = visible.reduce((a, b) => (b.intersectionRatio > a.intersectionRatio ? b : a))
        const i = nodes.indexOf(best.target)
        if (i >= 0) setActive(i)
      },
      { rootMargin: '-30% 0px -40% 0px', threshold: [0, 0.25, 0.5, 1] }
    )
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [count])

  return [refs, active]
}

export default function HowItWorks() {
  const [refs, active] = useActiveStep(STEPS.length)

  return (
    <div className="grid md:grid-cols-2 gap-x-16 gap-y-14 mt-16 md:mt-20">
      {/* Copy column: one long scroll of three beats. The trailing padding is
          load-bearing — a sticky child unpins when its own bottom reaches the
          bottom of its container, so without extra room below the last step
          the mock would slide away just as step 3 comes up. */}
      <div className="space-y-14 md:space-y-52 md:pb-56">
        {STEPS.map((s, i) => (
          <Reveal key={s.n}>
            <div ref={(el) => (refs.current[i] = el)}>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`h-7 w-7 rounded-full font-tabular text-[12.5px] font-semibold flex items-center justify-center transition-colors duration-300 ${
                    active === i ? 'bg-brand text-white' : 'bg-brand/10 text-brand'
                  }`}
                >
                  {s.n}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wideish text-ink-soft">
                  Step {s.n} of 3
                </span>
              </div>
              <h3 className="font-display text-[24px] md:text-[28px] font-semibold leading-tight tracking-tight mb-3.5 max-w-sm">
                {s.title}
              </h3>
              <p className="text-[15.5px] text-ink-soft leading-relaxed max-w-md">{s.body}</p>

              {/* Below md the pinned column is dropped, so each step carries
                  its own mock inline instead. */}
              <div className="md:hidden mt-6 max-w-sm">{s.mock}</div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Mock column: pinned, so the screens swap under a fixed gaze while the
          copy scrolls past. Only on md+, where there is height to spare. */}
      <div className="hidden md:block">
        <div className="sticky top-28 h-[440px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={STEPS[active].n}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.38, ease: EASE }}
            >
              {STEPS[active].mock}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export function StepsCta() {
  return (
    <Reveal className="mt-16 md:mt-24" delay={0.05}>
      <a
        href="#schedule"
        className={`inline-flex items-center gap-2 text-[15px] font-medium text-brand rounded-control transition-colors duration-180 hover:text-brand-soft ${focusRing}`}
      >
        Why those four dates <ArrowRight size={15} />
      </a>
    </Reveal>
  )
}
