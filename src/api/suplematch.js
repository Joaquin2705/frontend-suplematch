import { getRefreshToken, saveSession, clearSession } from './authStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function login(payload) {
  return request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    allowRefresh: false,
  })
}

export async function register(payload) {
  return request('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    allowRefresh: false,
  })
}

export async function getMe(token) {
  return request('/api/v1/auth/me', {
    headers: authHeaders(token),
  })
}

export async function refreshSession(refreshToken = getRefreshToken()) {
  if (!refreshToken) throw new Error('Refresh token no disponible')
  return request('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
    allowRefresh: false,
  })
}

export async function logout(refreshToken = getRefreshToken()) {
  if (!refreshToken) return { message: 'Sesión cerrada.' }
  return request('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
    allowRefresh: false,
  })
}

export async function logoutAll(token) {
  return request('/api/v1/auth/logout-all', {
    method: 'POST',
    headers: authHeaders(token),
    allowRefresh: false,
  })
}

export async function getUserPersonal(token) {
  return request('/api/v1/users/me/personal', {
    headers: authHeaders(token),
  })
}

export async function updateUserPersonal(payload, token) {
  return request('/api/v1/users/me/personal', {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function deleteUserPersonal(token) {
  return request('/api/v1/users/me/personal', {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export async function changePassword(payload, token) {
  return request('/api/v1/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function postRecommendation(payload, token = null) {
  return request('/api/v1/recommend', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
    timeoutMs: false, // Loading.jsx handles timeout via Promise.race
  })
}

export async function postFeedback(payload, token = null) {
  return request('/api/v1/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function getHistory(token) {
  return request('/api/v1/history/me', {
    headers: authHeaders(token),
  })
}

export async function getPendingReviews(token) {
  return request('/api/v1/admin/reviews/products?review_status=pending', {
    headers: authHeaders(token),
  })
}

export async function moderateReview(reviewId, status, token) {
  return request(`/api/v1/admin/reviews/products/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    headers: authHeaders(token),
  })
}

export async function getAdminProducts(token, status = '') {
  const query = status ? `?status_filter=${encodeURIComponent(status)}` : ''
  return request(`/api/v1/admin/products${query}`, {
    headers: authHeaders(token),
  })
}

export async function getCatalogQuality(token) {
  return request('/api/v1/admin/catalog/quality', {
    headers: authHeaders(token),
  })
}

export async function getCatalogCandidates(token, status = '') {
  const query = status ? `?status_filter=${encodeURIComponent(status)}` : ''
  return request(`/api/v1/admin/catalog/candidates${query}`, {
    headers: authHeaders(token),
  })
}

export async function updateCatalogCandidate(candidateId, payload, token) {
  return request(`/api/v1/admin/catalog/candidates/${candidateId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function promoteCatalogCandidate(candidateId, payload, token) {
  return request(`/api/v1/admin/catalog/candidates/${candidateId}/promote`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function getCatalogJobStatus(token) {
  return request('/api/v1/admin/catalog/jobs/status', {
    headers: authHeaders(token),
  })
}

export async function runCatalogJob(payload, token) {
  return request('/api/v1/admin/catalog/jobs/run', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function cancelCatalogJob(token, jobId = null) {
  const path = jobId ? `/api/v1/admin/catalog/jobs/${jobId}/cancel` : '/api/v1/admin/catalog/jobs/cancel'
  return request(path, {
    method: 'POST',
    headers: authHeaders(token),
  })
}

export async function approveCatalogImport(jobId, token) {
  return request(`/api/v1/admin/catalog/jobs/${jobId}/approve-import`, {
    method: 'POST',
    headers: authHeaders(token),
  })
}

export async function getSafetyRules(token) {
  return request('/api/v1/admin/safety-rules', {
    headers: authHeaders(token),
  })
}

export async function createSafetyRule(payload, token) {
  return request('/api/v1/admin/safety-rules', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function updateSafetyRule(ruleId, payload, token) {
  return request(`/api/v1/admin/safety-rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function getOpsHealth(token) {
  return request('/api/v1/health/ops', {
    headers: authHeaders(token),
  })
}

export async function getPrometheusMetrics(token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/metrics`, {
    headers: authHeaders(token),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(text || 'Error al leer métricas')
  return text
}

export async function updateAdminProduct(productId, payload, token) {
  return request(`/api/v1/admin/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function postProductReview(payload, token) {
  return request('/api/v1/reviews/products', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export const postSupplementReview = postProductReview

export async function analyzeLabText(payload, token = null) {
  return request('/api/v1/labs/text', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function analyzeManualLabs(payload, token = null) {
  return request('/api/v1/labs/manual', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function uploadLabReport(file, { consentHealthData, persist = true }, token = null) {
  const formData = new FormData()
  formData.append('consent_health_data', String(Boolean(consentHealthData)))
  formData.append('persist', String(Boolean(persist)))
  formData.append('file', file)
  return request('/api/v1/labs/upload', {
    method: 'POST',
    body: formData,
    headers: authHeaders(token),
    timeoutMs: 60_000,
  })
}

export async function getLabReports(token) {
  return request('/api/v1/labs/me', {
    headers: authHeaders(token),
  })
}

export async function exportLabReports(token) {
  return request('/api/v1/labs/me/export', {
    headers: authHeaders(token),
  })
}

export async function deleteLabReport(reportId, token) {
  return request(`/api/v1/labs/me/${reportId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export async function deleteAllLabReports(token) {
  return request('/api/v1/labs/me', {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export async function exportHealthData(token) {
  return request('/api/v1/users/me/health-data/export', {
    headers: authHeaders(token),
  })
}

export async function deleteHealthData(token) {
  return request('/api/v1/users/me/health-data', {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, { timeoutMs = 20_000, allowRefresh, ...options } = {}) {
  const isFormData = options.body instanceof FormData

  let signal
  if (timeoutMs) {
    try { signal = AbortSignal.timeout(timeoutMs) } catch { /* Safari < 16.4 */ }
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    })
  } catch (error) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.')
    }
    throw error
  }

  if (response.status === 401 && allowRefresh !== false) {
    const refreshed = await tryRefreshSession()
    if (refreshed) {
      return request(path, {
        ...options,
        timeoutMs,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${refreshed.access_token}`,
        },
        allowRefresh: false,
      })
    }
  }

  let data = {}
  const text = await response.text().catch(() => '')
  try { data = JSON.parse(text) } catch {
    if (!response.ok) throw new Error(text.slice(0, 200) || 'Error al conectar con SupleMatch')
  }

  if (!response.ok) {
    throw new Error(data.detail ?? 'Error al conectar con SupleMatch')
  }

  return data
}

async function tryRefreshSession() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  try {
    const data = await refreshSession(refreshToken)
    saveSession(data)
    window.dispatchEvent(new CustomEvent('suplematch-auth-refreshed', { detail: data }))
    return data
  } catch {
    clearSession()
    window.dispatchEvent(new CustomEvent('suplematch-auth-expired'))
    return null
  }
}
