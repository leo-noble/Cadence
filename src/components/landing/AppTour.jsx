import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, LibraryBig, LineChart, Timer } from 'lucide-react'
import AppFrame from './AppFrame'
import { Reveal } from './Reveal'
import { EASE } from './anim'
import { focusRing } from './links'
import { FocusMock, LibraryMock, PlanMock, StreakMock } from './ScreenMocks'

// "Inside the app" — a tabbed tour instead of a grid of icon cards. Four
// screens is small enough that showing them beats describing them, and one
// large mock at a time keeps the section from turning into a feature wall.
const TABS = [
  {
    id: 'library',
    icon: LibraryBig,
    label: 'Library',
    title: 'Your whole syllabus, by subject',
    body: 'Every chapter you have added, grouped under its subject and marked due, upcoming, or mastered. This is the list you check when you want to know where you actually stand.',
    mock: <LibraryMock />,
  },
  {
    id: 'plan',
    icon: CalendarDays,
    label: 'Plan',
    title: 'See the busy weeks coming',
    body: 'Reviews land on real dates, so you can look a fortnight ahead and spot the day with five of them on it. Block out study time and drag it around until the week fits.',
    mock: <PlanMock />,
  },
  {
    id: 'focus',
    icon: Timer,
    label: 'Focus',
    title: 'Time a session without leaving',
    body: 'Start the timer against the chapter you are revising. It logs to that chapter when you finish, so your history reflects work done rather than boxes ticked.',
    mock: <FocusMock />,
  },
  {
    id: 'stats',
    icon: LineChart,
    label: 'Progress',
    title: 'Proof that it is adding up',
    body: 'Reviews cleared, chapters mastered, and the days you turned up. Enough to see the habit forming, without turning revision into a scoreboard.',
    mock: <StreakMock />,
  },
]

export default function AppTour() {
  const [active, setActive] = useState('library')
  const tab = TABS.find((t) => t.id === active) || TABS[0]

  return (
    <div className="mt-12 md:mt-14">
      {/* Tab strip. The moving pill is a shared layout element, so switching
          tabs slides rather than cutting. */}
      <Reveal>
        <div
          role="tablist"
          aria-label="App screens"
          className="inline-flex flex-wrap gap-1 p-1 rounded-capsule bg-surface-2/60"
        >
          {TABS.map((t) => {
            const selected = t.id === active
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(t.id)}
                className={`relative inline-flex items-center gap-2 rounded-capsule px-4 py-2 text-[13.5px] font-medium transition-colors duration-200 ${focusRing} ${
                  selected ? 'text-ink' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="tour-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-capsule bg-surface shadow-soft"
                  />
                )}
                <t.icon size={15} className={`relative ${selected ? 'text-brand' : ''}`} />
                <span className="relative">{t.label}</span>
              </button>
            )
          })}
        </div>
      </Reveal>

      <Reveal delay={0.08} className="mt-8">
        <div className="grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-10 md:gap-14 items-center">
          {/* Copy. Crossfades in place — a slide here would fight the mock. */}
          <div className="min-h-[180px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <h3 className="font-display text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight mb-4">
                  {tab.title}
                </h3>
                <p className="text-[15.5px] text-ink-soft leading-relaxed max-w-md">{tab.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.34, ease: EASE }}
            >
              <AppFrame label={tab.label}>
                {/* A fixed content height across all four screens: without it
                    the frame resizes on every tab change and the section below
                    jumps, which reads as jank rather than as a switch. */}
                <div className="min-h-[336px] flex flex-col justify-center">{tab.mock}</div>
              </AppFrame>
            </motion.div>
          </AnimatePresence>
        </div>
      </Reveal>
    </div>
  )
}
