import { motion } from 'framer-motion'
import { fadeUp, group, transition, viewport } from './anim'

// The shared scroll-reveal. Wraps its children in a motion.div that plays once
// when it comes into view; `as` swaps the element so a reveal can still be a
// list item or a section without inventing a wrapper div.
export function Reveal({ children, delay = 0, duration = 0.6, className = '', as = 'div' }) {
  const Tag = motion[as] || motion.div
  return (
    <Tag
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={transition(duration, delay)}
      className={className}
    >
      {children}
    </Tag>
  )
}

// Stagger without hand-counting delays: children are plain <Reveal.Item>s and
// the parent decides the rhythm. Keeps a grid's markup free of `delay={i*0.06}`
// arithmetic that has to be re-done whenever the grid changes shape.
export function Stagger({ children, stagger = 0.08, delay = 0, className = '', as = 'div' }) {
  const Tag = motion[as] || motion.div
  return (
    <Tag
      variants={group(stagger, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      className={className}
    >
      {children}
    </Tag>
  )
}

Stagger.Item = function StaggerItem({ children, className = '', as = 'div' }) {
  const Tag = motion[as] || motion.div
  return (
    <Tag variants={fadeUp} transition={transition(0.6)} className={className}>
      {children}
    </Tag>
  )
}
