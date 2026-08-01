import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import Logo from '../Logo'
import { NAV_LINKS, focusRing } from './links'
import { EASE } from './anim'

// The header only grows a background once you've left the hero — at the top
// it's invisible so the hero reads full-bleed. The hairline it gains when
// pinned is the one rule on the page, and it earns it: without something to
// sit on, blurred text scrolling under blurred text looks broken.
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 })

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // A menu that stays open behind you after you've jumped to a section is a
  // bug, so any navigation closes it.
  function close() {
    setOpen(false)
  }

  return (
    <header
      className={`sticky top-0 z-30 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || open
          ? 'bg-paper/75 backdrop-blur-xl border-b border-divider/70'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[76rem] mx-auto flex items-center justify-between px-6 md:px-8 h-16">
        <a href="#top" className={`rounded-control ${focusRing}`} aria-label="Cadence — back to top">
          <Logo size={26} />
        </a>

        <nav className="hidden md:flex items-center gap-1" aria-label="Page sections">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`relative text-[13.5px] font-medium text-ink-soft hover:text-ink transition-colors duration-180 rounded-capsule px-3.5 py-2 hover:bg-hover ${focusRing}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className={`hidden sm:inline-flex text-[13.5px] font-medium text-ink-soft hover:text-ink transition-colors duration-180 rounded-capsule px-3 py-2 hover:bg-hover ${focusRing}`}
          >
            Log in
          </Link>
          <Link
            to="/login"
            className={`inline-flex items-center gap-1.5 rounded-capsule bg-brand text-white text-[13.5px] font-medium px-4 py-2 transition-transform duration-180 hover:scale-[1.03] active:scale-[0.97] ${focusRing}`}
          >
            Get started <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className={`md:hidden h-9 w-9 -mr-1.5 rounded-capsule flex items-center justify-center text-ink-soft hover:bg-hover transition-colors ${focusRing}`}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Read-progress hairline. It doubles as the header's bottom edge once
          you're scrolling, which is why it lives flush at the bottom. */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="absolute bottom-0 inset-x-0 h-px bg-brand origin-left"
      />

      {open && (
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="md:hidden px-6 pb-4 pt-1 flex flex-col"
          aria-label="Page sections"
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={close}
              className={`text-[15px] font-medium text-ink-soft hover:text-ink py-2.5 rounded-control ${focusRing}`}
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            onClick={close}
            className={`text-[15px] font-medium text-ink-soft hover:text-ink py-2.5 rounded-control sm:hidden ${focusRing}`}
          >
            Log in
          </Link>
        </motion.nav>
      )}
    </header>
  )
}
