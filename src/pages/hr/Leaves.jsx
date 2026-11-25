import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { addDays, format } from 'date-fns'
import { listLeaves, decideLeave, getLeaveCalendar } from '../../services/leaves'
import { getLeaveTypes, updateLeaveType, getBranches } from '../../services/company'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Field, Textarea, Select } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../hooks/useToast'
import { useDataRevision } from '../../hooks/useDataRevision'
import { fmtDate, todayISO } from '../../utils/dates'

export default function Leaves() {
  const session = useSelector((s) => s.session)
  const branchId = session.role === 'manager' ? session.branchId : undefined
  const revision = useDataRevision()
  const toast = useToast()
  const [pending, setPending] = useState([])
  const [all, setAll] = useState([])
  const [calendar, setCalendar] = useState([])
  const [types, setTypes] = useState([])
  const [branches, setBranches] = useState([])
  const [calBranch, setCalBranch] = useState(branchId || '')
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [viewer, setViewer] = useState(null)

  const load = async () => {
    setLoading(true)
    const bid = branchId || undefined
    const [p, a, t, br, cal] = await Promise.all([
      listLeaves({ branchId: bid, status: 'Pending' }),
      listLeaves({ branchId: bid }),
      getLeaveTypes(),
      getBranches(),
      getLeaveCalendar(branchId || calBranch || undefined, {
        from: todayISO(),
        to: format(addDays(new Date(), 45), 'yyyy-MM-dd'),
      }),
    ])
    setPending(p)
    setAll(a)
    setTypes(t)
    setBranches(br)
    setCalendar(cal)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [branchId, calBranch, revision]) // eslint-disable-line

  const decide = async (id, approve) => {
    try {
      if (!approve && !rejectReason.trim()) {
        toast.error('Reject reason is mandatory')
        return
      }
      await decideLeave(id, {
        approve,
        rejectReason: approve ? null : rejectReason,
        decidedBy: session.role,
      })
      toast.success(approve ? 'Leave approved — balance updated' : 'Leave rejected')
      setRejectModal(null)
      setRejectReason('')
      setViewer(null)
      load()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const toggleCert = async (type) => {
    if (session.role !== 'hr') return
    try {
      await updateLeaveType(type.id, { requiresCertificate: !type.requiresCertificate })
      toast.success(`${type.name}: certificate ${!type.requiresCertificate ? 'required' : 'optional'}`)
      load()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Leaves</h1>
        <p className="text-sm text-slate-500">Approve requests, view certificates, manage leave types</p>
      </div>

      <Card title={`Pending queue (${pending.length})`}>
        {loading ? (
          <TableSkeleton rows={3} />
        ) : pending.length === 0 ? (
          <p className="text-sm text-slate-400">No pending requests</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <div className="text-sm">
                  <p className="font-medium">{l.employee?.name}</p>
                  <p className="text-xs text-slate-500">
                    {l.leaveType?.name} · {fmtDate(l.startDate)} – {fmtDate(l.endDate)} · {l.days} day(s)
                  </p>
                  <p className="mt-1 text-slate-600">{l.reason}</p>
                  {l.leaveType?.requiresCertificate && (
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-brand-600"
                      onClick={() => setViewer(l)}
                    >
                      View certificate
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => decide(l.id, true)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setRejectModal(l)}>
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Leave calendar"
          action={
            !branchId && (
              <Select value={calBranch} onChange={(e) => setCalBranch(e.target.value)} className="!w-auto !py-1 text-xs">
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            )
          }
        >
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {calendar.map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: l.leaveType?.color || '#2563eb' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{l.employee?.name}</p>
                  <p className="text-xs text-slate-500">
                    {fmtDate(l.startDate)} – {fmtDate(l.endDate)} · {l.leaveType?.name}
                  </p>
                </div>
              </li>
            ))}
            {calendar.length === 0 && <p className="text-sm text-slate-400">No approved leave in the next 45 days</p>}
          </ul>
        </Card>

        <Card title="Leave type configuration">
          <ul className="space-y-2">
            {types.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-slate-500">
                    {t.requiresCertificate ? 'Certificate required' : 'No certificate'} · {t.paid ? 'Paid' : 'Unpaid'}
                  </p>
                </div>
                {session.role === 'hr' && (
                  <Button size="sm" variant="secondary" onClick={() => toggleCert(t)}>
                    Toggle certificate
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="All requests" padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {all.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5">{l.employee?.name}</td>
                  <td className="px-4 py-2.5">{l.leaveType?.name}</td>
                  <td className="px-4 py-2.5">
                    {fmtDate(l.startDate)} – {fmtDate(l.endDate)}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={l.status} />
                    {l.rejectReason && <p className="mt-1 text-xs text-red-600">{l.rejectReason}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Reject leave"
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
        <Field label="Reason (mandatory)">
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </Field>
      </Modal>

      <Modal
        open={!!viewer}
        onClose={() => setViewer(null)}
        title="Medical certificate"
        wide
        footer={
          viewer?.status === 'Pending' && (
            <div className="flex justify-end gap-2">
              <Button variant="success" onClick={() => decide(viewer.id, true)}>
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setRejectModal(viewer)
                  setViewer(null)
                }}
              >
                Reject
              </Button>
            </div>
          )
        }
      >
        {viewer?.certificateFile ? (
          viewer.certificateMime?.startsWith('image/') ? (
            <img src={viewer.certificateFile} alt="" className="max-h-[65vh] w-full object-contain" />
          ) : (
            <iframe src={viewer.certificateFile} title="cert" className="h-[65vh] w-full rounded-lg" />
          )
        ) : (
          <p className="text-sm text-slate-500">
            Demo placeholder certificate: <strong>{viewer?.certificateName || 'medical_certificate.pdf'}</strong>.
            Employees can upload a real image/PDF when applying.
          </p>
        )}
      </Modal>
    </div>
  )
}
