# Crewly — Frontend HRMS Demo

**Crewly** is a frontend-only HRMS demo for a UAE restaurant group (sample employer: Gulf Taste). No backend — all data flows through a mock **service layer** backed by `localStorage`.

**Stack:** React 18 · Vite · Redux Toolkit · React Router · Tailwind CSS v4 · react-hook-form · recharts · qrcode.react · jsPDF · date-fns  
**Currency:** AED

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Env vars (Vite `VITE_*`) live in `.env` — see `.env.example`. `.env` is gitignored; commit only `.env.example`.

## GitHub Pages

This repo deploys via **GitHub Actions** (`.github/workflows/deploy-pages.yml`) to  
`https://infinitytechhuborg.github.io/HRMS/`.

In **Settings → Pages**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).  
Pushing to `main` builds Vite with `base: /HRMS/` and publishes `dist`.

Use the **role switcher** in the top bar:

| Role | Layout | Scope |
|------|--------|--------|
| HR Admin | Sidebar dashboard | All branches |
| Branch Manager | Sidebar dashboard | Selected branch only |
| Employee | Phone-width app + bottom tabs | Selected employee |

**Reset demo data** is in the settings (gear) menu.

## Folder structure

```
src/
  mock/seed.js           # Seeded company, branches, ~25 employees, attendance, leaves, docs, payroll
  services/              # Async data access (300–600ms delay). ONLY place that touches storage/seed
    storage.js           # localStorage get/save/reset + change events
    company.js
    employees.js
    documents.js
    workPermits.js
    attendance.js
    leaves.js
    payroll.js
    letters.js
  store/                 # Redux: session (role), toast, data revision
  components/
    ui/                  # Button, Card, Modal, Badge, Skeleton, Toast, EmptyState, Input
    layout/              # HrLayout, EmployeeLayout, RoleSwitcher, SettingsMenu
  pages/
    hr/                  # Dashboard, Employees, Attendance, Leaves, Docs, Payroll, Letters
    employee/            # Mobile: Home (punch), Punches, Leave, Docs, Card, Payslips, Letters
    public/Verify.jsx    # /verify/:token public card check
  utils/                 # dates, geo, pdf, csv
  hooks/                 # useToast, useDataRevision
```

## Replacing services with a real API

Pages and components **must not** import `src/mock/*`. They only call `src/services/*.js`.

To go live:

1. Keep the same function names/signatures in each service file.
2. Replace `getDb()` / `saveDb()` bodies with `fetch` / axios calls to your API.
3. Remove simulated `delay()` when the network provides real latency.
4. Auth: replace the role switcher with real login; pass JWT/cookies from a thin API client.

Example shape:

```js
// src/services/employees.js — future
export async function listEmployees(params) {
  const res = await api.get('/employees', { params })
  return res.data
}
```

## Features covered

1. **Punch in/out** with geofence simulation, live board, attendance log + CSV, missed-punch corrections  
2. **Annual leave** apply / approve / reject (reason required) / balance / branch calendar  
3. **Medical leave** with certificate upload + viewer; HR configures which types need certificates  
4. **Employee card** + QR → `/verify/:token` + PDF/print  
5. **Documents** with expiry badges; expiring docs page + dashboard widget  
6. **Work permit** timeline; renew archives current, history kept  
7. **Payroll** structure, run/preview/approve/lock, payslip PDF  
8. **Salary transfer letter** request queue + letterhead PDF  
9. **Dashboards** for HR and Branch Manager  
10. **Employees** list / add / profile tabs  

## Demo quality

- Actions in one role are visible in others (localStorage + Redux revision / storage events).  
- Survives refresh; **Reset demo data** restores seed.  
- HR/Manager = web layout; Employee = `max-w-sm` mobile shell.
