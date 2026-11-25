import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Users, UserCheck, UserX, Clock, CalendarDays, FileWarning, Wallet } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { StatCard } from '../../components/ui/Card'
import Card from '../../components/ui/Card'
import { PageSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/Badge'
import { headcountByBranch } from '../../services/employees'
import { todayStats, getAttendanceTrend, getLiveBoard } from '../../services/attendance'
import { pendingLeaveCount, listLeaves } from '../../services/leaves'
import { expiringSummary } from '../../services/documents'
import { listPayrollRuns } from '../../services/payroll'
import { useDataRevision } from '../../hooks/useDataRevision'
import { fmtTime } from '../../utils/dates'

export default function HrDashboard() {
  const session = useSelector((s) => s.session)
  const branchId = session.role === 'manager' ? session.branchId : undefined
  const revision = useDataRevision()
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [hc, stats, trend, pending, exp, payroll, board, pendingLeaves] = await Promise.all([
        headcountByBranch(),
        todayStats(branchId),
        getAttendanceTrend(14, branchId),
        pendingLeaveCount(branchId),
        expiringSummary(branchId),
        listPayrollRuns(),
        getLiveBoard(branchId),
        listLeaves({ branchId, status: 'Pending' }),
      ])
      if (!cancelled) {
        setData({
          hc: branchId ? hc.filter((h) => h.branchId === branchId) : hc,
          stats,
          trend,
          pending,
          exp,
          payroll: payroll[0],
          board,
          pendingLeaves: pendingLeaves.slice(0, 5),
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [branchId, revision])

  if (!data) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {session.role === 'manager' ? 'Branch Dashboard' : 'HR Dashboard'}
        </h1>
        <p className="text-sm text-slate-500">Live overview · updates when staff punch or request leave</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Present today" value={data.stats.present} icon={UserCheck} tone="green" hint={`${data.stats.inNow} currently in`} />
        <StatCard label="Not yet in" value={data.stats.absent} icon={UserX} tone="amber" />
        <StatCard label="Late today" value={data.stats.late} icon={Clock} tone="red" />
        <StatCard label="Pending leaves" value={data.pending} icon={CalendarDays} tone="brand" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Headcount by branch" className="lg:col-span-1">
          <ul className="space-y-3">
            {data.hc.map((h) => (
              <li key={h.branchId} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-700">
                  <Users className="h-4 w-4 text-slate-400" />
                  {h.branchName}
                </span>
                <span className="font-semibold">{h.total}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Attendance trend (14 days)" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="present" name="Present" fill="#256fe7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Live board"
          action={
            <Link to="/hr/attendance" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          }
        >
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-2xl font-semibold text-emerald-700">{data.board.in.length}</p>
              <p className="text-emerald-600">In</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-2xl font-semibold text-slate-700">{data.board.out.length}</p>
              <p className="text-slate-500">Out</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-2xl font-semibold text-amber-700">{data.board.notYet.length}</p>
              <p className="text-amber-600">Not yet</p>
            </div>
          </div>
          <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto">
            {data.board.in.slice(0, 6).map(({ employee, record }) => (
              <li key={employee.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{employee.name}</span>
                <span className="text-xs text-slate-400">
                  {fmtTime(record?.punches?.find((p) => p.type === 'in')?.at)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Expiring documents"
          action={
            <Link to="/hr/documents/expiring" className="text-xs font-medium text-brand-600 hover:underline">
              Open
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-xl font-semibold text-red-700">{data.exp.expired}</p>
              <p className="text-xs text-red-600">Expired</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-xl font-semibold text-amber-700">{data.exp.d30}</p>
              <p className="text-xs text-amber-600">≤ 30 days</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-3">
              <p className="text-xl font-semibold text-orange-700">{data.exp.d60}</p>
              <p className="text-xs text-orange-600">≤ 60 days</p>
            </div>
            <div className="rounded-xl bg-brand-50 p-3">
              <p className="text-xl font-semibold text-brand-700">{data.exp.d90}</p>
              <p className="text-xs text-brand-600">≤ 90 days</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <FileWarning className="h-3.5 w-3.5" />
            Within 90-day window
          </div>
        </Card>

        <Card title="Payroll & approvals">
          <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-brand-600" />
              <div>
                <p className="text-sm font-medium">{data.payroll?.month || '—'}</p>
                <p className="text-xs text-slate-500">Latest run</p>
              </div>
            </div>
            {data.payroll && <StatusBadge status={data.payroll.status} />}
          </div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Pending leave requests</p>
          <ul className="space-y-2">
            {data.pendingLeaves.length === 0 && <li className="text-sm text-slate-400">All clear</li>}
            {data.pendingLeaves.map((l) => (
              <li key={l.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{l.employee?.name}</span>
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
          <Link to="/hr/leaves" className="mt-3 inline-block text-xs font-medium text-brand-600 hover:underline">
            Review queue →
          </Link>
        </Card>
      </div>
    </div>
  )
}
