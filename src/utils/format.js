export function formatAED(amount) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export function formatMinutes(mins) {
  if (mins == null) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function fullName(emp) {
  if (!emp) return '—'
  return `${emp.firstName} ${emp.lastName}`
}

export function roleLabel(role) {
  const map = {
    manager: 'Branch Manager',
    chef: 'Chef',
    cashier: 'Cashier',
    waiter: 'Waiter',
    delivery: 'Delivery Rider',
    inventory: 'Inventory Clerk',
  }
  return map[role] || role
}

export function docTypeLabel(type) {
  const map = {
    visa: 'Visa',
    passport: 'Passport',
    insurance: 'Insurance',
    work_permit: 'Work Permit',
  }
  return map[type] || type
}

export function exportCSV(filename, rows, columns) {
  const header = columns.map((c) => c.label).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = c.value(row)
          const str = val == null ? '' : String(val)
          return `"${str.replace(/"/g, '""')}"`
        })
        .join(',')
    )
    .join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
