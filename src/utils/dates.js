import {
  differenceInCalendarDays,
  parseISO,
  format,
  isValid,
  eachDayOfInterval,
  isWeekend,
} from 'date-fns'

export function parseDate(d) {
  if (!d) return null
  const dt = typeof d === 'string' ? parseISO(d) : d
  return isValid(dt) ? dt : null
}

export function fmtDate(d, pattern = 'dd MMM yyyy') {
  const dt = parseDate(d)
  return dt ? format(dt, pattern) : '—'
}

export function fmtDateTime(d) {
  const dt = parseDate(d)
  return dt ? format(dt, 'dd MMM yyyy, HH:mm') : '—'
}

export function fmtTime(d) {
  const dt = parseDate(d)
  return dt ? format(dt, 'HH:mm') : '—'
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function daysBetweenInclusive(start, end) {
  const s = parseDate(start)
  const e = parseDate(end)
  if (!s || !e || e < s) return 0
  return differenceInCalendarDays(e, s) + 1
}

export function workingDaysBetween(start, end) {
  const s = parseDate(start)
  const e = parseDate(end)
  if (!s || !e || e < s) return 0
  return eachDayOfInterval({ start: s, end: e }).filter((d) => !isWeekend(d)).length || daysBetweenInclusive(start, end)
}

export function expiryStatus(expiryDate) {
  const exp = parseDate(expiryDate)
  if (!exp) return { level: 'unknown', label: 'Unknown', days: null }
  const days = differenceInCalendarDays(exp, new Date())
  if (days < 0) return { level: 'expired', label: 'Expired', days }
  if (days <= 30) return { level: 'critical', label: `${days}d left`, days }
  if (days <= 90) return { level: 'warning', label: `${days}d left`, days }
  return { level: 'ok', label: 'Valid', days }
}

export function formatDuration(ms) {
  if (ms < 0) ms = 0
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function aed(amount) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}
