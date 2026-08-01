import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Reveal } from './Reveal'
import { EASE } from './anim'
import { focusRing } from './links'

// Each question is its own card rather than a row in a divided list — the
// separation comes from the gap between cards, so there are no rules to look
// at. Height animates on open, which a <details> element can't do.
const ITEMS = [
  {
    q: 'Do I have to make flashcards?',
    a: 'No, and that is the point. Cadence plans your revision but never stores it — you read from the textbook and notes you already have. It tells you which chapter and which day; the studying stays yours.',
  },
  {
    q: 'Why 1, 3, 7, and 30 days?',
    a: 'Each date lands just before the point where you would start losing the chapter. Going over it right then makes the memory hold for longer, which is what earns the next, wider gap. By the fourth review most chapters stay with you without further work.',
  },
  {
    q: 'What happens if I miss a day?',
    a: 'Nothing breaks and nothing resets. Missed reviews move to the top of Today marked overdue, and the dates after them stay where they were. If you know a day is going to be impossible, you can push a review back — twice at most, so it cannot drift forever.',
  },
  {
    q: 'How long does this actually take each day?',
    a: 'A few minutes. You usually have two to four chapters due, and a review is re-reading something you already know rather than learning it again. The longest part of the day is adding whatever you studied, which is one line of typing.',
  },
  {
    q: 'Does it work on my phone?',
    a: 'Yes. Cadence runs in the browser and installs to your home screen like a normal app, offline included. There is nothing to download from an app store, and signing in on a second device brings your chapters with you.',
  },
  {
    q: 'Is it free?',
    a: 'Free for the first 100 users, with no trial and no card. Cadence will be a paid product later, but if you are one of the first hundred accounts you keep full access. The account only exists so your chapters sync between devices.',
  },
]

function Item({ item, open, onToggle }) {
  return (
    <div
      className={`rounded-card bg-surface border transition-colors duration-200 ${
        open ? 'border-brand/30' : 'border-divider hover:border-ink-soft/25'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-4 text-left px-5 py-4 rounded-card ${focusRing}`}
      >
        <span className="text-[15px] font-medium">{item.q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.22, ease: EASE }}
          className={`shrink-0 ${open ? 'text-brand' : 'text-ink-soft'}`}
        >
          <Plus size={17} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="text-[14.5px] text-ink-soft leading-relaxed px-5 pb-5 pr-10">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Faq() {
  // Single-open accordion: with six questions, letting them all stand open
  // turns the section into a wall of text and loses the scannable list.
  const [open, setOpen] = useState(null)

  return (
    <div className="space-y-2.5">
      {ITEMS.map((item, i) => (
        <Reveal key={item.q} delay={Math.min(i, 3) * 0.05}>
          <Item item={item} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
        </Reveal>
      ))}
    </div>
  )
}
