import { delay, getDb, resetDb, saveDb } from './storage'

export async function getCompany() {
  await delay()
  return getDb().company
}

export async function getBranches() {
  await delay()
  return getDb().branches
}

export async function getBranch(id) {
  await delay()
  return getDb().branches.find((b) => b.id === id) || null
}

export async function getLeaveTypes() {
  await delay()
  return getDb().leaveTypes
}

export async function updateLeaveType(id, patch) {
  await delay()
  const db = getDb()
  const idx = db.leaveTypes.findIndex((t) => t.id === id)
  if (idx < 0) throw new Error('Leave type not found')
  db.leaveTypes[idx] = { ...db.leaveTypes[idx], ...patch }
  saveDb(db)
  return db.leaveTypes[idx]
}

export async function resetDemoData() {
  await delay(400)
  return resetDb()
}
