import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getEmployeeByToken } from '../../services/employees'
import { StatusBadge } from '../../components/ui/Badge'
import { PageSkeleton } from '../../components/ui/Skeleton'
import { ShieldCheck } from 'lucide-react'
import { env } from '../../config/env'

export default function Verify() {
  const { token } = useParams()
  const [emp, setEmp] = useState(undefined)

  useEffect(() => {
    getEmployeeByToken(token).then(setEmp)
  }, [token])

  if (emp === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6">
        <PageSkeleton />
      </div>
    )
  }

  if (!emp) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-6 text-center">
        <p className="text-lg font-semibold">Invalid card</p>
        <p className="mt-1 text-sm text-slate-500">This verification link is not recognized.</p>
        <Link to="/" className="mt-4 text-sm text-brand-600 hover:underline">
          Back to {env.appName}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-surface p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        <div className="mb-4 flex items-center gap-2 text-brand-700">
          <ShieldCheck className="h-5 w-5" />
          <p className="text-sm font-semibold">{env.appName} · Card verification</p>
        </div>
        <div className="flex gap-4">
          <img src={emp.photo} alt="" className="h-24 w-24 rounded-2xl object-cover ring-2 ring-slate-100" />
          <div className="space-y-1">
            <p className="text-xl font-semibold text-slate-900">{emp.name}</p>
            <p className="capitalize text-slate-600">{emp.role}</p>
            <p className="text-sm text-slate-500">{emp.branch?.name}</p>
            <div className="pt-1">
              <StatusBadge status={emp.status === 'active' ? 'Active' : 'Inactive'} />
            </div>
          </div>
        </div>
        <p className="mt-5 text-xs text-slate-400">Emp No. {emp.empNo} · Public verification page</p>
      </div>
    </div>
  )
}
