import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format, subMonths } from 'date-fns'
import { listPayrollRuns, previewPayroll, approvePayroll, lockPayroll } from '../../services/payroll'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../hooks/useToast'
import { useDataRevision } from '../../hooks/useDataRevision'
import { aed } from '../../utils/dates'
import { useSelector } from 'react-redux'

export default function Payroll() {
  const isHr = useSelector((s) => s.session.role === 'hr')
  const toast = useToast()
  const revision = useDataRevision()
  const navigate = useNavigate()
  const [runs, setRuns] = useState([])
  const [month, setMonth] = useState(format(subMonths(new Date(), 0), 'yyyy-MM'))
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const months = Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), i), 'yyyy-MM'))

  const load = async () => {
    setLoading(true)
    const [r, p] = await Promise.all([listPayrollRuns(), previewPayroll(month)])
    setRuns(r)
    setPreview(p)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [month, revision]) // eslint-disable-line

  const onApprove = async () => {
    setBusy(true)
    try {
      await approvePayroll(month)
      toast.success(`Payroll ${month} approved`)
      load()
      navigate(`/hr/payroll/${month}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  const onLock = async () => {
    setBusy(true)
    try {
      await lockPayroll(month)
      toast.success(`Payroll ${month} locked`)
      load()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Payroll</h1>
        <p className="text-sm text-slate-500">Preview, approve, then lock monthly runs (AED)</p>
      </div>

      <Card title="Run payroll">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Select value={month} onChange={(e) => setMonth(e.target.value)} className="!w-auto">
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          {preview && <StatusBadge status={preview.status} />}
          {isHr && preview?.status === 'Draft' && (
            <Button loading={busy} onClick={onApprove}>
              Approve
            </Button>
          )}
          {isHr && preview?.status === 'Approved' && (
            <Button loading={busy} variant="secondary" onClick={onLock}>
              Lock month
            </Button>
          )}
          {preview && !preview.preview && (
            <Link to={`/hr/payroll/${month}`} className="text-sm font-medium text-brand-600 hover:underline">
              Open run →
            </Link>
          )}
        </div>

        {loading || !preview ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
              {[
                ['Basic', preview.totals.basic],
                ['Allowances', preview.totals.allowances],
                ['Deductions', preview.totals.deductions],
                ['Net', preview.totals.net],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-lg font-semibold">{aed(val)}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Basic</th>
                    <th className="px-3 py-2">Allowances</th>
                    <th className="px-3 py-2">Deductions</th>
                    <th className="px-3 py-2">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.items.map((it) => (
                    <tr key={it.employeeId}>
                      <td className="px-3 py-2">{it.employee?.name}</td>
                      <td className="px-3 py-2">{aed(it.basic)}</td>
                      <td className="px-3 py-2">{aed(it.allowances)}</td>
                      <td className="px-3 py-2">{aed(it.deductions)}</td>
                      <td className="px-3 py-2 font-medium">{aed(it.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card title="Previous runs">
        <ul className="space-y-2">
          {runs.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <Link to={`/hr/payroll/${r.month}`} className="font-medium text-brand-700 hover:underline">
                {r.month}
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{aed(r.totals.net)}</span>
                <StatusBadge status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
