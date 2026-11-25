import { NavLink, Outlet } from 'react-router-dom'
import { Home, Clock, CalendarDays, FileText, CreditCard, Wallet, Mail } from 'lucide-react'
import RoleSwitcher from './RoleSwitcher'
import SettingsMenu from './SettingsMenu'
import ToastViewport from '../ui/Toast'

const tabs = [
  { to: '/employee/home', label: 'Home', icon: Home },
  { to: '/employee/punches', label: 'Punches', icon: Clock },
  { to: '/employee/leave', label: 'Leave', icon: CalendarDays },
  { to: '/employee/documents', label: 'Docs', icon: FileText },
  { to: '/employee/card', label: 'Card', icon: CreditCard },
  { to: '/employee/payslips', label: 'Pay', icon: Wallet },
  { to: '/employee/letters', label: 'Letters', icon: Mail },
]

export default function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto flex min-h-screen max-w-sm flex-col bg-surface shadow-2xl shadow-slate-300/50 ring-1 ring-slate-200">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                C
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Crewly</p>
                <p className="text-[10px] text-slate-400">Staff App</p>
              </div>
            </div>
            <SettingsMenu />
          </div>
          <RoleSwitcher />
        </header>

        <main className="flex-1 overflow-y-auto px-3 py-4 pb-24">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-sm -translate-x-1/2 justify-around border-t border-slate-200 bg-white/95 px-1 py-1.5 backdrop-blur">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[10px] font-medium ${
                  isActive ? 'text-brand-700' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <t.icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : ''}`} />
                  {t.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      <ToastViewport />
    </div>
  )
}
