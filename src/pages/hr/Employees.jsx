import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { Plus, Search } from 'lucide-react'
import { listEmployees, createEmployee } from '../../services/employees'
import { getBranches } from '../../services/company'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Field, Input, Select } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../hooks/useToast'
import { useDataRevision } from '../../hooks/useDataRevision'
import { todayISO } from '../../utils/dates'

const ROLES = ['manager', 'chef', 'cashier', 'waiter', 'delivery', 'inventory']

export default function Employees() {
  const session = useSelector((s) => s.session)
  const branchFilter = session.role === 'manager' ? session.branchId : undefined
  const revision = useDataRevision()
  const toast = useToast()
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('active')
  const [branchId, setBranchId] = useState(branchFilter || '')
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { role: 'waiter', status: 'active', joinDate: todayISO() },
  })

  const load = async () => {
    setLoading(true)
    const [emps, br] = await Promise.all([
      listEmployees({
        branchId: branchFilter || branchId || undefined,
        role: role || undefined,
        status: status || undefined,
        search: search || undefined,
      }),
      getBranches(),
    ])
    setEmployees(emps)
    setBranches(br)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [branchFilter, branchId, role, status, revision]) // eslint-disable-line

  const onSearch = (e) => {
    e.preventDefault()
    load()
  }

  const onCreate = async (data) => {
    try {
      const emp = await createEmployee({
        ...data,
        branchId: branchFilter || data.branchId,
      })
      toast.success(`${emp.name} added`)
      setOpen(false)
      reset()
      navigate(`/hr/employees/${emp.id}`)
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Employees</h1>
          <p className="text-sm text-slate-500">{employees.length} matching records</p>
        </div>
        {session.role === 'hr' && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add employee
          </Button>
        )}
      </div>

      <Card padded={false}>
        <form onSubmit={onSearch} className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="!pl-9"
              placeholder="Search name, emp no, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {!branchFilter && (
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="!w-auto">
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="!w-auto">
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-auto">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        {loading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : employees.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No employees found" description="Try adjusting filters or add a new employee." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3 font-medium">Join date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link to={`/hr/employees/${e.id}`} className="flex items-center gap-3">
                        <img src={e.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                        <div>
                          <p className="font-medium text-slate-900">{e.name}</p>
                          <p className="text-xs text-slate-400">{e.empNo}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize">{e.role}</td>
                    <td className="px-4 py-3">{e.branch?.name}</td>
                    <td className="px-4 py-3 text-slate-500">{e.joinDate}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add employee"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onCreate)}>
              Create
            </Button>
          </div>
        }
      >
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit(onCreate)}>
          <Field label="First name" error={errors.firstName?.message}>
            <Input {...register('firstName', { required: 'Required' })} />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <Input {...register('lastName', { required: 'Required' })} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email', { required: 'Required' })} />
          </Field>
          <Field label="Phone">
            <Input {...register('phone')} />
          </Field>
          <Field label="Role">
            <Select {...register('role')}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Branch" error={errors.branchId?.message}>
            <Select {...register('branchId', { required: !branchFilter && 'Required' })} disabled={!!branchFilter}>
              <option value="">Select…</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Join date">
            <Input type="date" {...register('joinDate')} />
          </Field>
          <Field label="Status">
            <Select {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </form>
      </Modal>
    </div>
  )
}
