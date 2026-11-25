import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Download, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { getEmployee } from '../../services/employees'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { PageSkeleton } from '../../components/ui/Skeleton'
import { fmtDate } from '../../utils/dates'
import { downloadEmployeeCardPdf } from '../../utils/pdf'
import { verificationBaseUrl } from '../../config/env'

export default function EmployeeCard() {
  const employeeId = useSelector((s) => s.session.employeeId)
  const [emp, setEmp] = useState(null)

  useEffect(() => {
    if (employeeId) getEmployee(employeeId).then(setEmp)
  }, [employeeId])

  if (!emp) return <PageSkeleton />

  const verifyUrl = `${verificationBaseUrl()}/verify/${emp.verifyToken}`

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">My card</h1>
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 p-1 shadow-lg">
        <div className="rounded-xl bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Gulf Taste</p>
              <p className="text-[10px] text-slate-400">Employee Identity Card</p>
            </div>
            <StatusBadge status={emp.status === 'active' ? 'Active' : 'Inactive'} />
          </div>
          <div className="flex gap-3">
            <img src={emp.photo} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <div className="flex-1 space-y-0.5 text-sm">
              <p className="font-semibold">{emp.name}</p>
              <p className="capitalize text-slate-600">{emp.role}</p>
              <p className="text-xs text-slate-500">{emp.empNo}</p>
              <p className="text-xs text-slate-500">{emp.branch?.name}</p>
              <p className="text-xs text-slate-400">Exp {fmtDate(emp.cardExpiry)}</p>
            </div>
            <QRCodeSVG value={verifyUrl} size={64} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => downloadEmployeeCardPdf(emp, emp.branch)}>
          <Download className="h-4 w-4" /> PDF
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>
    </div>
  )
}
