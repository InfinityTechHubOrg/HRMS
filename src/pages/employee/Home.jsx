import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MapPin, AlertTriangle } from 'lucide-react'
import { getEmployee } from '../../services/employees'
import { getTodayAttendance, punch } from '../../services/attendance'
import { getBranch } from '../../services/company'
import { setSimulateInside } from '../../store/slices/sessionSlice'
import { simulateLocation } from '../../utils/geo'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import { PageSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../hooks/useToast'
import { useDataRevision } from '../../hooks/useDataRevision'
import { formatDuration, fmtTime } from '../../utils/dates'

export default function EmployeeHome() {
  const session = useSelector((s) => s.session)
  const dispatch = useDispatch()
  const toast = useToast()
  const revision = useDataRevision()
  const [emp, setEmp] = useState(null)
  const [branch, setBranch] = useState(null)
  const [today, setToday] = useState(null)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!session.employeeId) return
    ;(async () => {
      const e = await getEmployee(session.employeeId)
      setEmp(e)
      const [b, att] = await Promise.all([getBranch(e.branchId), getTodayAttendance(e.id)])
      setBranch(b)
      setToday(att)
    })()
  }, [session.employeeId, revision])

  const lastPunch = today?.punches?.[today.punches.length - 1]
  const isIn = lastPunch?.type === 'in'
  const nextType = isIn ? 'out' : 'in'

  const workedMs = useMemo(() => {
    if (!today?.punches?.length) return 0
    let total = 0
    let openIn = null
    for (const p of today.punches) {
      if (p.type === 'in') openIn = new Date(p.at).getTime()
      if (p.type === 'out' && openIn != null) {
        total += new Date(p.at).getTime() - openIn
        openIn = null
      }
    }
    if (openIn != null) total += now - openIn
    return total
  }, [today, now])

  const doPunch = async () => {
    if (!emp || !branch) return
    setBusy(true)
    try {
      const loc = simulateLocation(branch, session.simulateInside)
      const result = await punch({
        employeeId: emp.id,
        type: nextType,
        lat: loc.lat,
        lng: loc.lng,
        simulateInside: session.simulateInside,
      })
      setToday(result.record)
      toast.success(`Punched ${nextType} · ${result.distanceM}m from branch`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!emp) return <PageSkeleton />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <img src={emp.photo} alt="" className="h-12 w-12 rounded-2xl object-cover" />
        <div>
          <p className="font-semibold">{emp.name}</p>
          <p className="text-xs capitalize text-slate-500">
            {emp.role} · {branch?.name}
          </p>
        </div>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Today</p>
          {isIn ? <StatusBadge status="In" /> : today?.status === 'complete' ? <StatusBadge status="Out" /> : (
            <span className="text-xs text-slate-400">Not punched in</span>
          )}
        </div>
        <p className="text-center font-mono text-4xl font-semibold tracking-tight text-slate-900">
          {formatDuration(workedMs)}
        </p>
        <p className="mt-1 text-center text-xs text-slate-400">Worked time</p>

        <Button
          className={`mt-5 w-full !rounded-2xl !py-4 text-lg ${nextType === 'in' ? '' : '!bg-slate-800 hover:!bg-slate-900'}`}
          size="lg"
          loading={busy}
          onClick={doPunch}
        >
          Punch {nextType === 'in' ? 'In' : 'Out'}
        </Button>

        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
            <MapPin className="h-3.5 w-3.5" />
            Simulate location
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => dispatch(setSimulateInside(true))}
              className={`rounded-xl px-3 py-2 text-xs font-medium ${
                session.simulateInside ? 'bg-emerald-600 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-600'
              }`}
            >
              Inside branch
            </button>
            <button
              type="button"
              onClick={() => dispatch(setSimulateInside(false))}
              className={`rounded-xl px-3 py-2 text-xs font-medium ${
                !session.simulateInside ? 'bg-red-600 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-600'
              }`}
            >
              Outside branch
            </button>
          </div>
          {!session.simulateInside && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-red-600">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              Punch will be blocked — outside {branch?.geofenceRadiusM}m geofence
            </p>
          )}
        </div>
      </Card>

      <Card title="Today's punches">
        {!today?.punches?.length ? (
          <p className="text-sm text-slate-400">No punches yet today</p>
        ) : (
          <ul className="space-y-2">
            {today.punches.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="capitalize font-medium">{p.type}</span>
                <span className="text-slate-500">
                  {fmtTime(p.at)}
                  {p.distanceM != null && <span className="ml-2 text-xs text-slate-400">{p.distanceM}m</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        {(today?.late || today?.earlyOut) && (
          <div className="mt-3 flex gap-1">
            {today.late && <StatusBadge status="Late" />}
            {today.earlyOut && <StatusBadge status="Early-out" />}
          </div>
        )}
      </Card>
    </div>
  )
}
