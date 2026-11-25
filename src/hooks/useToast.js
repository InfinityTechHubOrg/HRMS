import { useDispatch } from 'react-redux'
import { pushToast } from '../store/slices/toastSlice'

export function useToast() {
  const dispatch = useDispatch()
  return {
    success: (message) => dispatch(pushToast({ type: 'success', message })),
    error: (message) => dispatch(pushToast({ type: 'error', message })),
    info: (message) => dispatch(pushToast({ type: 'info', message })),
  }
}
