import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, MotionConfig } from 'framer-motion'
import { ArrowRight, Download, Sparkles } from 'lucide-react'
import Logo from '../components/Logo'
import HeroPreview from '../components/HeroPreview'
import RhythmTimeline from '../components/RhythmTimeline'
import ForgettingCurve from '../components/ForgettingCurve'
import LandingNav from '../components/landing/LandingNav'
import HowItWorks, { StepsCta } from '../components/landing/HowItWorks'
import AppTour from '../components/landing/AppTour'
import WhySection from '../components/landing/WhySection'
import Faq from '../components/landing/Faq'
import { Glow, Section, SectionHead } from '../components/landing/Section'
import { Reveal, Stagger } from '../components/landing/Reveal'
import { fadeUp, group, transition } from '../components/landing/anim'
import { NAV_LINKS, focusRing } from '../components/landing/links'

const primaryCta =
  'inline-flex items-center gap-2 rounded-capsule bg-brand text-white font-medium shadow-fab transition-transform duration-180 hover:scale-[1.02] active:scale-[0.98]'
const secondaryCta =
  'inline-flex items-center gap-2 rounded-capsule border border-divider font-medium transition-colors duration-180 hover:bg-surface hover:border-ink-soft/25'

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    function onBeforeInstall(e) {
      e.preventDefault()
      setInstallPrompt(e)
    }
    function onInstalled() {
      setInstalled(true)
      setInstallPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const canInstall = installPrompt && !installed

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-paper text-ink overflow-x-clip">
        <LandingNav />

        {/* ================= Hero ================= */}
        <section id="top" className="relative scroll-mt-24">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <Glow className="-top-48 -left-40" size={520} color="bg-brand/20" />
            <Glow className="top-0 right-[-180px]" size={440} color="bg-accent/15" />
            <span
              aria-hidden="true"
              className="dot-field absolute inset-0 text-ink-soft/[0.14] opacity-70"
            />
          </div>

          <div className="max-w-6xl mx-auto px-6 md:px-8 pt-12 md:pt-20 pb-24 md:pb-36 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-16 lg:gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={group(0.09)}>
              <motion.div variants={fadeUp} transition={transition(0.5)}>
                <span className="inline-flex items-center gap-2 rounded-capsule bg-brand/10 text-brand text-[12.5px] font-medium pl-2.5 pr-3.5 py-1.5 mb-7">
                  <Sparkles size={13} />
                  Free for the first 100 users
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                transition={transition(0.65)}
                className="font-display text-[44px] sm:text-[54px] lg:text-[62px] font-semibold leading-[1.03] tracking-tightest mb-6 text-balance"
              >
                Know <em className="font-medium">exactly</em> what to revise today.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                transition={transition(0.55)}
                className="text-[18px] md:text-[19px] leading-relaxed text-ink-soft mb-9 max-w-lg"
              >
                Add a chapter the day you study it. Cadence schedules four short
                reviews — 1, 3, 7 and 30 days later — and tells you which ones
                are due each morning. No flashcards, no decks, no setup.
              </motion.p>

              <motion.div
                variants={fadeUp}
                transition={transition(0.5)}
                className="flex flex-wrap items-center gap-3"
              >
                <Link to="/login" className={`${primaryCta} px-6 py-3.5 text-[15px] ${focusRing}`}>
                  Start free <ArrowRight size={16} />
                </Link>
                <a href="#how" className={`${secondaryCta} px-6 py-3.5 text-[15px] ${focusRing}`}>
                  See how it works
                </a>
                {canInstall && (
                  <button
                    onClick={handleInstall}
                    className={`${secondaryCta} px-6 py-3.5 text-[15px] ${focusRing}`}
                  >
                    <Download size={16} /> Install app
                  </button>
                )}
              </motion.div>
            </motion.div>

            <div className="flex justify-center lg:justify-end lg:pb-4">
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* ================= How it works ================= */}
        <Section id="how" tone="raised" size="xl">
          <SectionHead
            eyebrow="How it works"
            title="Ten seconds of typing a day. Cadence keeps the schedule."
            lede="There is no system to learn and nothing to configure. Three small habits, and the app carries the rest."
          />
          <HowItWorks />
          <StepsCta />
        </Section>

        {/* ================= The schedule ================= */}
        <Section id="schedule" size="xl" className="overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <Glow className="top-24 -right-40" size={460} color="bg-brand/12" />
          </div>

          <SectionHead
            eyebrow="The schedule"
            title="One chapter, four reviews, six weeks."
            lede="Every gap is wider than the last, because each review makes the memory hold for longer. Clear the fourth and the chapter is marked mastered."
          />

          <Reveal delay={0.1} className="mt-16 md:mt-20">
            <RhythmTimeline />
          </Reveal>

          {/* The chart carries the argument, so it gets the wider column. */}
          <div className="grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-10 md:gap-16 items-center mt-20 md:mt-28">
            <Reveal>
              <h3 className="font-display text-[24px] md:text-[30px] font-semibold tracking-tight leading-tight mb-4">
                Timed to catch you just before you forget
              </h3>
              <p className="text-[15.5px] text-ink-soft leading-relaxed max-w-md">
                You lose most of a chapter in the first few days, then the
                decline flattens out. Each review arrives just before the drop
                and takes recall back to full — and buys more time than the one
                before it, which is exactly why the gaps grow.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <ForgettingCurve />
            </Reveal>
          </div>
        </Section>

        {/* ================= Why it works ================= */}
        <Section tone="raised" size="xl">
          <WhySection />
        </Section>

        {/* ================= Inside the app ================= */}
        <Section id="tour" size="xl">
          <SectionHead
            eyebrow="Inside the app"
            title="Four screens. Nothing you have to learn."
            lede="Today is where you live. The rest is there when you want to look ahead, time a session, or check that the work is adding up."
          />
          <AppTour />
        </Section>

        {/* ================= FAQ ================= */}
        <Section id="faq" tone="raised" size="xl">
          <div className="grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.35fr)] gap-10 md:gap-16 items-start">
            <div className="md:sticky md:top-28">
              <Reveal>
                <p className="text-[11px] font-semibold uppercase tracking-wideish text-brand mb-4">
                  FAQ
                </p>
                <h2 className="font-display text-[32px] md:text-[42px] font-semibold leading-[1.1] tracking-tightest mb-5">
                  Fair questions.
                </h2>
                <p className="text-[15.5px] text-ink-soft leading-relaxed max-w-xs mb-7">
                  Short version: it is not a flashcard app, missing a day does
                  not break anything, and it is free while we are getting
                  started.
                </p>
                <Link
                  to="/login"
                  className={`inline-flex items-center gap-2 text-[15px] font-medium text-brand rounded-control transition-colors duration-180 hover:text-brand-soft ${focusRing}`}
                >
                  Still curious? Try it free <ArrowRight size={15} />
                </Link>
              </Reveal>
            </div>
            <Faq />
          </div>
        </Section>

        {/* ================= Closing CTA ================= */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <Glow
              className="-bottom-56 left-1/2 -translate-x-1/2"
              size={620}
              color="bg-brand/18"
            />
          </div>
          <div className="max-w-6xl mx-auto px-6 md:px-8 py-28 md:py-40 text-center">
            <Stagger stagger={0.09}>
              <Stagger.Item>
                <h2 className="font-display text-[36px] md:text-[52px] font-semibold leading-[1.06] tracking-tightest max-w-2xl mx-auto text-balance">
                  Start with the chapter you studied today.
                </h2>
              </Stagger.Item>
              <Stagger.Item>
                <p className="text-[17px] text-ink-soft mt-6 mb-10 max-w-md mx-auto leading-relaxed">
                  Adding it takes ten seconds, and your first review is
                  tomorrow. Free for the first 100 accounts.
                </p>
              </Stagger.Item>
              <Stagger.Item>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/login"
                    className={`${primaryCta} px-7 py-4 text-[15px] ${focusRing}`}
                  >
                    Create your free account <ArrowRight size={16} />
                  </Link>
                  {canInstall && (
                    <button
                      onClick={handleInstall}
                      className={`${secondaryCta} px-7 py-4 text-[15px] ${focusRing}`}
                    >
                      <Download size={16} /> Install app
                    </button>
                  )}
                </div>
              </Stagger.Item>
            </Stagger>
          </div>
        </section>

        {/* ================= Footer ================= */}
        <footer>
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <div className="fade-rule" />
            <div className="py-14 flex flex-col sm:flex-row sm:items-start justify-between gap-10">
              <div>
                <Logo size={24} />
                <p className="text-[14px] text-ink-soft mt-4 max-w-[260px] leading-relaxed">
                  A review planner for students. Add a chapter, and Cadence
                  tells you when to go over it again.
                </p>
              </div>
              <nav className="flex flex-wrap gap-x-10 gap-y-3 text-[14px]" aria-label="Footer">
                {[...NAV_LINKS, { href: '/login', label: 'Log in', route: true }].map((l) =>
                  l.route ? (
                    <Link
                      key={l.label}
                      to={l.href}
                      className={`text-ink-soft hover:text-ink transition-colors duration-180 rounded-control ${focusRing}`}
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      key={l.label}
                      href={l.href}
                      className={`text-ink-soft hover:text-ink transition-colors duration-180 rounded-control ${focusRing}`}
                    >
                      {l.label}
                    </a>
                  )
                )}
              </nav>
            </div>
            <div className="pb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12.5px] text-ink-soft">
              <span>© 2026 Cadence</span>
              <span>Made for students who’d rather study than plan.</span>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  )
}
