import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Download } from 'lucide-react'
import { listPayslips, getPayslip } from '../../services/payroll'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { aed } from '../../utils/dates'
import { downloadPayslipPdf } from '../../utils/pdf'
import { useToast } from '../../hooks/useToast'

export default function EmployeePayslips() {
  const employeeId = useSelector((s) => s.session.employeeId)
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employeeId) return
    setLoading(true)
    listPayslips(employeeId).then((list) => {
      setItems(list)
      setLoading(false)
    })
  }, [employeeId])

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Payslips</h1>
      <Card>
        {loading ? (
          <TableSkeleton rows={3} />
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400">No payslips yet</p>
        ) : (
          <ul className="space-y-2">
            {items.map((p) => (
              <li key={p.month} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                <div>
                  <p className="font-medium">{p.month}</p>
                  <p className="text-xs text-slate-500">Net {aed(p.net)}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const slip = await getPayslip(employeeId, p.month)
                    downloadPayslipPdf(slip)
                    toast.success('PDF downloaded')
                  }}
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
