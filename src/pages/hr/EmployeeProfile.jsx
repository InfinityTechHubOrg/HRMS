import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { getEmployee, updateEmployee } from '../../services/employees'
import { listDocuments, upsertDocument } from '../../services/documents'
import { listWorkPermits, renewWorkPermit } from '../../services/workPermits'
import { getPunchHistory } from '../../services/attendance'
import { listLeaves, getLeaveBalance } from '../../services/leaves'
import { getSalaryStructure, updateSalaryStructure, listPayslips } from '../../services/payroll'
import { createAndGenerateLetter, getLetterContext } from '../../services/letters'
import { getBranches } from '../../services/company'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { StatusBadge, ExpiryBadge } from '../../components/ui/Badge'
import { PageSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../hooks/useToast'
import { useDataRevision } from '../../hooks/useDataRevision'
import { expiryStatus, fmtDate, fmtDateTime, aed, fmtTime } from '../../utils/dates'
import { downloadEmployeeCardPdf, downloadPayslipPdf, downloadSalaryLetterPdf } from '../../utils/pdf'
import { getPayslip } from '../../services/payroll'
import { verificationBaseUrl } from '../../config/env'

const TABS = ['Personal', 'Documents', 'Work Permits', 'Attendance', 'Leave', 'Payroll', 'Card']

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function EmployeeProfile() {
  const { id } = useParams()
  const session = useSelector((s) => s.session)
  const isHr = session.role === 'hr'
  const toast = useToast()
  const revision = useDataRevision()
  const [tab, setTab] = useState('Personal')
  const [emp, setEmp] = useState(null)
  const [branches, setBranches] = useState([])
  const [docs, setDocs] = useState([])
  const [permits, setPermits] = useState([])
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [balance, setBalance] = useState(null)
  const [salary, setSalary] = useState(null)
  const [payslips, setPayslips] = useState([])
  const [docModal, setDocModal] = useState(null)
  const [permitModal, setPermitModal] = useState(false)
  const [letterModal, setLetterModal] = useState(false)
  const [preview, setPreview] = useState(null)

  const personalForm = useForm()
  const salaryForm = useForm()
  const docForm = useForm()
  const permitForm = useForm()
  const letterForm = useForm({ defaultValues: { purpose: 'Salary transfer', addressedTo: 'Bank Manager' } })

  const load = async () => {
    const e = await getEmployee(id)
    setEmp(e)
    personalForm.reset(e)
    const [br, d, p, att, lv, bal, sal, ps] = await Promise.all([
      getBranches(),
      listDocuments({ employeeId: id }),
      listWorkPermits(id),
      getPunchHistory(id),
      listLeaves({ employeeId: id }),
      getLeaveBalance(id),
      getSalaryStructure(id),
      listPayslips(id),
    ])
    setBranches(br)
    setDocs(d)
    setPermits(p)
    setAttendance(att)
    setLeaves(lv)
    setBalance(bal)
    setSalary(sal)
    setPayslips(ps)
    if (sal) {
      salaryForm.reset({
        basic: sal.basic,
        housing: sal.allowances?.housing,
        transport: sal.allowances?.transport,
        other: sal.allowances?.other,
        loan: sal.deductions?.loan,
        otherDed: sal.deductions?.other,
      })
    }
  }

  useEffect(() => {
    load()
  }, [id, revision]) // eslint-disable-line

  if (!emp) return <PageSkeleton />

  const savePersonal = async (data) => {
    try {
      const updated = await updateEmployee(id, data)
      setEmp(updated)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const saveSalary = async (data) => {
    try {
      const s = await updateSalaryStructure(id, {
        basic: Number(data.basic),
        allowances: {
          housing: Number(data.housing) || 0,
          transport: Number(data.transport) || 0,
          other: Number(data.other) || 0,
        },
        deductions: {
          loan: Number(data.loan) || 0,
          other: Number(data.otherDed) || 0,
        },
        currency: 'AED',
      })
      setSalary(s)
      toast.success('Salary structure saved')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const saveDoc = async (data) => {
    try {
      let fileData = docModal?.fileData || null
      let fileName = data.fileName || docModal?.fileName
      let fileMime = docModal?.fileMime
      if (data.file?.[0]) {
        fileData = await fileToDataUrl(data.file[0])
        fileName = data.file[0].name
        fileMime = data.file[0].type
      }
      await upsertDocument({
        id: docModal?.id,
        employeeId: id,
        type: data.type,
        number: data.number,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        fileName,
        fileData,
        fileMime,
      })
      toast.success('Document saved')
      setDocModal(null)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const savePermit = async (data) => {
    try {
      let fileData = null
      let fileName = null
      if (data.file?.[0]) {
        fileData = await fileToDataUrl(data.file[0])
        fileName = data.file[0].name
      }
      await renewWorkPermit(id, {
        permitNo: data.permitNo,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        fileName,
        fileData,
      })
      toast.success('New permit activated — previous archived')
      setPermitModal(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const generateLetter = async (data) => {
    try {
      await createAndGenerateLetter({ employeeId: id, ...data })
      const ctx = await getLetterContext(id)
      downloadSalaryLetterPdf(ctx, data)
      toast.success('Letter generated & downloaded')
      setLetterModal(false)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const verifyUrl = `${verificationBaseUrl()}/verify/${emp.verifyToken}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link to="/hr/employees" className="rounded-xl p-2 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={emp.photo} alt="" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white shadow" />
          <div>
            <h1 className="text-xl font-semibold">{emp.name}</h1>
            <p className="text-sm capitalize text-slate-500">
              {emp.role} · {emp.branch?.name} · {emp.empNo}
            </p>
          </div>
          <StatusBadge status={emp.status} />
        </div>
        {isHr && (
          <Button variant="secondary" onClick={() => setLetterModal(true)}>
            Generate salary letter
          </Button>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
              tab === t ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Personal' && (
        <Card title="Personal details">
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={personalForm.handleSubmit(savePersonal)}>
            <Field label="First name">
              <Input {...personalForm.register('firstName')} disabled={!isHr} />
            </Field>
            <Field label="Last name">
              <Input {...personalForm.register('lastName')} disabled={!isHr} />
            </Field>
            <Field label="Email">
              <Input {...personalForm.register('email')} disabled={!isHr} />
            </Field>
            <Field label="Phone">
              <Input {...personalForm.register('phone')} disabled={!isHr} />
            </Field>
            <Field label="Role">
              <Select {...personalForm.register('role')} disabled={!isHr}>
                {['manager', 'chef', 'cashier', 'waiter', 'delivery', 'inventory'].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Branch">
              <Select {...personalForm.register('branchId')} disabled={!isHr}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nationality">
              <Input {...personalForm.register('nationality')} disabled={!isHr} />
            </Field>
            <Field label="Join date">
              <Input type="date" {...personalForm.register('joinDate')} disabled={!isHr} />
            </Field>
            <Field label="Bank">
              <Input {...personalForm.register('bankName')} disabled={!isHr} />
            </Field>
            <Field label="IBAN">
              <Input {...personalForm.register('bankIban')} disabled={!isHr} />
            </Field>
            <Field label="Status">
              <Select {...personalForm.register('status')} disabled={!isHr}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </Select>
            </Field>
            {isHr && (
              <div className="sm:col-span-2">
                <Button type="submit" loading={personalForm.formState.isSubmitting}>
                  Save changes
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      {tab === 'Documents' && (
        <Card
          title="Documents"
          action={
            isHr && (
              <Button
                size="sm"
                onClick={() => {
                  setDocModal({ type: 'visa' })
                  docForm.reset({ type: 'visa' })
                }}
              >
                Upload / Replace
              </Button>
            )
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Number</th>
                  <th className="pb-2">Issue</th>
                  <th className="pb-2">Expiry</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((d) => {
                  const st = expiryStatus(d.expiryDate)
                  return (
                    <tr key={d.id}>
                      <td className="py-2.5 capitalize">{d.type.replace('_', ' ')}</td>
                      <td>{d.number}</td>
                      <td>{fmtDate(d.issueDate)}</td>
                      <td>{fmtDate(d.expiryDate)}</td>
                      <td>
                        <ExpiryBadge level={st.level} label={st.label} />
                      </td>
                      <td className="space-x-2 text-right">
                        {(d.fileData || d.fileName) && (
                          <button
                            type="button"
                            className="text-xs font-medium text-brand-600"
                            onClick={() => setPreview(d)}
                          >
                            Preview
                          </button>
                        )}
                        {isHr && (
                          <button
                            type="button"
                            className="text-xs font-medium text-slate-600"
                            onClick={() => {
                              setDocModal(d)
                              docForm.reset(d)
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'Work Permits' && (
        <Card
          title="Work permit history"
          action={
            isHr && (
              <Button size="sm" onClick={() => setPermitModal(true)}>
                Renew / Add new
              </Button>
            )
          }
        >
          <ol className="relative space-y-4 border-l border-slate-200 pl-6">
            {permits.map((p) => (
              <li key={p.id} className="relative">
                <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="font-medium">{p.permitNo}</p>
                    <p className="text-xs text-slate-500">
                      {fmtDate(p.issueDate)} → {fmtDate(p.expiryDate)}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {tab === 'Attendance' && (
        <Card title="Recent attendance">
          {attendance.length === 0 ? (
            <EmptyState title="No punches yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">In</th>
                    <th className="pb-2">Out</th>
                    <th className="pb-2">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.slice(0, 20).map((a) => (
                    <tr key={a.id}>
                      <td className="py-2">{fmtDate(a.date)}</td>
                      <td>{fmtTime(a.punches.find((p) => p.type === 'in')?.at)}</td>
                      <td>{fmtTime([...a.punches].reverse().find((p) => p.type === 'out')?.at)}</td>
                      <td className="space-x-1">
                        {a.late && <StatusBadge status="Late" />}
                        {a.earlyOut && <StatusBadge status="Early-out" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'Leave' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ['Annual', balance?.annual],
              ['Medical', balance?.medical],
              ['Emergency', balance?.emergency],
              ['Used annual', balance?.usedAnnual],
            ].map(([label, val]) => (
              <Card key={label}>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-2xl font-semibold">{val ?? '—'}</p>
              </Card>
            ))}
          </div>
          <Card title="Leave history">
            <ul className="space-y-2">
              {leaves.map((l) => (
                <li key={l.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="font-medium">{l.leaveType?.name}</p>
                    <p className="text-xs text-slate-500">
                      {fmtDate(l.startDate)} – {fmtDate(l.endDate)} · {l.days}d
                    </p>
                  </div>
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'Payroll' && (
        <div className="space-y-4">
          <Card title="Salary structure">
            <form className="grid gap-3 sm:grid-cols-3" onSubmit={salaryForm.handleSubmit(saveSalary)}>
              <Field label="Basic (AED)">
                <Input type="number" {...salaryForm.register('basic')} disabled={!isHr} />
              </Field>
              <Field label="Housing">
                <Input type="number" {...salaryForm.register('housing')} disabled={!isHr} />
              </Field>
              <Field label="Transport">
                <Input type="number" {...salaryForm.register('transport')} disabled={!isHr} />
              </Field>
              <Field label="Other allowance">
                <Input type="number" {...salaryForm.register('other')} disabled={!isHr} />
              </Field>
              <Field label="Loan deduction">
                <Input type="number" {...salaryForm.register('loan')} disabled={!isHr} />
              </Field>
              <Field label="Other deduction">
                <Input type="number" {...salaryForm.register('otherDed')} disabled={!isHr} />
              </Field>
              {isHr && (
                <div className="sm:col-span-3">
                  <Button type="submit">Save structure</Button>
                </div>
              )}
            </form>
            {salary && (
              <p className="mt-3 text-sm text-slate-500">
                Net estimate:{' '}
                <span className="font-semibold text-slate-800">
                  {aed(
                    salary.basic +
                      (salary.allowances?.housing || 0) +
                      (salary.allowances?.transport || 0) +
                      (salary.allowances?.other || 0) -
                      (salary.deductions?.loan || 0) -
                      (salary.deductions?.other || 0)
                  )}
                </span>
              </p>
            )}
          </Card>
          <Card title="Payslips">
            <ul className="space-y-2">
              {payslips.map((p) => (
                <li key={p.month} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                  <span>
                    {p.month} · {aed(p.net)}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      const slip = await getPayslip(id, p.month)
                      downloadPayslipPdf(slip)
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'Card' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div
            id="emp-card-print"
            className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 p-1 shadow-lg"
          >
            <div className="rounded-xl bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Gulf Taste</p>
                  <p className="text-[10px] text-slate-400">Employee Identity Card</p>
                </div>
                <StatusBadge status={emp.status === 'active' ? 'Active' : 'Inactive'} />
              </div>
              <div className="flex gap-4">
                <img src={emp.photo} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div className="flex-1 space-y-1 text-sm">
                  <p className="text-lg font-semibold">{emp.name}</p>
                  <p className="capitalize text-slate-600">{emp.role}</p>
                  <p className="text-xs text-slate-500">{emp.empNo}</p>
                  <p className="text-xs text-slate-500">{emp.branch?.name}</p>
                  <p className="text-xs text-slate-400">Expires {fmtDate(emp.cardExpiry)}</p>
                </div>
                <QRCodeSVG value={verifyUrl} size={72} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => downloadEmployeeCardPdf(emp, emp.branch)}
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <p className="text-xs text-slate-500">QR opens public verification at /verify/:token</p>
          </div>
        </div>
      )}

      <Modal
        open={!!docModal}
        onClose={() => setDocModal(null)}
        title="Document"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDocModal(null)}>
              Cancel
            </Button>
            <Button onClick={docForm.handleSubmit(saveDoc)}>Save</Button>
          </div>
        }
      >
        <form className="grid gap-3">
          <Field label="Type">
            <Select {...docForm.register('type')}>
              {['passport', 'visa', 'insurance', 'emirates_id', 'work_permit'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Number">
            <Input {...docForm.register('number', { required: true })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Issue date">
              <Input type="date" {...docForm.register('issueDate')} />
            </Field>
            <Field label="Expiry date">
              <Input type="date" {...docForm.register('expiryDate')} />
            </Field>
          </div>
          <Field label="File (image or PDF)">
            <Input type="file" accept="image/*,application/pdf" {...docForm.register('file')} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={permitModal}
        onClose={() => setPermitModal(false)}
        title="Renew / Add work permit"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPermitModal(false)}>
              Cancel
            </Button>
            <Button onClick={permitForm.handleSubmit(savePermit)}>Submit</Button>
          </div>
        }
      >
        <p className="mb-3 text-sm text-slate-500">
          Submitting archives the current Active permit and makes this one Active. History is kept.
        </p>
        <form className="grid gap-3">
          <Field label="Permit number">
            <Input {...permitForm.register('permitNo', { required: true })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Issue">
              <Input type="date" {...permitForm.register('issueDate', { required: true })} />
            </Field>
            <Field label="Expiry">
              <Input type="date" {...permitForm.register('expiryDate', { required: true })} />
            </Field>
          </div>
          <Field label="Attachment">
            <Input type="file" {...permitForm.register('file')} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={letterModal}
        onClose={() => setLetterModal(false)}
        title="Generate salary transfer letter"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setLetterModal(false)}>
              Cancel
            </Button>
            <Button onClick={letterForm.handleSubmit(generateLetter)}>Generate PDF</Button>
          </div>
        }
      >
        <form className="grid gap-3">
          <Field label="Addressed to">
            <Input {...letterForm.register('addressedTo', { required: true })} />
          </Field>
          <Field label="Purpose">
            <Textarea {...letterForm.register('purpose', { required: true })} />
          </Field>
        </form>
      </Modal>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Document preview" wide>
        {preview?.fileData ? (
          preview.fileMime?.startsWith('image/') ? (
            <img src={preview.fileData} alt="" className="max-h-[70vh] w-full object-contain" />
          ) : (
            <iframe src={preview.fileData} title="doc" className="h-[70vh] w-full rounded-lg" />
          )
        ) : (
          <p className="text-sm text-slate-500">
            Seeded demo file placeholder: <strong>{preview?.fileName}</strong>. Upload a real file to preview.
          </p>
        )}
      </Modal>
    </div>
  )
}
