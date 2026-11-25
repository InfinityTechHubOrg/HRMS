import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import HrLayout from './components/layout/HrLayout'
import EmployeeLayout from './components/layout/EmployeeLayout'
import HrDashboard from './pages/hr/Dashboard'
import Employees from './pages/hr/Employees'
import EmployeeProfile from './pages/hr/EmployeeProfile'
import Attendance from './pages/hr/Attendance'
import Leaves from './pages/hr/Leaves'
import ExpiringDocuments from './pages/hr/ExpiringDocuments'
import Payroll from './pages/hr/Payroll'
import PayrollMonth from './pages/hr/PayrollMonth'
import Letters from './pages/hr/Letters'
import EmployeeHome from './pages/employee/Home'
import EmployeePunches from './pages/employee/Punches'
import EmployeeLeave from './pages/employee/Leave'
import EmployeeDocuments from './pages/employee/Documents'
import EmployeeCard from './pages/employee/Card'
import EmployeePayslips from './pages/employee/Payslips'
import EmployeeLetters from './pages/employee/Letters'
import Verify from './pages/public/Verify'
import { getDb } from './services/storage'

function RoleHome() {
  const role = useSelector((s) => s.session.role)
  if (role === 'employee') return <Navigate to="/employee/home" replace />
  return <Navigate to="/hr/dashboard" replace />
}

function Bootstrap() {
  useEffect(() => {
    getDb() // ensure seed exists
  }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <Bootstrap />
      <Routes>
        <Route path="/" element={<RoleHome />} />
        <Route path="/verify/:token" element={<Verify />} />

        <Route element={<HrLayout />}>
          <Route path="/hr/dashboard" element={<HrDashboard />} />
          <Route path="/hr/employees" element={<Employees />} />
          <Route path="/hr/employees/:id" element={<EmployeeProfile />} />
          <Route path="/hr/attendance" element={<Attendance />} />
          <Route path="/hr/leaves" element={<Leaves />} />
          <Route path="/hr/documents/expiring" element={<ExpiringDocuments />} />
          <Route path="/hr/payroll" element={<Payroll />} />
          <Route path="/hr/payroll/:month" element={<PayrollMonth />} />
          <Route path="/hr/letters" element={<Letters />} />
        </Route>

        <Route element={<EmployeeLayout />}>
          <Route path="/employee/home" element={<EmployeeHome />} />
          <Route path="/employee/punches" element={<EmployeePunches />} />
          <Route path="/employee/leave" element={<EmployeeLeave />} />
          <Route path="/employee/documents" element={<EmployeeDocuments />} />
          <Route path="/employee/card" element={<EmployeeCard />} />
          <Route path="/employee/payslips" element={<EmployeePayslips />} />
          <Route path="/employee/letters" element={<EmployeeLetters />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
