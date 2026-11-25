import { createSlice } from '@reduxjs/toolkit'

/** Bumped whenever localStorage demo data changes so live boards re-fetch */
const dataSlice = createSlice({
  name: 'data',
  initialState: { revision: 0 },
  reducers: {
    bumpRevision(state) {
      state.revision += 1
    },
  },
})

export const { bumpRevision } = dataSlice.actions
export default dataSlice.reducer
