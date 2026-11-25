import { NavLink, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  FileWarning,
  Wallet,
  Mail,
  Building2,
} from 'lucide-react'
import RoleSwitcher from './RoleSwitcher'
import SettingsMenu from './SettingsMenu'
import ToastViewport from '../ui/Toast'
import { env } from '../../config/env'

const nav = [
  { to: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/hr/employees', label: 'Employees', icon: Users },
  { to: '/hr/attendance', label: 'Attendance', icon: Clock },
  { to: '/hr/leaves', label: 'Leaves', icon: CalendarDays },
  { to: '/hr/documents/expiring', label: 'Expiring Docs', icon: FileWarning },
  { to: '/hr/payroll', label: 'Payroll', icon: Wallet },
  { to: '/hr/letters', label: 'Letters', icon: Mail },
]

export default function HrLayout() {
  const role = useSelector((s) => s.session.role)
  const title = role === 'manager' ? 'Branch Manager' : 'HR Admin'

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
            C
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{env.appName}</p>
            <p className="text-[11px] text-slate-500">HRMS</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            UAE · AED
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
            <p className="text-sm font-semibold text-slate-800 lg:hidden">{env.appName}</p>
          </div>
          <div className="flex items-center gap-2">
            <RoleSwitcher />
            <SettingsMenu />
          </div>
        </header>

        {/* Mobile nav */}
        <div className="no-print flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 lg:hidden">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <ToastViewport />
    </div>
  )
}
