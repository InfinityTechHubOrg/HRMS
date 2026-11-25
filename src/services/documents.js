import { differenceInCalendarDays, parseISO } from 'date-fns'
import { delay, getDb, saveDb, nextId } from './storage'

export async function listDocuments({ employeeId, type, branchId, windowDays } = {}) {
  await delay()
  const db = getDb()
  let docs = [...db.documents]
  if (employeeId) docs = docs.filter((d) => d.employeeId === employeeId)
  if (type) docs = docs.filter((d) => d.type === type)
  if (branchId) {
    const ids = new Set(db.employees.filter((e) => e.branchId === branchId).map((e) => e.id))
    docs = docs.filter((d) => ids.has(d.employeeId))
  }
  if (windowDays != null) {
    docs = docs.filter((d) => {
      const days = differenceInCalendarDays(parseISO(d.expiryDate), new Date())
      return days <= windowDays
    })
  }
  return docs
    .map((d) => {
      const emp = db.employees.find((e) => e.id === d.employeeId)
      const days = differenceInCalendarDays(parseISO(d.expiryDate), new Date())
      return { ...d, employee: emp, daysToExpiry: days }
    })
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
}

export async function getDocument(id) {
  await delay()
  const db = getDb()
  return db.documents.find((d) => d.id === id) || null
}

export async function upsertDocument(payload) {
  await delay()
  const db = getDb()
  const existing = db.documents.findIndex(
    (d) => d.employeeId === payload.employeeId && d.type === payload.type && (!payload.id || d.id === payload.id)
  )
  if (payload.id || existing >= 0) {
    const idx = payload.id ? db.documents.findIndex((d) => d.id === payload.id) : existing
    db.documents[idx] = {
      ...db.documents[idx],
      ...payload,
      updatedAt: new Date().toISOString(),
    }
    saveDb(db)
    return db.documents[idx]
  }
  const doc = {
    id: nextId('doc'),
    ...payload,
    updatedAt: new Date().toISOString(),
  }
  db.documents.push(doc)
  saveDb(db)
  return doc
}

export async function replaceDocument(id, payload) {
  await delay()
  const db = getDb()
  const idx = db.documents.findIndex((d) => d.id === id)
  if (idx < 0) throw new Error('Document not found')
  db.documents[idx] = { ...db.documents[idx], ...payload, updatedAt: new Date().toISOString() }
  saveDb(db)
  return db.documents[idx]
}

export async function expiringSummary(branchId) {
  await delay()
  const docs = await listDocuments({ branchId, windowDays: 90 })
  return {
    expired: docs.filter((d) => d.daysToExpiry < 0).length,
    d30: docs.filter((d) => d.daysToExpiry >= 0 && d.daysToExpiry <= 30).length,
    d60: docs.filter((d) => d.daysToExpiry > 30 && d.daysToExpiry <= 60).length,
    d90: docs.filter((d) => d.daysToExpiry > 60 && d.daysToExpiry <= 90).length,
    items: docs.slice(0, 10),
  }
}
