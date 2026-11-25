import { configureStore } from '@reduxjs/toolkit'
import sessionReducer from './slices/sessionSlice'
import toastReducer from './slices/toastSlice'
import dataReducer from './slices/dataSlice'

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    toast: toastReducer,
    data: dataReducer,
  },
})
