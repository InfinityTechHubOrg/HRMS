import { delay, getDb, saveDb, nextId } from './storage'

export async function listLetterRequests({ employeeId, status } = {}) {
  await delay()
  const db = getDb()
  let list = [...db.letterRequests]
  if (employeeId) list = list.filter((l) => l.employeeId === employeeId)
  if (status) list = list.filter((l) => l.status === status)
  return list
    .map((l) => ({
      ...l,
      employee: db.employees.find((e) => e.id === l.employeeId),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function requestLetter(payload) {
  await delay()
  const db = getDb()
  const item = {
    id: nextId('lr'),
    employeeId: payload.employeeId,
    purpose: payload.purpose,
    addressedTo: payload.addressedTo,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    generatedAt: null,
  }
  db.letterRequests.push(item)
  saveDb(db)
  return item
}

export async function markLetterGenerated(id) {
  await delay()
  const db = getDb()
  const item = db.letterRequests.find((l) => l.id === id)
  if (!item) throw new Error('Request not found')
  item.status = 'Generated'
  item.generatedAt = new Date().toISOString()
  saveDb(db)
  return item
}

export async function createAndGenerateLetter(payload) {
  await delay()
  const db = getDb()
  const item = {
    id: nextId('lr'),
    employeeId: payload.employeeId,
    purpose: payload.purpose || 'Salary confirmation / transfer',
    addressedTo: payload.addressedTo || 'To Whom It May Concern',
    status: 'Generated',
    createdAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
  }
  db.letterRequests.push(item)
  saveDb(db)
  return { ...item, employee: db.employees.find((e) => e.id === item.employeeId) }
}

export async function getLetterContext(employeeId) {
  await delay()
  const db = getDb()
  const employee = db.employees.find((e) => e.id === employeeId)
  const salary = db.salaryStructures.find((s) => s.employeeId === employeeId)
  const branch = db.branches.find((b) => b.id === employee?.branchId)
  const allowances =
    (salary?.allowances?.housing || 0) + (salary?.allowances?.transport || 0) + (salary?.allowances?.other || 0)
  const deductions = (salary?.deductions?.loan || 0) + (salary?.deductions?.other || 0)
  const monthly = (salary?.basic || 0) + allowances - deductions
  return {
    company: db.company,
    employee,
    branch,
    salary,
    monthlySalary: monthly,
  }
}
