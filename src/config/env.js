/** Typed access to Vite env. Safe defaults for the local demo. */
export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'Crewly',
  currency: import.meta.env.VITE_APP_CURRENCY || 'AED',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  publicUrl: import.meta.env.VITE_PUBLIC_URL || '',
}

export function verificationBaseUrl() {
  if (env.publicUrl) return env.publicUrl.replace(/\/$/, '')
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return `${origin}${base}`
}
