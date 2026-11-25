import { createSlice } from '@reduxjs/toolkit'

const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem('hrms_session') || 'null')
  } catch {
    return null
  }
})()

const initialState = saved || {
  role: 'hr', // hr | manager | employee
  branchId: 'br-001',
  employeeId: null,
  simulateInside: true,
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setRole(state, action) {
      state.role = action.payload
      persist(state)
    },
    setBranchId(state, action) {
      state.branchId = action.payload
      persist(state)
    },
    setEmployeeId(state, action) {
      state.employeeId = action.payload
      persist(state)
    },
    setSimulateInside(state, action) {
      state.simulateInside = action.payload
      persist(state)
    },
    hydrateSession(state, action) {
      Object.assign(state, action.payload)
      persist(state)
    },
  },
})

function persist(state) {
  localStorage.setItem(
    'hrms_session',
    JSON.stringify({
      role: state.role,
      branchId: state.branchId,
      employeeId: state.employeeId,
      simulateInside: state.simulateInside,
    })
  )
}

export const { setRole, setBranchId, setEmployeeId, setSimulateInside, hydrateSession } = sessionSlice.actions
export default sessionSlice.reducer
