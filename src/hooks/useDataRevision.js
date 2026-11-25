import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { bumpRevision } from '../store/slices/dataSlice'
import { onDataChange } from '../services/storage'

export function useDataRevision() {
  const revision = useSelector((s) => s.data.revision)
  const dispatch = useDispatch()
  useEffect(() => onDataChange(() => dispatch(bumpRevision())), [dispatch])
  return revision
}
