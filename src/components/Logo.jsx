// The Cadence mark: a rounded badge with a pulse/rhythm line — reads as
// both a soundwave and a stylized "C". Used as favicon source, in the
// nav, and on the landing page.
export function LogoMark({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="11" className="fill-brand" />
      <path
        d="M9 22c1.6 0 1.6-7 3.2-7s1.6 12 3.2 12 1.6-17 3.2-17 1.6 22 3.2 22 1.6-10 3.2-10 1.6 4 3.2 4"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export default function Logo({ size = 28, showWordmark = true, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="font-display font-semibold tracking-[-0.01em] text-ink" style={{ fontSize: size * 0.64 }}>
          Cadence
        </span>
      )}
    </div>
  )
}
