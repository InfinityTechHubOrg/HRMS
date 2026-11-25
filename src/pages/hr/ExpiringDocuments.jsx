import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { listDocuments } from '../../services/documents'
import { getBranches } from '../../services/company'
import Card from '../../components/ui/Card'
import { Select } from '../../components/ui/Input'
import { ExpiryBadge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { useDataRevision } from '../../hooks/useDataRevision'
import { expiryStatus, fmtDate } from '../../utils/dates'
import { FileWarning } from 'lucide-react'

export default function ExpiringDocuments() {
  const session = useSelector((s) => s.session)
  const branchId = session.role === 'manager' ? session.branchId : undefined
  const revision = useDataRevision()
  const [docs, setDocs] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [branch, setBranch] = useState(branchId || '')
  const [windowDays, setWindowDays] = useState(90)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      listDocuments({
        type: type || undefined,
        branchId: branchId || branch || undefined,
        windowDays: Number(windowDays),
      }),
      getBranches(),
    ]).then(([d, br]) => {
      setDocs(d)
      setBranches(br)
      setLoading(false)
    })
  }, [type, branch, windowDays, branchId, revision])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Expiring documents</h1>
        <p className="text-sm text-slate-500">Visa, passport, insurance, Emirates ID within selected window</p>
      </div>

      <Card padded={false}>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <Select value={type} onChange={(e) => setType(e.target.value)} className="!w-auto">
            <option value="">All types</option>
            {['passport', 'visa', 'insurance', 'emirates_id'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          {!branchId && (
            <Select value={branch} onChange={(e) => setBranch(e.target.value)} className="!w-auto">
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          <Select value={windowDays} onChange={(e) => setWindowDays(e.target.value)} className="!w-auto">
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </Select>
        </div>

        {loading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : docs.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={FileWarning} title="Nothing expiring" description="No documents in this window." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((d) => {
                  const st = expiryStatus(d.expiryDate)
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <Link to={`/hr/employees/${d.employeeId}`} className="font-medium text-brand-700 hover:underline">
                          {d.employee?.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        {branches.find((b) => b.id === d.employee?.branchId)?.name}
                      </td>
                      <td className="px-4 py-2.5 capitalize">{d.type.replace('_', ' ')}</td>
                      <td className="px-4 py-2.5">{d.number}</td>
                      <td className="px-4 py-2.5">{fmtDate(d.expiryDate)}</td>
                      <td className="px-4 py-2.5">
                        <ExpiryBadge level={st.level} label={st.label} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
