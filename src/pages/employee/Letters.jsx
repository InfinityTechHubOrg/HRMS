import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { Download } from 'lucide-react'
import { listLetterRequests, requestLetter, getLetterContext } from '../../services/letters'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Field, Input, Textarea } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'
import { useDataRevision } from '../../hooks/useDataRevision'
import { fmtDateTime } from '../../utils/dates'
import { downloadSalaryLetterPdf } from '../../utils/pdf'

export default function EmployeeLetters() {
  const employeeId = useSelector((s) => s.session.employeeId)
  const revision = useDataRevision()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { addressedTo: 'Emirates NBD', purpose: 'Salary transfer to new account' },
  })

  const load = () => {
    if (!employeeId) return
    listLetterRequests({ employeeId }).then(setItems)
  }

  useEffect(() => {
    load()
  }, [employeeId, revision]) // eslint-disable-line

  const onSubmit = async (data) => {
    try {
      await requestLetter({ employeeId, ...data })
      toast.success('Letter requested')
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
        <h1 className="text-lg font-semibold">Letters</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          Request
        </Button>
      </div>

      <Card>
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{r.addressedTo}</span>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{r.purpose}</p>
              <p className="text-[11px] text-slate-400">{fmtDateTime(r.createdAt)}</p>
              {r.status === 'Generated' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={async () => {
                    const ctx = await getLetterContext(employeeId)
                    downloadSalaryLetterPdf(ctx, { purpose: r.purpose, addressedTo: r.addressedTo })
                    toast.success('Downloaded')
                  }}
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
              )}
            </li>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-400">No letter requests</p>}
        </ul>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request salary letter"
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
          <Field label="Addressed to">
            <Input {...register('addressedTo', { required: true })} />
          </Field>
          <Field label="Purpose">
            <Textarea {...register('purpose', { required: true })} />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
