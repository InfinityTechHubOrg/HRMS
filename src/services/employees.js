import { delay, getDb, saveDb, nextId } from './storage'

function enrich(emp, db) {
  const branch = db.branches.find((b) => b.id === emp.branchId)
  return { ...emp, branch }
}

export async function listEmployees({ branchId, role, status, search } = {}) {
  await delay()
  const db = getDb()
  let list = db.employees.map((e) => enrich(e, db))
  if (branchId) list = list.filter((e) => e.branchId === branchId)
  if (role) list = list.filter((e) => e.role === role)
  if (status) list = list.filter((e) => e.status === status)
  if (search) {
    const q = search.toLowerCase()
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.empNo.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
    )
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getEmployee(id) {
  await delay()
  const db = getDb()
  const emp = db.employees.find((e) => e.id === id)
  return emp ? enrich(emp, db) : null
}

export async function getEmployeeByToken(token) {
  await delay()
  const db = getDb()
  const emp = db.employees.find((e) => e.verifyToken === token)
  return emp ? enrich(emp, db) : null
}

export async function createEmployee(data) {
  await delay()
  const db = getDb()
  const id = nextId('emp')
  const empNo = `GT-${1000 + db.employees.length + 1}`
  const name = `${data.firstName} ${data.lastName}`
  const emp = {
    id,
    empNo,
    firstName: data.firstName,
    lastName: data.lastName,
    name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    branchId: data.branchId,
    joinDate: data.joinDate,
    status: data.status || 'active',
    nationality: data.nationality || '',
    gender: data.gender || '',
    dob: data.dob || '',
    photo: data.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&size=128&bold=true`,
    bankName: data.bankName || '',
    bankIban: data.bankIban || '',
    verifyToken: `vf-${empNo.toLowerCase()}-${id}`,
    cardExpiry: data.cardExpiry || '',
  }
  db.employees.push(emp)
  db.salaryStructures.push({
    employeeId: id,
    basic: data.basic || 3000,
    allowances: { housing: data.housing || 1000, transport: data.transport || 400, other: 0 },
    deductions: { loan: 0, other: 0 },
    currency: 'AED',
  })
  db.leaveBalances.push({
    employeeId: id,
    annual: 30,
    medical: 15,
    unpaid: 0,
    emergency: 5,
    usedAnnual: 0,
    usedMedical: 0,
  })
  saveDb(db)
  return enrich(emp, db)
}

export async function updateEmployee(id, data) {
  await delay()
  const db = getDb()
  const idx = db.employees.findIndex((e) => e.id === id)
  if (idx < 0) throw new Error('Employee not found')
  const prev = db.employees[idx]
  const name = `${data.firstName ?? prev.firstName} ${data.lastName ?? prev.lastName}`
  db.employees[idx] = {
    ...prev,
    ...data,
    name,
    firstName: data.firstName ?? prev.firstName,
    lastName: data.lastName ?? prev.lastName,
  }
  saveDb(db)
  return enrich(db.employees[idx], db)
}

export async function headcountByBranch() {
  await delay()
  const db = getDb()
  return db.branches.map((b) => ({
    branchId: b.id,
    branchName: b.name,
    total: db.employees.filter((e) => e.branchId === b.id && e.status === 'active').length,
  }))
}
