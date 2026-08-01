import { Reveal } from './Reveal'

// Section rhythm lives here so no individual section invents its own padding.
// Sections are separated by space and by a change of surface — never by a rule.
export function Section({ id, children, className = '', tone = 'paper', size = 'lg' }) {
  const pad = {
    sm: 'py-16 md:py-20',
    lg: 'py-24 md:py-32',
    xl: 'py-28 md:py-40',
  }[size]

  const surface = {
    paper: '',
    // A single step up in lightness reads as a distinct band without a border.
    raised: 'bg-surface/50',
  }[tone]

  return (
    <section id={id} className={`relative scroll-mt-24 ${surface} ${className}`}>
      <div className={`max-w-6xl mx-auto px-6 md:px-8 ${pad}`}>{children}</div>
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
