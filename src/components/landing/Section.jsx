import { Reveal } from './Reveal'

// Section rhythm lives here so no individual section invents its own padding.
// Sections are separated by space and by a change of surface — never by a rule.
const PAD_TOP = {
  sm: 'pt-16 md:pt-20',
  lg: 'pt-24 md:pt-32',
  xl: 'pt-28 md:pt-40',
}

const PAD_BOTTOM = {
  sm: 'pb-16 md:pb-20',
  lg: 'pb-24 md:pb-32',
  xl: 'pb-28 md:pb-40',
}

// One container width for the whole page — nav, every section, the closing CTA
// and the footer all read off this, so nothing can drift out of alignment.
export const CONTAINER = 'max-w-[76rem] mx-auto px-6 md:px-8'

// `top` lets the band under the hero use a different top padding from its own
// bottom padding, since it meets the hero's padding rather than open space.
export function Section({ id, children, className = '', tone = 'paper', size = 'lg', top = size }) {
  const surface = {
    paper: '',
    // A single step up in lightness reads as a distinct band without a border.
    raised: 'bg-surface/50',
  }[tone]

  return (
    <section id={id} className={`relative scroll-mt-24 ${surface} ${className}`}>
      {tone === 'raised' && (
        // The tint arrives gradually instead of snapping on at a hard edge, so
        // the band starts without reading as a horizontal rule.
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-paper to-transparent"
        />
      )}
      <div className={`relative ${CONTAINER} ${PAD_TOP[top]} ${PAD_BOTTOM[size]}`}>{children}</div>
    </section>
  )
}

export function Eyebrow({ children, className = '' }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-wideish text-brand ${className}`}>
      {children}
    </p>
  )
}

// One heading component for every section: eyebrow, display title, lede.
// `align="center"` is the only variation, so section headers can't drift apart.
export function SectionHead({ eyebrow, title, lede, align = 'left', className = '' }) {
  const centered = align === 'center'
  return (
    <div className={`${centered ? 'text-center mx-auto' : ''} max-w-2xl ${className}`}>
      {eyebrow && (
        <Reveal>
          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <Reveal delay={0.06}>
        <h2 className="font-display text-[32px] md:text-[44px] font-semibold leading-[1.1] tracking-tightest text-balance">
          {title}
        </h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.12}>
          <p
            className={`text-[17px] text-ink-soft leading-relaxed mt-5 ${
              centered ? 'max-w-xl mx-auto' : 'max-w-xl'
            }`}
          >
            {lede}
          </p>
        </Reveal>
      )}
    </div>
  )
}

// Ambient light behind a section. Purely decorative and never interactive, so
// it sits under everything and ignores pointer events.
export function Glow({ className = '', color = 'bg-brand/15', size = 420, drift = true }) {
  return (
    <span
      aria-hidden="true"
      className={`glow-orb ${drift ? 'orb-drift' : ''} ${color} ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
