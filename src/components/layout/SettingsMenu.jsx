import { useState } from 'react'
import { Settings, RotateCcw } from 'lucide-react'
import { resetDemoData } from '../../services/company'
import { useToast } from '../../hooks/useToast'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

export default function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const reset = async () => {
    setLoading(true)
    try {
      await resetDemoData()
      toast.success('Demo data reset to seed')
      setConfirm(false)
      setOpen(false)
      setTimeout(() => window.location.reload(), 400)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        title="Settings"
      >
        <Settings className="h-4.5 w-4.5 h-5 w-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-4 top-14 z-50 w-64 rounded-xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setOpen(false)
                setConfirm(true)
              }}
            >
              <RotateCcw className="h-4 w-4 text-brand-600" />
              Reset demo data
            </button>
          </div>
        </>
      )}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset demo data?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={loading} onClick={reset}>
              Reset
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          This clears localStorage and restores the original seeded restaurant group data. Any demo actions you made
          will be lost.
        </p>
      </Modal>
    </>
  )
}
