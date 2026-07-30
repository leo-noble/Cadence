const STATUS_META = {
  overdue: { label: 'Overdue', dot: 'bg-status-overdue', text: 'text-status-overdue', bg: 'bg-status-overdue/10' },
  due: { label: 'Due today', dot: 'bg-status-due', text: 'text-status-due', bg: 'bg-status-due/10' },
  upcoming: { label: 'Upcoming', dot: 'bg-status-upcoming', text: 'text-status-upcoming', bg: 'bg-status-upcoming/10' },
  mastered: { label: 'Mastered', dot: 'bg-status-mastered', text: 'text-status-mastered', bg: 'bg-status-mastered/10' },
}

export function statusColor(status) {
  return STATUS_META[status]?.dot || 'bg-ink-soft'
}

export function statusLabel(status) {
  return STATUS_META[status]?.label || status
}

export default function StatusChip({ status, className = '' }) {
  const meta = STATUS_META[status] || { label: status, dot: 'bg-ink-soft', text: 'text-ink-soft' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${meta.text} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}
