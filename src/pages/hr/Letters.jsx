import { useEffect, useState } from 'react'
import { listLetterRequests, markLetterGenerated, getLetterContext } from '../../services/letters'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../hooks/useToast'
import { useDataRevision } from '../../hooks/useDataRevision'
import { fmtDateTime } from '../../utils/dates'
import { downloadSalaryLetterPdf } from '../../utils/pdf'
import { useSelector } from 'react-redux'

export default function Letters() {
  const isHr = useSelector((s) => s.session.role === 'hr')
  const toast = useToast()
  const revision = useDataRevision()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    listLetterRequests().then((list) => {
      setItems(list)
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
  }, [revision])

  const generate = async (req) => {
    try {
      const ctx = await getLetterContext(req.employeeId)
      downloadSalaryLetterPdf(ctx, { purpose: req.purpose, addressedTo: req.addressedTo })
      if (req.status !== 'Generated') await markLetterGenerated(req.id)
      toast.success('PDF generated')
      load()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Salary transfer letters</h1>
        <p className="text-sm text-slate-500">Generate letterhead PDFs from employee requests</p>
      </div>

      <Card>
        {loading ? (
          <TableSkeleton />
        ) : (
          <ul className="space-y-3">
            {items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <div className="text-sm">
                  <p className="font-medium">{r.employee?.name}</p>
                  <p className="text-xs text-slate-500">
                    To: {r.addressedTo} · {fmtDateTime(r.createdAt)}
                  </p>
                  <p className="mt-1 text-slate-600">{r.purpose}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {isHr && (
                    <Button size="sm" onClick={() => generate(r)}>
                      {r.status === 'Generated' ? 'Download PDF' : 'Generate'}
                    </Button>
                  )}
                </div>
              </li>
            ))}
            {items.length === 0 && <p className="text-sm text-slate-400">No letter requests</p>}
          </ul>
        )}
      </Card>
    </div>
  )
}
