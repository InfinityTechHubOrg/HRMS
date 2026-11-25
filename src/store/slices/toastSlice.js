import { createSlice } from '@reduxjs/toolkit'

let seq = 1

const toastSlice = createSlice({
  name: 'toast',
  initialState: { items: [] },
  reducers: {
    pushToast(state, action) {
      state.items.push({
        id: seq++,
        type: action.payload.type || 'info',
        message: action.payload.message,
      })
    },
    removeToast(state, action) {
      state.items = state.items.filter((t) => t.id !== action.payload)
    },
  },
})

export const { pushToast, removeToast } = toastSlice.actions
export default toastSlice.reducer

export const toast = {
  success: (message) => pushToast({ type: 'success', message }),
  error: (message) => pushToast({ type: 'error', message }),
  info: (message) => pushToast({ type: 'info', message }),
}
