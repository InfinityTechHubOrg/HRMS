const styles = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-brand-50 text-brand-700 ring-brand-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
}

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[tone] || styles.neutral} ${className}`}
    >
      {children}
    </span>
  )
}

export function ExpiryBadge({ level, label }) {
  const tone = level === 'ok' ? 'success' : level === 'warning' ? 'warning' : level === 'critical' || level === 'expired' ? 'danger' : 'neutral'
  return <Badge tone={tone}>{label}</Badge>
}

export function StatusBadge({ status }) {
  const map = {
    Active: 'success',
    active: 'success',
    Inactive: 'neutral',
    inactive: 'neutral',
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'danger',
    Generated: 'info',
    Locked: 'purple',
    Draft: 'neutral',
    Expired: 'danger',
    Cancelled: 'neutral',
    In: 'success',
    Out: 'neutral',
    Late: 'warning',
    'Early-out': 'danger',
  }
  return <Badge tone={map[status] || 'neutral'}>{status}</Badge>
}
