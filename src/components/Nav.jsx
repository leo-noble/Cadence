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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/90 backdrop-blur-lg border-t border-divider pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-180 ${
                active === id ? 'text-brand' : 'text-ink-soft'
              }`}
            >
              {active === id && (
                <motion.span
                  layoutId="nav-active-dot"
                  className="absolute top-1 h-1 w-1 rounded-full bg-brand"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
