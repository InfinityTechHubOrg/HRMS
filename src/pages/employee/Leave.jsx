import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { applyLeave, getLeaveBalance, listLeaves } from '../../services/leaves'
import { getLeaveTypes } from '../../services/company'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'
import { useDataRevision } from '../../hooks/useDataRevision'
import { daysBetweenInclusive, fmtDate, todayISO } from '../../utils/dates'

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function EmployeeLeave() {
  const employeeId = useSelector((s) => s.session.employeeId)
  const revision = useDataRevision()
  const toast = useToast()
  const [balance, setBalance] = useState(null)
  const [leaves, setLeaves] = useState([])
  const [types, setTypes] = useState([])
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { leaveTypeId: 'lt-annual', startDate: todayISO(), endDate: todayISO() },
  })

  const leaveTypeId = watch('leaveTypeId')
  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const fileWatch = watch('certificate')
  const selectedType = types.find((t) => t.id === leaveTypeId)
  const days = daysBetweenInclusive(startDate, endDate)

  const load = async () => {
    if (!employeeId) return
    const [b, l, t] = await Promise.all([
      getLeaveBalance(employeeId),
      listLeaves({ employeeId }),
      getLeaveTypes(),
    ])
    setBalance(b)
    setLeaves(l)
    setTypes(t)
  }

  useEffect(() => {
    load()
  }, [employeeId, revision]) // eslint-disable-line

  useEffect(() => {
    const f = fileWatch?.[0]
    if (!f) {
      setPreview(null)
      return
    }
    fileToDataUrl(f).then(setPreview)
  }, [fileWatch])

  const onSubmit = async (data) => {
    try {
      let certificateFile = null
      let certificateName = null
      let certificateMime = null
      if (data.certificate?.[0]) {
        certificateFile = await fileToDataUrl(data.certificate[0])
        certificateName = data.certificate[0].name
        certificateMime = data.certificate[0].type
      }
      await applyLeave({
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        certificateFile,
        certificateName,
        certificateMime,
      })
      toast.success('Leave applied')
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
        <h1 className="text-lg font-semibold">Leave</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          Apply
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          ['Annual', balance?.annual],
          ['Medical', balance?.medical],
          ['Emergency', balance?.emergency],
          ['Used AL', balance?.usedAnnual],
        ].map(([label, val]) => (
          <Card key={label} className="!rounded-xl">
            <p className="text-[11px] text-slate-500">{label}</p>
            <p className="text-xl font-semibold">{val ?? '—'}</p>
          </Card>
        ))}
      </div>

      <Card title="My requests">
        <ul className="space-y-2">
          {leaves.map((l) => (
            <li key={l.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{l.leaveType?.name}</span>
                <StatusBadge status={l.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {fmtDate(l.startDate)} – {fmtDate(l.endDate)} · {l.days}d
              </p>
              {l.rejectReason && <p className="mt-1 text-xs text-red-600">Reason: {l.rejectReason}</p>}
            </li>
          ))}
          {leaves.length === 0 && <p className="text-sm text-slate-400">No leave requests</p>}
        </ul>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Apply for leave"
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
          <Field label="Leave type">
            <Select {...register('leaveTypeId')}>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.requiresCertificate ? ' (certificate)' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <Input type="date" {...register('startDate', { required: true })} />
            </Field>
            <Field label="To">
              <Input type="date" {...register('endDate', { required: true })} />
            </Field>
          </div>
          <p className="text-xs text-slate-500">
            Days: <strong>{days}</strong>
            {selectedType && balance && (
              <>
                {' '}
                · Balance:{' '}
                <strong>
                  {selectedType.id === 'lt-annual'
                    ? balance.annual
                    : selectedType.id === 'lt-medical'
                      ? balance.medical
                      : selectedType.id === 'lt-emergency'
                        ? balance.emergency
                        : '—'}
                </strong>
              </>
            )}
          </p>
          <Field label="Reason">
            <Textarea {...register('reason', { required: true })} />
          </Field>
          {selectedType?.requiresCertificate && (
            <Field label="Medical certificate (image or PDF)" hint="Required for medical leave">
              <Input type="file" accept="image/*,application/pdf" {...register('certificate', { required: true })} />
              {preview && (
                <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                  {fileWatch?.[0]?.type?.startsWith('image/') ? (
                    <img src={preview} alt="preview" className="max-h-40 w-full object-contain" />
                  ) : (
                    <p className="p-2 text-xs text-slate-500">PDF ready: {fileWatch[0].name}</p>
                  )}
                </div>
              )}
            </Field>
          )}
        </form>
      </Modal>
    </div>
  )
}
