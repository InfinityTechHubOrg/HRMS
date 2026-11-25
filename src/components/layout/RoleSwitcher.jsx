import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setRole, setBranchId, setEmployeeId } from '../../store/slices/sessionSlice'
import { getBranches } from '../../services/company'
import { listEmployees } from '../../services/employees'
import { Select } from '../ui/Input'

export default function RoleSwitcher() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const session = useSelector((s) => s.session)
  const [branches, setBranches] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    getBranches().then(setBranches)
    listEmployees({ status: 'active' }).then((emps) => {
      setEmployees(emps)
      if (!session.employeeId && emps.length) {
        dispatch(setEmployeeId(emps[0].id))
      }
    })
  }, []) // eslint-disable-line

  const onRole = (role) => {
    dispatch(setRole(role))
    if (role === 'hr') navigate('/hr/dashboard')
    else if (role === 'manager') navigate('/hr/dashboard')
    else navigate('/employee/home')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={session.role}
        onChange={(e) => onRole(e.target.value)}
        className="!w-auto min-w-[140px] !py-1.5 text-xs font-medium"
      >
        <option value="hr">HR Admin</option>
        <option value="manager">Branch Manager</option>
        <option value="employee">Employee</option>
      </Select>

      {session.role === 'manager' && (
        <Select
          value={session.branchId || ''}
          onChange={(e) => dispatch(setBranchId(e.target.value))}
          className="!w-auto min-w-[150px] !py-1.5 text-xs"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      )}

      {session.role === 'employee' && (
        <Select
          value={session.employeeId || ''}
          onChange={(e) => dispatch(setEmployeeId(e.target.value))}
          className="!w-auto min-w-[160px] !py-1.5 text-xs"
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} · {e.role}
            </option>
          ))}
        </Select>
      )}
    </div>
  )
}
