// One easing curve, one travel distance, one stagger rhythm for the whole
// marketing page. Reveals that share a curve read as one designed system;
// reveals that each pick their own read as a template.
//
// The curve is a strong ease-out: motion arrives fast and settles slowly,
// which is what makes it feel like weight rather than a fade timer.
export const EASE = [0.16, 1, 0.3, 1]

export const SPRING = { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 }

export const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const riseIn = {
  hidden: { opacity: 0, y: 26, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

// A parent that only orchestrates: no visual change of its own, so it can wrap
// anything without affecting layout or paint.
export const group = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
})

// Fire a little before the element is fully on screen — waiting for it to be
// centred makes the page feel like it's lagging behind the scroll.
export const viewport = { once: true, margin: '-70px 0px -70px 0px' }

export const transition = (duration = 0.6, delay = 0) => ({ duration, delay, ease: EASE })
