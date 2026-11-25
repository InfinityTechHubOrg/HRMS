import { delay, getDb, saveDb, nextId } from './storage'
import { daysBetweenInclusive } from '../utils/dates'

const balanceKey = {
  'lt-annual': 'annual',
  'lt-medical': 'medical',
  'lt-unpaid': 'unpaid',
  'lt-emergency': 'emergency',
}

export async function getLeaveBalance(employeeId) {
  await delay()
  const db = getDb()
  return db.leaveBalances.find((b) => b.employeeId === employeeId) || null
}

export async function listLeaves({ employeeId, status, branchId, leaveTypeId } = {}) {
  await delay()
  const db = getDb()
  let list = [...db.leaves]
  if (employeeId) list = list.filter((l) => l.employeeId === employeeId)
  if (status) list = list.filter((l) => l.status === status)
  if (leaveTypeId) list = list.filter((l) => l.leaveTypeId === leaveTypeId)
  if (branchId) {
    const ids = new Set(db.employees.filter((e) => e.branchId === branchId).map((e) => e.id))
    list = list.filter((l) => ids.has(l.employeeId))
  }
  return list
    .map((l) => ({
      ...l,
      employee: db.employees.find((e) => e.id === l.employeeId),
      leaveType: db.leaveTypes.find((t) => t.id === l.leaveTypeId),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function applyLeave(payload) {
  await delay()
  const db = getDb()
  const leaveType = db.leaveTypes.find((t) => t.id === payload.leaveTypeId)
  if (!leaveType) throw new Error('Invalid leave type')
  if (leaveType.requiresCertificate && !payload.certificateFile && !payload.certificateName) {
    throw new Error('A medical certificate is required for this leave type')
  }
  const days = daysBetweenInclusive(payload.startDate, payload.endDate)
  if (days <= 0) throw new Error('Invalid date range')

  const bal = db.leaveBalances.find((b) => b.employeeId === payload.employeeId)
  const key = balanceKey[payload.leaveTypeId]
  if (key && key !== 'unpaid' && bal && bal[key] < days) {
    throw new Error(`Insufficient ${leaveType.name} balance (${bal[key]} days left)`)
  }

  const leave = {
    id: nextId('lv'),
    employeeId: payload.employeeId,
    leaveTypeId: payload.leaveTypeId,
    startDate: payload.startDate,
    endDate: payload.endDate,
    days,
    reason: payload.reason,
    status: 'Pending',
    rejectReason: null,
    certificateFile: payload.certificateFile || null,
    certificateName: payload.certificateName || null,
    certificateMime: payload.certificateMime || null,
    createdAt: new Date().toISOString(),
    decidedAt: null,
    decidedBy: null,
  }
  db.leaves.push(leave)
  saveDb(db)
  return leave
}

export async function decideLeave(id, { approve, rejectReason, decidedBy }) {
  await delay()
  const db = getDb()
  const leave = db.leaves.find((l) => l.id === id)
  if (!leave) throw new Error('Leave not found')
  if (leave.status !== 'Pending') throw new Error('Leave already decided')
  if (!approve && !rejectReason?.trim()) throw new Error('Reject reason is mandatory')

  leave.status = approve ? 'Approved' : 'Rejected'
  leave.rejectReason = approve ? null : rejectReason
  leave.decidedAt = new Date().toISOString()
  leave.decidedBy = decidedBy || 'hr'

  if (approve) {
    const bal = db.leaveBalances.find((b) => b.employeeId === leave.employeeId)
    const key = balanceKey[leave.leaveTypeId]
    if (bal && key && key !== 'unpaid') {
      bal[key] = Math.max(0, bal[key] - leave.days)
      if (key === 'annual') bal.usedAnnual = (bal.usedAnnual || 0) + leave.days
      if (key === 'medical') bal.usedMedical = (bal.usedMedical || 0) + leave.days
    }
  }
  saveDb(db)
  return leave
}

export async function getLeaveCalendar(branchId, { from, to } = {}) {
  await delay()
  const approved = await listLeaves({ branchId, status: 'Approved' })
  return approved.filter((l) => {
    if (from && l.endDate < from) return false
    if (to && l.startDate > to) return false
    return true
  })
}

export async function pendingLeaveCount(branchId) {
  const list = await listLeaves({ branchId, status: 'Pending' })
  return list.length
}
