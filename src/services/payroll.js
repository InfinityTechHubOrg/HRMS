import { delay, getDb, saveDb, nextId } from './storage'

export async function getSalaryStructure(employeeId) {
  await delay()
  const db = getDb()
  return db.salaryStructures.find((s) => s.employeeId === employeeId) || null
}

export async function updateSalaryStructure(employeeId, data) {
  await delay()
  const db = getDb()
  const idx = db.salaryStructures.findIndex((s) => s.employeeId === employeeId)
  if (idx < 0) {
    const s = { employeeId, currency: 'AED', ...data }
    db.salaryStructures.push(s)
    saveDb(db)
    return s
  }
  db.salaryStructures[idx] = { ...db.salaryStructures[idx], ...data }
  saveDb(db)
  return db.salaryStructures[idx]
}

export async function listPayrollRuns() {
  await delay()
  const db = getDb()
  return [...db.payrollRuns].sort((a, b) => b.month.localeCompare(a.month))
}

export async function getPayrollRun(month) {
  await delay()
  const db = getDb()
  const run = db.payrollRuns.find((r) => r.month === month)
  if (!run) return null
  return {
    ...run,
    items: run.items.map((it) => ({
      ...it,
      employee: db.employees.find((e) => e.id === it.employeeId),
    })),
  }
}

export async function previewPayroll(month) {
  await delay()
  const db = getDb()
  const existing = db.payrollRuns.find((r) => r.month === month)
  if (existing) return getPayrollRun(month)

  const items = db.employees
    .filter((e) => e.status === 'active')
    .map((emp) => {
      const s = db.salaryStructures.find((x) => x.employeeId === emp.id) || {
        basic: 0,
        allowances: { housing: 0, transport: 0, other: 0 },
        deductions: { loan: 0, other: 0 },
      }
      const allowances = (s.allowances?.housing || 0) + (s.allowances?.transport || 0) + (s.allowances?.other || 0)
      const deductions = (s.deductions?.loan || 0) + (s.deductions?.other || 0)
      return {
        employeeId: emp.id,
        employee: emp,
        basic: s.basic || 0,
        allowances,
        allowanceBreakdown: { ...(s.allowances || {}) },
        deductions,
        deductionBreakdown: { ...(s.deductions || {}) },
        net: (s.basic || 0) + allowances - deductions,
      }
    })
  const totals = items.reduce(
    (acc, it) => {
      acc.basic += it.basic
      acc.allowances += it.allowances
      acc.deductions += it.deductions
      acc.net += it.net
      return acc
    },
    { basic: 0, allowances: 0, deductions: 0, net: 0 }
  )
  return { month, status: 'Draft', items, totals, preview: true }
}

export async function approvePayroll(month) {
  await delay()
  const db = getDb()
  let run = db.payrollRuns.find((r) => r.month === month)
  if (run?.status === 'Locked') throw new Error('Payroll is locked')
  if (!run) {
    const preview = await previewPayroll(month)
    run = {
      id: nextId('pr'),
      month,
      status: 'Approved',
      items: preview.items.map(({ employee, ...rest }) => rest),
      totals: preview.totals,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      lockedAt: null,
    }
    db.payrollRuns.push(run)
  } else {
    if (run.status === 'Approved' || run.status === 'Locked') throw new Error('Already approved')
    run.status = 'Approved'
    run.approvedAt = new Date().toISOString()
  }
  saveDb(db)
  return getPayrollRun(month)
}

export async function lockPayroll(month) {
  await delay()
  const db = getDb()
  const run = db.payrollRuns.find((r) => r.month === month)
  if (!run) throw new Error('Approve payroll first')
  if (run.status === 'Locked') throw new Error('Already locked')
  if (run.status !== 'Approved') throw new Error('Approve before locking')
  run.status = 'Locked'
  run.lockedAt = new Date().toISOString()
  saveDb(db)
  return getPayrollRun(month)
}

export async function getPayslip(employeeId, month) {
  await delay()
  const db = getDb()
  const run = db.payrollRuns.find((r) => r.month === month)
  if (!run) return null
  const item = run.items.find((i) => i.employeeId === employeeId)
  if (!item) return null
  return {
    month,
    status: run.status,
    employee: db.employees.find((e) => e.id === employeeId),
    company: db.company,
    ...item,
  }
}

export async function listPayslips(employeeId) {
  await delay()
  const db = getDb()
  return db.payrollRuns
    .filter((r) => r.status === 'Approved' || r.status === 'Locked')
    .map((r) => {
      const item = r.items.find((i) => i.employeeId === employeeId)
      if (!item) return null
      return { month: r.month, status: r.status, ...item }
    })
    .filter(Boolean)
    .sort((a, b) => b.month.localeCompare(a.month))
}
