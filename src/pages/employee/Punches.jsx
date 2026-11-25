import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { getPunchHistory, requestPunchCorrection, listPunchCorrections } from '../../services/attendance'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../hooks/useToast'
import { useDataRevision } from '../../hooks/useDataRevision'
import { fmtDate, fmtTime, todayISO } from '../../utils/dates'

export default function EmployeePunches() {
  const employeeId = useSelector((s) => s.session.employeeId)
  const revision = useDataRevision()
  const toast = useToast()
  const [history, setHistory] = useState([])
  const [corrections, setCorrections] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { date: todayISO(), requestedPunchType: 'out', requestedTime: '17:00' },
  })

  const load = async () => {
    if (!employeeId) return
    setLoading(true)
    const [h, c] = await Promise.all([
      getPunchHistory(employeeId),
      listPunchCorrections({ employeeId }),
    ])
    setHistory(h)
    setCorrections(c)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [employeeId, revision]) // eslint-disable-line

  const onSubmit = async (data) => {
    try {
      await requestPunchCorrection({ employeeId, ...data })
      toast.success('Correction requested')
      setOpen(false)
      reset()
      load()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Punch history</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          Missed punch
        </Button>
      </div>

      <Card title="My corrections">
        <ul className="space-y-2">
          {corrections.map((c) => (
            <li key={c.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>
                  {fmtDate(c.date)} · {c.requestedPunchType} {c.requestedTime}
                </span>
                <StatusBadge status={c.status} />
              </div>
              {c.rejectReason && <p className="mt-1 text-xs text-red-600">{c.rejectReason}</p>}
            </li>
          ))}
          {corrections.length === 0 && <p className="text-sm text-slate-400">No requests</p>}
        </ul>
      </Card>

      <Card title="History">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : (
          <ul className="space-y-2">
            {history.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-100 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{fmtDate(a.date)}</span>
                  <div className="flex gap-1">
                    {a.late && <StatusBadge status="Late" />}
                    {a.earlyOut && <StatusBadge status="Early-out" />}
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  In {fmtTime(a.punches.find((p) => p.type === 'in')?.at)} · Out{' '}
                  {fmtTime([...a.punches].reverse().find((p) => p.type === 'out')?.at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request punch correction"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
              Submit
            </Button>
          </div>
        }
      >
        <form className="grid gap-3">
          <Field label="Date">
            <Input type="date" {...register('date', { required: true })} />
          </Field>
          <Field label="Punch type">
            <Select {...register('requestedPunchType')}>
              <option value="in">In</option>
              <option value="out">Out</option>
            </Select>
          </Field>
          <Field label="Time">
            <Input type="time" {...register('requestedTime', { required: true })} />
          </Field>
          <Field label="Reason">
            <Textarea {...register('reason', { required: true })} />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
