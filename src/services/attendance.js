import { format, parseISO, differenceInMinutes } from 'date-fns'
import { delay, getDb, saveDb, nextId } from './storage'
import { isInsideGeofence } from '../utils/geo'
import { todayISO } from '../utils/dates'

const SHIFT_START = { h: 8, m: 15 } // late after 08:15
const SHIFT_END = { h: 16, m: 45 } // early out before 16:45

function getOrCreateTodayRecord(db, employeeId, branchId, date) {
  let rec = db.attendance.find((a) => a.employeeId === employeeId && a.date === date)
  if (!rec) {
    rec = {
      id: nextId('att'),
      employeeId,
      branchId,
      date,
      punches: [],
      late: false,
      earlyOut: false,
      status: 'none',
    }
    db.attendance.push(rec)
  }
  return rec
}

export async function punch({ employeeId, type, lat, lng, simulateInside }) {
  await delay(400)
  const db = getDb()
  const emp = db.employees.find((e) => e.id === employeeId)
  if (!emp) throw new Error('Employee not found')
  const branch = db.branches.find((b) => b.id === emp.branchId)
  const geo = isInsideGeofence(lat, lng, branch)
  if (!geo.inside) {
    const err = new Error(
      `Punch blocked — you are ${geo.distanceM}m from ${branch.name} (geofence ${branch.geofenceRadiusM}m). Move closer or toggle Simulate location to Inside branch.`
    )
    err.code = 'GEOFENCE'
    err.distanceM = geo.distanceM
    err.branch = branch
    throw err
  }

  const date = todayISO()
  const rec = getOrCreateTodayRecord(db, employeeId, emp.branchId, date)
  const last = rec.punches[rec.punches.length - 1]

  if (type === 'in') {
    if (last?.type === 'in') throw new Error('Already punched in. Punch out first.')
  } else {
    if (!last || last.type === 'out') throw new Error('You must punch in before punching out.')
  }

  const at = new Date()
  const punch = {
    id: nextId('p'),
    type,
    at: at.toISOString(),
    lat,
    lng,
    insideGeofence: true,
    distanceM: geo.distanceM,
    simulateInside: !!simulateInside,
  }
  rec.punches.push(punch)

  if (type === 'in') {
    const mins = at.getHours() * 60 + at.getMinutes()
    const lateMins = SHIFT_START.h * 60 + SHIFT_START.m
    rec.late = mins > lateMins
    rec.status = 'in'
  } else {
    const mins = at.getHours() * 60 + at.getMinutes()
    const earlyMins = SHIFT_END.h * 60 + SHIFT_END.m
    rec.earlyOut = mins < earlyMins
    rec.status = 'complete'
  }

  saveDb(db)
  return { record: rec, punch, branch, distanceM: geo.distanceM }
}

export async function getTodayAttendance(employeeId) {
  await delay()
  const db = getDb()
  const date = todayISO()
  return db.attendance.find((a) => a.employeeId === employeeId && a.date === date) || null
}

export async function getPunchHistory(employeeId, { from, to } = {}) {
  await delay()
  const db = getDb()
  let list = db.attendance.filter((a) => a.employeeId === employeeId)
  if (from) list = list.filter((a) => a.date >= from)
  if (to) list = list.filter((a) => a.date <= to)
  return list.sort((a, b) => b.date.localeCompare(a.date))
}

export async function getLiveBoard(branchId) {
  await delay()
  const db = getDb()
  const date = todayISO()
  const emps = db.employees.filter((e) => e.status === 'active' && (!branchId || e.branchId === branchId))
  const board = { in: [], out: [], notYet: [] }
  emps.forEach((emp) => {
    const rec = db.attendance.find((a) => a.employeeId === emp.id && a.date === date)
    const item = { employee: emp, record: rec || null }
    if (!rec || rec.punches.length === 0) board.notYet.push(item)
    else if (rec.status === 'in') board.in.push(item)
    else board.out.push(item)
  })
  return board
}

export async function getAttendanceLog({ branchId, employeeId, from, to } = {}) {
  await delay()
  const db = getDb()
  let list = [...db.attendance]
  if (branchId) list = list.filter((a) => a.branchId === branchId)
  if (employeeId) list = list.filter((a) => a.employeeId === employeeId)
  if (from) list = list.filter((a) => a.date >= from)
  if (to) list = list.filter((a) => a.date <= to)
  return list
    .map((a) => {
      const emp = db.employees.find((e) => e.id === a.employeeId)
      const branch = db.branches.find((b) => b.id === a.branchId)
      const punchIn = a.punches.find((p) => p.type === 'in')
      const punchOut = [...a.punches].reverse().find((p) => p.type === 'out')
      let workedMins = null
      if (punchIn && punchOut) {
        workedMins = differenceInMinutes(parseISO(punchOut.at), parseISO(punchIn.at))
      }
      return { ...a, employee: emp, branch, punchIn, punchOut, workedMins }
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.employee?.name.localeCompare(b.employee?.name))
}

export async function getAttendanceTrend(days = 14, branchId) {
  await delay()
  const db = getDb()
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = format(d, 'yyyy-MM-dd')
    let recs = db.attendance.filter((a) => a.date === date)
    if (branchId) recs = recs.filter((a) => a.branchId === branchId)
    const present = recs.filter((a) => a.punches.length > 0).length
    const late = recs.filter((a) => a.late).length
    result.push({ date, label: format(d, 'dd MMM'), present, late })
  }
  return result
}

export async function listPunchCorrections({ status, branchId, employeeId } = {}) {
  await delay()
  const db = getDb()
  let list = [...db.punchCorrections]
  if (status) list = list.filter((c) => c.status === status)
  if (employeeId) list = list.filter((c) => c.employeeId === employeeId)
  if (branchId) {
    const ids = new Set(db.employees.filter((e) => e.branchId === branchId).map((e) => e.id))
    list = list.filter((c) => ids.has(c.employeeId))
  }
  return list
    .map((c) => ({ ...c, employee: db.employees.find((e) => e.id === c.employeeId) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function requestPunchCorrection(payload) {
  await delay()
  const db = getDb()
  const item = {
    id: nextId('pc'),
    ...payload,
    status: 'Pending',
    rejectReason: null,
    createdAt: new Date().toISOString(),
  }
  db.punchCorrections.push(item)
  saveDb(db)
  return item
}

export async function decidePunchCorrection(id, { approve, rejectReason }) {
  await delay()
  const db = getDb()
  const item = db.punchCorrections.find((c) => c.id === id)
  if (!item) throw new Error('Request not found')
  if (!approve && !rejectReason) throw new Error('Reject reason is required')
  item.status = approve ? 'Approved' : 'Rejected'
  item.rejectReason = approve ? null : rejectReason
  item.decidedAt = new Date().toISOString()

  if (approve) {
    const emp = db.employees.find((e) => e.id === item.employeeId)
    const rec = getOrCreateTodayRecord(db, item.employeeId, emp.branchId, item.date)
    // Use the requested date with requested time
    const at = new Date(`${item.date}T${item.requestedTime}:00`)
    rec.punches.push({
      id: nextId('p'),
      type: item.requestedPunchType,
      at: at.toISOString(),
      lat: null,
      lng: null,
      insideGeofence: true,
      distanceM: 0,
      corrected: true,
    })
    rec.punches.sort((a, b) => a.at.localeCompare(b.at))
    const hasIn = rec.punches.some((p) => p.type === 'in')
    const hasOut = rec.punches.some((p) => p.type === 'out')
    rec.status = hasIn && hasOut ? 'complete' : hasIn ? 'in' : 'none'
  }
  saveDb(db)
  return item
}

export async function todayStats(branchId) {
  await delay()
  const board = await getLiveBoard(branchId)
  const db = getDb()
  const date = todayISO()
  let recs = db.attendance.filter((a) => a.date === date)
  if (branchId) recs = recs.filter((a) => a.branchId === branchId)
  return {
    present: board.in.length + board.out.length,
    absent: board.notYet.length,
    late: recs.filter((a) => a.late).length,
    inNow: board.in.length,
  }
}
