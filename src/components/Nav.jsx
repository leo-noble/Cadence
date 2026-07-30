import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutGrid, Library, CalendarDays, Timer, BarChart3, Settings, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react'
import Logo from './Logo'

const TABS = [
  { id: 'today', label: 'Today', icon: LayoutGrid },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Nav({ active, onChange, profile, onSignOut, collapsed, onToggleCollapsed }) {
  return (
    <>
      {/* Desktop sidebar — width animates smoothly so content reflows rather than jumping */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 240 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex md:flex-col md:shrink-0 bg-surface border-r border-divider py-6 overflow-hidden"
        style={{ paddingLeft: collapsed ? 14 : 16, paddingRight: collapsed ? 14 : 16 }}
      >
        <div className={`flex items-center mb-6 ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
          {!collapsed && (
            <Link to="/" className="block group w-fit">
              <Logo size={26} className="transition-opacity duration-180 group-hover:opacity-80" />
            </Link>
          )}
          <button
            onClick={onToggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-control text-ink-soft hover:bg-hover hover:text-ink transition-colors duration-180 shrink-0"
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <div className="h-px bg-divider mb-5" />
        <nav className="flex flex-col gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              title={collapsed ? label : undefined}
              className={`relative flex items-center gap-3 py-3 rounded-control text-[15px] font-medium transition-all duration-180 ${
                collapsed ? 'justify-center px-0' : 'px-3'
              } ${active === id ? 'text-brand' : 'text-ink-soft hover:bg-hover hover:translate-x-0.5'}`}
            >
              {active === id && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-control bg-selected"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <Icon size={18} className="relative shrink-0" />
              {!collapsed && <span className="relative whitespace-nowrap">{label}</span>}
            </button>
          ))}
        </nav>

        {profile?.name && (
          <div className={`mt-auto pt-4 border-t border-divider flex items-center gap-2 ${collapsed ? 'justify-center px-0' : 'px-1'}`}>
            <div className="h-7 w-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-semibold shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <>
                <span className="text-sm text-ink truncate flex-1">{profile.name}</span>
                <button
                  onClick={onSignOut}
                  title="Sign out"
                  className="p-1.5 rounded-control text-ink-soft hover:bg-hover transition-colors duration-180"
                >
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </motion.aside>

      {/* Mobile bottom nav — a floating glass pill, not a full-width bar,
          so it reads like it's hovering above the content (Apple's tab-bar
          / Dynamic Island language) rather than docked to the screen edge. */}
      <nav className="md:hidden fixed inset-x-0 z-30 flex justify-center px-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div
          className="glass-bar flex items-stretch gap-0.5 rounded-capsule px-1.5 py-1.5 shadow-fab"
          style={{
            background: 'var(--color-glass)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid var(--color-glass-border)',
          }}
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-label={label}
              className="relative flex flex-col items-center justify-center gap-0.5 px-3.5 py-2 text-[10px] font-medium rounded-capsule"
            >
              {active === id && (
                <motion.span
                  layoutId="nav-active-pill-mobile"
                  className="absolute inset-0 rounded-capsule bg-brand shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
                  transition={{ type: 'spring', stiffness: 480, damping: 32 }}
                />
              )}
              <motion.span
                animate={active === id ? { y: -1, scale: 1.06 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 480, damping: 24 }}
                className={`relative flex flex-col items-center gap-0.5 ${active === id ? 'text-white' : 'text-ink-soft'}`}
              >
                <Icon size={19} />
                <span className={active === id ? 'opacity-100' : 'opacity-80'}>{label}</span>
              </motion.span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
