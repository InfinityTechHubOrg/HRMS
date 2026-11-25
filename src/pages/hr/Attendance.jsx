import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Download } from 'lucide-react'
import {
  getLiveBoard,
  getAttendanceLog,
  listPunchCorrections,
  decidePunchCorrection,
} from '../../services/attendance'
import { listEmployees } from '../../services/employees'
import { getBranches } from '../../services/company'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../hooks/useToast'
import { useDataRevision } from '../../hooks/useDataRevision'
import { fmtDate, fmtTime, todayISO } from '../../utils/dates'
import { exportCsv } from '../../utils/csv'
import { subDays, format } from 'date-fns'

export default function Attendance() {
  const session = useSelector((s) => s.session)
  const branchId = session.role === 'manager' ? session.branchId : undefined
  const revision = useDataRevision()
  const toast = useToast()

  const [board, setBoard] = useState(null)
  const [log, setLog] = useState([])
  const [branches, setBranches] = useState([])
  const [employees, setEmployees] = useState([])
  const [corrections, setCorrections] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterBranch, setFilterBranch] = useState(branchId || '')
  const [filterEmp, setFilterEmp] = useState('')
  const [from, setFrom] = useState(format(subDays(new Date(), 14), 'yyyy-MM-dd'))
  const [to, setTo] = useState(todayISO())
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    setLoading(true)
    const bid = branchId || filterBranch || undefined
    const [b, l, br, emps, corr] = await Promise.all([
      getLiveBoard(bid),
      getAttendanceLog({
        branchId: bid,
        employeeId: filterEmp || undefined,
        from,
        to,
      }),
      getBranches(),
      listEmployees({ branchId: bid, status: 'active' }),
      listPunchCorrections({ branchId: bid }),
    ])
    setBoard(b)
    setLog(l)
    setBranches(br)
    setEmployees(emps)
    setCorrections(corr)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [branchId, filterBranch, filterEmp, from, to, revision]) // eslint-disable-line

  const decide = async (id, approve) => {
    try {
      if (!approve) {
        if (!rejectReason.trim()) {
          toast.error('Reject reason is mandatory')
          return
        }
      }
      await decidePunchCorrection(id, { approve, rejectReason: approve ? null : rejectReason })
      toast.success(approve ? 'Correction approved' : 'Correction rejected')
      setRejectModal(null)
      setRejectReason('')
      load()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const exportLog = () => {
    exportCsv(
      `attendance_${from}_${to}.csv`,
      log,
      [
        { label: 'Date', value: (r) => r.date },
        { label: 'Employee', value: (r) => r.employee?.name },
        { label: 'Emp No', value: (r) => r.employee?.empNo },
        { label: 'Branch', value: (r) => r.branch?.name },
        { label: 'Punch In', value: (r) => (r.punchIn ? fmtTime(r.punchIn.at) : '') },
        { label: 'Punch Out', value: (r) => (r.punchOut ? fmtTime(r.punchOut.at) : '') },
        { label: 'Late', value: (r) => (r.late ? 'Yes' : '') },
        { label: 'Early-out', value: (r) => (r.earlyOut ? 'Yes' : '') },
        { label: 'Worked mins', key: 'workedMins' },
      ]
    )
    toast.success('CSV exported')
  }

  const Col = ({ title, items, tone }) => (
    <div className={`rounded-xl p-3 ${tone}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-80">
        {title} ({items.length})
      </p>
      <ul className="max-h-56 space-y-1.5 overflow-y-auto text-sm">
        {items.map(({ employee, record }) => (
          <li key={employee.id} className="flex justify-between gap-2 rounded-lg bg-white/70 px-2 py-1.5">
            <span className="truncate font-medium">{employee.name}</span>
            <span className="shrink-0 text-xs opacity-70">
              {record?.punches?.[0] ? fmtTime(record.punches[0].at) : '—'}
            </span>
          </li>
        ))}
        {items.length === 0 && <li className="text-xs opacity-60">None</li>}
      </ul>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Attendance</h1>
          <p className="text-sm text-slate-500">Live board updates when employees punch</p>
        </div>
        <Button variant="secondary" onClick={exportLog}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card title={`Live board · ${fmtDate(todayISO())}`}>
        {!board ? (
          <TableSkeleton rows={3} />
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <Col title="In" items={board.in} tone="bg-emerald-50 text-emerald-900" />
            <Col title="Out" items={board.out} tone="bg-slate-100 text-slate-800" />
            <Col title="Not yet in" items={board.notYet} tone="bg-amber-50 text-amber-900" />
          </div>
        )}
      </Card>

      <Card title="Attendance log" padded={false}>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          {!branchId && (
            <Select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="!w-auto">
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          <Select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)} className="!w-auto">
            <option value="">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!w-auto" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!w-auto" />
        </div>
        {loading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">In</th>
                  <th className="px-4 py-3">Out</th>
                  <th className="px-4 py-3">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {log.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">{fmtDate(r.date)}</td>
                    <td className="px-4 py-2.5">{r.employee?.name}</td>
                    <td className="px-4 py-2.5">{r.branch?.name}</td>
                    <td className="px-4 py-2.5">{r.punchIn ? fmtTime(r.punchIn.at) : '—'}</td>
                    <td className="px-4 py-2.5">{r.punchOut ? fmtTime(r.punchOut.at) : '—'}</td>
                    <td className="space-x-1 px-4 py-2.5">
                      {r.late && <StatusBadge status="Late" />}
                      {r.earlyOut && <StatusBadge status="Early-out" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Missed-punch corrections">
        <ul className="space-y-3">
          {corrections.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
              <div className="text-sm">
                <p className="font-medium">{c.employee?.name}</p>
                <p className="text-xs text-slate-500">
                  {fmtDate(c.date)} · request {c.requestedPunchType} at {c.requestedTime}
                </p>
                <p className="mt-1 text-xs text-slate-600">{c.reason}</p>
                {c.rejectReason && <p className="mt-1 text-xs text-red-600">Reject: {c.rejectReason}</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.status} />
                {c.status === 'Pending' && (
                  <>
                    <Button size="sm" variant="success" onClick={() => decide(c.id, true)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectModal(c)}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
          {corrections.length === 0 && <p className="text-sm text-slate-400">No correction requests</p>}
        </ul>
      </Card>

      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Reject correction"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => decide(rejectModal.id, false)}>
              Reject
            </Button>
          </div>
        }
      >
        <Field label="Reason (required)">
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </Field>
      </Modal>
    </div>
  )
}
