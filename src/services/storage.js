import { createSeedData } from '../mock/seed'

const STORAGE_KEY = 'uae_hrms_demo_v1'
const EVENT = 'hrms-data-changed'

export function delay(ms = 300 + Math.floor(Math.random() * 300)) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getDb() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = createSeedData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
  try {
    return JSON.parse(raw)
  } catch {
    const seed = createSeedData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

export function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { at: Date.now() } }))
}

export function resetDb() {
  const seed = createSeedData()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { at: Date.now(), reset: true } }))
  return seed
}

export function onDataChange(handler) {
  const fn = () => handler()
  window.addEventListener(EVENT, fn)
  window.addEventListener('storage', fn)
  return () => {
    window.removeEventListener(EVENT, fn)
    window.removeEventListener('storage', fn)
  }
}

export function nextId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
