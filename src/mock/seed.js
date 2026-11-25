import { addDays, subDays, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, setHours, setMinutes } from 'date-fns'

const today = new Date()
today.setHours(12, 0, 0, 0)

const ROLES = ['chef', 'cashier', 'waiter', 'delivery', 'inventory', 'manager']

const FIRST = ['Ahmed', 'Fatima', 'Mohammed', 'Sara', 'Ali', 'Layla', 'Omar', 'Noor', 'Hassan', 'Aisha', 'Youssef', 'Mariam', 'Khalid', 'Huda', 'Rashid', 'Amira', 'Tariq', 'Zainab', 'Faisal', 'Rania', 'Saeed', 'Dina', 'Bilal', 'Noura', 'Karim']
const LAST = ['Al Maktoum', 'Hassan', 'Khan', 'Patel', 'Al Suwaidi', 'Rahman', 'Nair', 'Fernandes', 'Al Zaabi', 'Singh', 'Al Shamsi', 'Joseph', 'Al Mazrouei', 'Pereira', 'Al Kaabi', 'Thomas', 'Al Falasi', 'George', 'Al Nuaimi', 'Cruz', 'Al Ameri', 'Dsouza', 'Al Qasimi', 'Mendes', 'Al Blooshi']

function avatar(name, i) {
  const colors = ['2563eb', '0d9488', 'c2410c', '7c3aed', 'be185d', '0369a1', '15803d', 'b45309']
  const bg = colors[i % colors.length]
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=128&bold=true`
}

function uid(prefix, n) {
  return `${prefix}-${String(n).padStart(3, '0')}`
}

function randomPick(arr, i) {
  return arr[i % arr.length]
}

export function createSeedData() {
  const company = {
    id: 'co-001',
    name: 'Gulf Taste Restaurant Group',
    legalName: 'Gulf Taste Restaurants L.L.C.',
    tradeLicense: 'CN-7845231',
    address: 'Office 1204, Business Bay Tower, Dubai, UAE',
    phone: '+971 4 555 1200',
    email: 'hr@gulftaste.ae',
    signatory: 'Rashid Al Falasi',
    signatoryTitle: 'Group HR Director',
  }

  const branches = [
    {
      id: 'br-001',
      name: 'Downtown Dubai',
      code: 'DTD',
      address: 'Boulevard Plaza, Downtown Dubai',
      lat: 25.1972,
      lng: 55.2744,
      geofenceRadiusM: 150,
      city: 'Dubai',
    },
    {
      id: 'br-002',
      name: 'JBR Walk',
      code: 'JBR',
      address: 'The Walk, Jumeirah Beach Residence',
      lat: 25.0772,
      lng: 55.1333,
      geofenceRadiusM: 120,
      city: 'Dubai',
    },
    {
      id: 'br-003',
      name: 'Abu Dhabi Corniche',
      code: 'ADC',
      address: 'Corniche Road West, Abu Dhabi',
      lat: 24.4764,
      lng: 54.3517,
      geofenceRadiusM: 180,
      city: 'Abu Dhabi',
    },
  ]

  const leaveTypes = [
    { id: 'lt-annual', name: 'Annual Leave', code: 'AL', requiresCertificate: false, paid: true, color: '#2563eb' },
    { id: 'lt-medical', name: 'Medical Leave', code: 'ML', requiresCertificate: true, paid: true, color: '#dc2626' },
    { id: 'lt-unpaid', name: 'Unpaid Leave', code: 'UL', requiresCertificate: false, paid: false, color: '#64748b' },
    { id: 'lt-emergency', name: 'Emergency Leave', code: 'EL', requiresCertificate: false, paid: true, color: '#ea580c' },
  ]

  const roleSalaries = {
    chef: { basic: 5500, housing: 1500, transport: 500, other: 200 },
    cashier: { basic: 3500, housing: 1000, transport: 400, other: 100 },
    waiter: { basic: 3200, housing: 1000, transport: 400, other: 150 },
    delivery: { basic: 3000, housing: 800, transport: 600, other: 100 },
    inventory: { basic: 4000, housing: 1200, transport: 400, other: 100 },
    manager: { basic: 9000, housing: 2500, transport: 800, other: 500 },
  }

  const employees = []
  const documents = []
  const workPermits = []
  const leaveBalances = []
  const leaves = []
  const attendance = []
  const punchCorrections = []
  const salaryStructures = []
  const payrollRuns = []
  const letterRequests = []

  // Distribution: ~8-9 per branch, managers first
  const staffing = [
    { branchId: 'br-001', roles: ['manager', 'chef', 'chef', 'cashier', 'waiter', 'waiter', 'waiter', 'delivery', 'inventory'] },
    { branchId: 'br-002', roles: ['manager', 'chef', 'cashier', 'waiter', 'waiter', 'waiter', 'delivery', 'delivery'] },
    { branchId: 'br-003', roles: ['manager', 'chef', 'cashier', 'waiter', 'waiter', 'delivery', 'inventory', 'inventory'] },
  ]

  let empIdx = 1
  staffing.forEach((plan) => {
    plan.roles.forEach((role, ri) => {
      const i = empIdx - 1
      const first = FIRST[i % FIRST.length]
      const last = LAST[i % LAST.length]
      const name = `${first} ${last}`
      const joinOffset = 60 + ((i * 47) % 900)
      const joinDate = format(subDays(today, joinOffset), 'yyyy-MM-dd')
      const empNo = `GT-${1000 + empIdx}`
      const id = uid('emp', empIdx)
      const nationality = ['UAE', 'India', 'Philippines', 'Pakistan', 'Egypt', 'Jordan', 'Nepal'][i % 7]
      const status = i === 22 ? 'inactive' : 'active'
      const verifyToken = `vf-${empNo.toLowerCase()}-${id}`

      employees.push({
        id,
        empNo,
        firstName: first,
        lastName: last,
        name,
        email: `${first.toLowerCase()}.${last.split(' ').pop().toLowerCase()}@gulftaste.ae`,
        phone: `+971 5${(i % 9) + 0}${String(1000000 + i * 137).slice(-7)}`,
        role,
        branchId: plan.branchId,
        joinDate,
        status,
        nationality,
        gender: i % 3 === 0 ? 'female' : 'male',
        dob: format(subDays(today, 8000 + i * 200), 'yyyy-MM-dd'),
        photo: avatar(name, i),
        bankName: ['Emirates NBD', 'FAB', 'ADCB', 'Mashreq', 'HSBC'][i % 5],
        bankIban: `AE07${String(3000000000000000000 + i * 7919).slice(0, 19)}`,
        verifyToken,
        cardExpiry: format(addDays(today, 180 + (i % 200)), 'yyyy-MM-dd'),
      })

      const sal = roleSalaries[role]
      salaryStructures.push({
        employeeId: id,
        basic: sal.basic,
        allowances: {
          housing: sal.housing,
          transport: sal.transport,
          other: sal.other,
        },
        deductions: {
          loan: i % 5 === 0 ? 200 : 0,
          other: 0,
        },
        currency: 'AED',
      })

      leaveBalances.push({
        employeeId: id,
        annual: 30 - (i % 8),
        medical: 15 - (i % 4),
        unpaid: 0,
        emergency: 5 - (i % 3),
        usedAnnual: i % 8,
        usedMedical: i % 4,
      })

      // Documents
      const docSpecs = [
        { type: 'passport', daysToExpiry: [400, 200, 75, 20, -10][i % 5], number: `P${9000000 + i * 13}` },
        { type: 'visa', daysToExpiry: [300, 150, 55, 15, -5][i % 5], number: `V${8000000 + i * 17}` },
        { type: 'insurance', daysToExpiry: [250, 100, 80, 25, 40][i % 5], number: `INS-${5000 + i}` },
        { type: 'emirates_id', daysToExpiry: [500, 180, 45, 28, 90][i % 5], number: `784-${1990 + (i % 20)}-${String(1000000 + i).slice(-7)}-${i % 9}` },
      ]
      docSpecs.forEach((d, di) => {
        const expiry = format(addDays(today, d.daysToExpiry), 'yyyy-MM-dd')
        const issue = format(subDays(addDays(today, d.daysToExpiry), 365 * 2), 'yyyy-MM-dd')
        documents.push({
          id: `doc-${id}-${di}`,
          employeeId: id,
          type: d.type,
          number: d.number,
          issueDate: issue,
          expiryDate: expiry,
          fileName: `${d.type}_${empNo}.pdf`,
          fileData: null,
          fileMime: 'application/pdf',
          updatedAt: format(subDays(today, di + 1), "yyyy-MM-dd'T'HH:mm:ss"),
        })
      })

      // Work permits — 2-3 for longer-serving
      const permitCount = joinOffset > 400 ? 3 : joinOffset > 180 ? 2 : 1
      for (let p = 0; p < permitCount; p++) {
        const isLatest = p === permitCount - 1
        const issueOffset = joinOffset - p * 365
        const issueDate = format(subDays(today, Math.max(issueOffset, 30)), 'yyyy-MM-dd')
        const expiryDate = format(addDays(new Date(issueDate), 365), 'yyyy-MM-dd')
        const expired = new Date(expiryDate) < today
        workPermits.push({
          id: `wp-${id}-${p + 1}`,
          employeeId: id,
          permitNo: `WP-${2020 + p}-${10000 + empIdx * 10 + p}`,
          issueDate,
          expiryDate,
          status: isLatest ? (expired ? 'Expired' : 'Active') : 'Expired',
          fileName: `work_permit_${empNo}_${p + 1}.pdf`,
          fileData: null,
          createdAt: issueDate,
        })
      }

      empIdx++
    })
  })

  // Attendance last 30 days
  const dayRange = eachDayOfInterval({ start: subDays(today, 29), end: today })
  employees.filter((e) => e.status === 'active').forEach((emp, ei) => {
    dayRange.forEach((day, di) => {
      const dow = getDay(day)
      if (dow === 0) return // Sunday off for demo
      // ~10% absent randomly but deterministically
      if ((ei * 7 + di * 3) % 11 === 0) return

      const late = (ei + di) % 9 === 0
      const earlyOut = (ei + di) % 13 === 0
      const inH = late ? 9 : 8
      const inM = late ? 15 + (ei % 30) : (ei * 3) % 20
      const outH = earlyOut ? 16 : 17
      const outM = earlyOut ? 30 : 0 + (ei % 15)

      const punchIn = setMinutes(setHours(day, inH), inM)
      const punchOut = setMinutes(setHours(day, outH), outM)
      const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

      attendance.push({
        id: `att-${emp.id}-${format(day, 'yyyyMMdd')}`,
        employeeId: emp.id,
        branchId: emp.branchId,
        date: format(day, 'yyyy-MM-dd'),
        punches: [
          {
            id: `p-${emp.id}-${format(day, 'yyyyMMdd')}-in`,
            type: 'in',
            at: punchIn.toISOString(),
            lat: branches.find((b) => b.id === emp.branchId).lat + 0.0001,
            lng: branches.find((b) => b.id === emp.branchId).lng + 0.0001,
            insideGeofence: true,
            distanceM: 12,
          },
          ...(isToday && ei % 4 === 0
            ? []
            : [
                {
                  id: `p-${emp.id}-${format(day, 'yyyyMMdd')}-out`,
                  type: 'out',
                  at: punchOut.toISOString(),
                  lat: branches.find((b) => b.id === emp.branchId).lat,
                  lng: branches.find((b) => b.id === emp.branchId).lng,
                  insideGeofence: true,
                  distanceM: 8,
                },
              ]),
        ],
        late,
        earlyOut: isToday && ei % 4 === 0 ? false : earlyOut,
        status: isToday && ei % 4 === 0 ? 'in' : 'complete',
      })
    })
  })

  // Sample leaves
  const sampleLeaveEmployees = employees.filter((e) => e.status === 'active').slice(0, 12)
  sampleLeaveEmployees.forEach((emp, i) => {
    if (i < 4) {
      leaves.push({
        id: `lv-${i + 1}`,
        employeeId: emp.id,
        leaveTypeId: 'lt-annual',
        startDate: format(addDays(today, 5 + i * 3), 'yyyy-MM-dd'),
        endDate: format(addDays(today, 7 + i * 3), 'yyyy-MM-dd'),
        days: 3,
        reason: 'Family vacation planned',
        status: i < 2 ? 'Pending' : 'Approved',
        rejectReason: null,
        certificateFile: null,
        certificateName: null,
        certificateMime: null,
        createdAt: format(subDays(today, 2), "yyyy-MM-dd'T'HH:mm:ss"),
        decidedAt: i >= 2 ? format(subDays(today, 1), "yyyy-MM-dd'T'HH:mm:ss") : null,
        decidedBy: i >= 2 ? 'hr' : null,
      })
    }
    if (i >= 4 && i < 7) {
      leaves.push({
        id: `lv-${i + 10}`,
        employeeId: emp.id,
        leaveTypeId: 'lt-medical',
        startDate: format(subDays(today, 10 - i), 'yyyy-MM-dd'),
        endDate: format(subDays(today, 8 - i), 'yyyy-MM-dd'),
        days: 3,
        reason: 'Medical treatment / recovery',
        status: i === 4 ? 'Pending' : i === 5 ? 'Approved' : 'Rejected',
        rejectReason: i === 6 ? 'Certificate incomplete — please resubmit with doctor stamp' : null,
        certificateFile: null,
        certificateName: 'medical_certificate.pdf',
        certificateMime: 'application/pdf',
        createdAt: format(subDays(today, 12), "yyyy-MM-dd'T'HH:mm:ss"),
        decidedAt: i > 4 ? format(subDays(today, 9), "yyyy-MM-dd'T'HH:mm:ss") : null,
        decidedBy: i > 4 ? 'manager' : null,
      })
    }
    if (i >= 7 && i < 10) {
      leaves.push({
        id: `lv-${i + 20}`,
        employeeId: emp.id,
        leaveTypeId: 'lt-annual',
        startDate: format(subDays(today, 20), 'yyyy-MM-dd'),
        endDate: format(subDays(today, 18), 'yyyy-MM-dd'),
        days: 3,
        reason: 'Personal matters',
        status: 'Approved',
        rejectReason: null,
        certificateFile: null,
        certificateName: null,
        certificateMime: null,
        createdAt: format(subDays(today, 25), "yyyy-MM-dd'T'HH:mm:ss"),
        decidedAt: format(subDays(today, 24), "yyyy-MM-dd'T'HH:mm:ss"),
        decidedBy: 'hr',
      })
    }
  })

  // Punch corrections
  punchCorrections.push(
    {
      id: 'pc-001',
      employeeId: employees[3].id,
      date: format(subDays(today, 2), 'yyyy-MM-dd'),
      requestedPunchType: 'out',
      requestedTime: '17:05',
      reason: 'Forgot to punch out — was closing kitchen',
      status: 'Pending',
      rejectReason: null,
      createdAt: format(subDays(today, 1), "yyyy-MM-dd'T'HH:mm:ss"),
    },
    {
      id: 'pc-002',
      employeeId: employees[5].id,
      date: format(subDays(today, 5), 'yyyy-MM-dd'),
      requestedPunchType: 'in',
      requestedTime: '08:02',
      reason: 'Phone battery died at start of shift',
      status: 'Approved',
      rejectReason: null,
      createdAt: format(subDays(today, 4), "yyyy-MM-dd'T'HH:mm:ss"),
    }
  )

  // Payroll for previous 2 months
  ;[2, 1].forEach((monthsAgo) => {
    const monthDate = startOfMonth(subMonths(today, monthsAgo))
    const monthKey = format(monthDate, 'yyyy-MM')
    const locked = monthsAgo === 2
    const items = employees
      .filter((e) => e.status === 'active')
      .map((emp) => {
        const s = salaryStructures.find((x) => x.employeeId === emp.id)
        const allowances = s.allowances.housing + s.allowances.transport + s.allowances.other
        const deductions = s.deductions.loan + s.deductions.other
        const net = s.basic + allowances - deductions
        return {
          employeeId: emp.id,
          basic: s.basic,
          allowances,
          allowanceBreakdown: { ...s.allowances },
          deductions,
          deductionBreakdown: { ...s.deductions },
          net,
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
    payrollRuns.push({
      id: `pr-${monthKey}`,
      month: monthKey,
      status: locked ? 'Locked' : 'Approved',
      items,
      totals,
      createdAt: format(endOfMonth(monthDate), "yyyy-MM-dd'T'HH:mm:ss"),
      approvedAt: format(addDays(endOfMonth(monthDate), 2), "yyyy-MM-dd'T'HH:mm:ss"),
      lockedAt: locked ? format(addDays(endOfMonth(monthDate), 3), "yyyy-MM-dd'T'HH:mm:ss") : null,
    })
  })

  // Letter requests
  letterRequests.push(
    {
      id: 'lr-001',
      employeeId: employees[1].id,
      purpose: 'Salary transfer to new account',
      addressedTo: 'Emirates NBD',
      status: 'Generated',
      createdAt: format(subDays(today, 6), "yyyy-MM-dd'T'HH:mm:ss"),
      generatedAt: format(subDays(today, 5), "yyyy-MM-dd'T'HH:mm:ss"),
    },
    {
      id: 'lr-002',
      employeeId: employees[4].id,
      purpose: 'Bank loan application',
      addressedTo: 'FAB Personal Banking',
      status: 'Pending',
      createdAt: format(subDays(today, 1), "yyyy-MM-dd'T'HH:mm:ss"),
      generatedAt: null,
    }
  )

  return {
    version: 1,
    seededAt: new Date().toISOString(),
    company,
    branches,
    leaveTypes,
    employees,
    documents,
    workPermits,
    leaveBalances,
    leaves,
    attendance,
    punchCorrections,
    salaryStructures,
    payrollRuns,
    letterRequests,
  }
}

export { ROLES }
