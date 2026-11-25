import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { listDocuments } from '../../services/documents'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { ExpiryBadge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useDataRevision } from '../../hooks/useDataRevision'
import { expiryStatus, fmtDate } from '../../utils/dates'

export default function EmployeeDocuments() {
  const employeeId = useSelector((s) => s.session.employeeId)
  const revision = useDataRevision()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!employeeId) return
    setLoading(true)
    listDocuments({ employeeId }).then((d) => {
      setDocs(d)
      setLoading(false)
    })
  }, [employeeId, revision])

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">My documents</h1>
      <Card>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : (
          <ul className="space-y-3">
            {docs.map((d) => {
              const st = expiryStatus(d.expiryDate)
              return (
                <li key={d.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium capitalize">{d.type.replace('_', ' ')}</p>
                    <ExpiryBadge level={st.level} label={st.label} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {d.number} · Exp {fmtDate(d.expiryDate)}
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-medium text-brand-600"
                    onClick={() => setPreview(d)}
                  >
                    Preview
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Document" wide>
        {preview?.fileData ? (
          preview.fileMime?.startsWith('image/') ? (
            <img src={preview.fileData} alt="" className="max-h-[60vh] w-full object-contain" />
          ) : (
            <iframe src={preview.fileData} title="doc" className="h-[60vh] w-full" />
          )
        ) : (
          <p className="text-sm text-slate-500">Demo file: {preview?.fileName}</p>
        )}
      </Modal>
    </div>
  )
}
