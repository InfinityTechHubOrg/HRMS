import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

function letterhead(doc, company) {
  doc.setFillColor(37, 111, 231)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(company?.name || 'Gulf Taste Restaurant Group', 14, 12)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(company?.address || '', 14, 19)
  doc.text(`${company?.phone || ''} · ${company?.email || ''}`, 14, 24)
  doc.setTextColor(15, 23, 42)
}

function roleTitle(role) {
  const map = {
    manager: 'Branch Manager',
    chef: 'Chef',
    cashier: 'Cashier',
    waiter: 'Waiter',
    delivery: 'Delivery Rider',
    inventory: 'Inventory Clerk',
  }
  return map[role] || role || '—'
}

/** @param {object} slip — from getPayslip() */
export function downloadPayslipPdf(slip) {
  const doc = new jsPDF()
  const company = slip.company || {}
  const employee = slip.employee || {}
  letterhead(doc, company)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYSLIP', 14, 40)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Period: ${slip.month}`, 14, 48)
  doc.text(`Employee: ${employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`} (${employee.empNo || ''})`, 14, 55)
  doc.text(`Designation: ${roleTitle(employee.role)}`, 14, 62)
  doc.text(`Status: ${slip.status || '—'}`, 14, 69)

  let y = 82
  doc.setFont('helvetica', 'bold')
  doc.text('Earnings', 14, y)
  doc.text('AED', 160, y)
  y += 8
  doc.setFont('helvetica', 'normal')

  const rows = [
    ['Basic Salary', slip.basic],
    ['Housing Allowance', slip.allowanceBreakdown?.housing ?? 0],
    ['Transport Allowance', slip.allowanceBreakdown?.transport ?? 0],
    ['Other Allowances', slip.allowanceBreakdown?.other ?? 0],
  ]
  // Fallback if only totals exist
  if (!slip.allowanceBreakdown && slip.allowances) {
    rows.splice(1, 3, ['Allowances', slip.allowances])
  }
  rows.forEach(([label, amt]) => {
    doc.text(label, 14, y)
    doc.text(String(Math.round(amt || 0)), 160, y)
    y += 7
  })

  y += 4
  doc.setFont('helvetica', 'bold')
  doc.text('Deductions', 14, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  const deds = slip.deductionBreakdown
    ? Object.entries(slip.deductionBreakdown)
    : [['Deductions', slip.deductions || 0]]
  deds.forEach(([k, v]) => {
    const label = k.charAt(0).toUpperCase() + k.slice(1)
    doc.text(label, 14, y)
    doc.text(String(Math.round(v || 0)), 160, y)
    y += 7
  })

  y += 6
  doc.setDrawColor(37, 111, 231)
  doc.line(14, y, 196, y)
  y += 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Net Pay', 14, y)
  doc.text(`AED ${Math.round(slip.net || 0).toLocaleString()}`, 140, y)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Computer-generated payslip for demo purposes.', 14, 285)

  doc.save(`Payslip_${employee.empNo || 'emp'}_${slip.month}.pdf`)
}

/** @param {object} ctx — from getLetterContext(); @param {{purpose, addressedTo}} opts */
export function downloadSalaryLetterPdf(ctx, opts = {}) {
  const { company, employee, branch, monthlySalary } = ctx
  const purpose = opts.purpose || 'Salary confirmation / transfer'
  const addressedTo = opts.addressedTo || 'To Whom It May Concern'
  const doc = new jsPDF()
  letterhead(doc, company)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${format(new Date(), 'dd MMMM yyyy')}`, 14, 40)
  doc.text(`Ref: SL-${employee?.empNo || 'XX'}-${format(new Date(), 'yyyyMMdd')}`, 14, 47)

  doc.setFont('helvetica', 'bold')
  doc.text(`To: ${addressedTo}`, 14, 60)
  doc.setFontSize(12)
  doc.text('Subject: Salary Transfer / Employment Confirmation Letter', 14, 72)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const name = employee?.name || `${employee?.firstName || ''} ${employee?.lastName || ''}`
  const paras = [
    `This is to certify that ${name} (Employee No. ${employee?.empNo || '—'}) is employed with ${company?.legalName || company?.name} as ${roleTitle(employee?.role)} at our ${branch?.name || ''} branch.`,
    `Date of joining: ${employee?.joinDate || '—'}.`,
    `The employee's current monthly salary is AED ${Math.round(monthlySalary || 0).toLocaleString()} (Basic + Allowances − Deductions).`,
    `Bank: ${employee?.bankName || '—'}. IBAN: ${employee?.bankIban || '—'}.`,
    `Purpose: ${purpose}`,
    `This letter is issued upon the employee's request for the purpose stated above and does not constitute a financial guarantee.`,
  ]
  let y = 85
  paras.forEach((p) => {
    const lines = doc.splitTextToSize(p, 182)
    doc.text(lines, 14, y)
    y += lines.length * 6 + 6
  })

  y += 8
  doc.text('Yours sincerely,', 14, y)
  y += 18
  doc.setFont('helvetica', 'bold')
  doc.text(company?.signatory || 'HR Director', 14, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(company?.signatoryTitle || 'HR Director', 14, y)
  y += 6
  doc.text(company?.legalName || company?.name || '', 14, y)

  doc.save(`Salary_Letter_${employee?.empNo || 'emp'}.pdf`)
}

/** @param {object} employee @param {object} branch */
export function downloadEmployeeCardPdf(employee, branch) {
  const doc = new jsPDF({ orientation: 'landscape', format: [85.6, 53.98], unit: 'mm' })
  doc.setFillColor(37, 111, 231)
  doc.rect(0, 0, 85.6, 53.98, 'F')
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(3, 3, 79.6, 47.98, 2, 2, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(37, 111, 231)
  doc.text('Gulf Taste Restaurant Group', 8, 10)

  const name = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(11)
  doc.text(name, 8, 20)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(roleTitle(employee.role), 8, 26)
  doc.text(`Emp No: ${employee.empNo}`, 8, 32)
  doc.text(`Branch: ${branch?.name || employee.branch?.name || '—'}`, 8, 38)
  doc.text(`Valid until: ${employee.cardExpiry || '—'}`, 8, 44)

  doc.setFontSize(6)
  doc.setTextColor(148, 163, 184)
  doc.text('Employee ID Card · UAE', 8, 50)

  doc.save(`ID_Card_${employee.empNo}.pdf`)
}
