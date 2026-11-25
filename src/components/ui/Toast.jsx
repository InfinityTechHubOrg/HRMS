import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { removeToast } from '../../store/slices/toastSlice'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const tones = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-brand-200 bg-brand-50 text-brand-900',
}

function ToastItem({ item }) {
  const dispatch = useDispatch()
  const Icon = icons[item.type] || Info
  useEffect(() => {
    const t = setTimeout(() => dispatch(removeToast(item.id)), 4000)
    return () => clearTimeout(t)
  }, [dispatch, item.id])

  return (
    <div className={`flex w-80 items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${tones[item.type] || tones.info}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 text-sm font-medium">{item.message}</p>
      <button type="button" onClick={() => dispatch(removeToast(item.id))} className="opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function ToastViewport() {
  const items = useSelector((s) => s.toast.items)
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <ToastItem item={item} />
        </div>
      ))}
    </div>
  )
}
