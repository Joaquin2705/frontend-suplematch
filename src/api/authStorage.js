const KEYS = {
  token:   'suplematch_token',
  refresh: 'suplematch_refresh_token',
  user:    'suplematch_user',
}

export function getToken()        { return localStorage.getItem(KEYS.token) }
export function getRefreshToken() { return localStorage.getItem(KEYS.refresh) }

export function getUser() {
  const raw = localStorage.getItem(KEYS.user)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function saveSession({ access_token, refresh_token, user }) {
  localStorage.setItem(KEYS.token,   access_token)
  localStorage.setItem(KEYS.refresh, refresh_token)
  localStorage.setItem(KEYS.user,    JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(KEYS.token)
  localStorage.removeItem(KEYS.refresh)
  localStorage.removeItem(KEYS.user)
}
