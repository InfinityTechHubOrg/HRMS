import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { getPayrollRun, getPayslip, lockPayroll } from '../../services/payroll'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { PageSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../hooks/useToast'
import { aed } from '../../utils/dates'
import { downloadPayslipPdf } from '../../utils/pdf'
import { useSelector } from 'react-redux'

export default function PayrollMonth() {
  const { month } = useParams()
  const isHr = useSelector((s) => s.session.role === 'hr')
  const toast = useToast()
  const [run, setRun] = useState(null)

  const load = () => getPayrollRun(month).then(setRun)
  useEffect(() => {
    load()
  }, [month])

  if (!run) return <PageSkeleton />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/hr/payroll" className="rounded-xl p-2 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Payroll · {month}</h1>
            <p className="text-sm text-slate-500">Net total {aed(run.totals.net)}</p>
          </div>
          <StatusBadge status={run.status} />
        </div>
        {isHr && run.status === 'Approved' && (
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await lockPayroll(month)
                toast.success('Month locked')
                load()
              } catch (e) {
                toast.error(e.message)
              }
            }}
          >
            Lock
          </Button>
        )}
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Basic</th>
                <th className="px-4 py-3">Allowances</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Net</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {run.items.map((it) => (
                <tr key={it.employeeId}>
                  <td className="px-4 py-2.5">
                    <Link to={`/hr/employees/${it.employeeId}`} className="font-medium hover:text-brand-700">
                      {it.employee?.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{aed(it.basic)}</td>
                  <td className="px-4 py-2.5">{aed(it.allowances)}</td>
                  <td className="px-4 py-2.5">{aed(it.deductions)}</td>
                  <td className="px-4 py-2.5 font-medium">{aed(it.net)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const slip = await getPayslip(it.employeeId, month)
                        downloadPayslipPdf(slip)
                      }}
                    >
                      <Download className="h-3.5 w-3.5" /> Payslip
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
