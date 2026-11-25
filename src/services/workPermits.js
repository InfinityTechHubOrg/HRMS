import { delay, getDb, saveDb, nextId } from './storage'

export async function listWorkPermits(employeeId) {
  await delay()
  const db = getDb()
  return db.workPermits
    .filter((p) => p.employeeId === employeeId)
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
}

export async function renewWorkPermit(employeeId, data) {
  await delay()
  const db = getDb()
  db.workPermits.forEach((p) => {
    if (p.employeeId === employeeId && p.status === 'Active') {
      p.status = 'Expired'
    }
  })
  const permit = {
    id: nextId('wp'),
    employeeId,
    permitNo: data.permitNo,
    issueDate: data.issueDate,
    expiryDate: data.expiryDate,
    status: 'Active',
    fileName: data.fileName || null,
    fileData: data.fileData || null,
    createdAt: new Date().toISOString(),
  }
  db.workPermits.push(permit)
  saveDb(db)
  return permit
}

export async function cancelWorkPermit(id) {
  await delay()
  const db = getDb()
  const p = db.workPermits.find((x) => x.id === id)
  if (!p) throw new Error('Permit not found')
  p.status = 'Cancelled'
  saveDb(db)
  return p
}
