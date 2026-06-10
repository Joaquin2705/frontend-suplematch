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

export async function refreshSession(refreshToken = localStorage.getItem('suplematch_refresh_token')) {
  if (!refreshToken) throw new Error('Refresh token no disponible')
  return request('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
    allowRefresh: false,
  })
}

export async function logout(refreshToken = localStorage.getItem('suplematch_refresh_token')) {
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
  })
}

export async function forgotPassword(payload) {
  return request('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    allowRefresh: false,
  })
}

export async function resetPassword(payload) {
  return request('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    allowRefresh: false,
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
  return request('/api/v1/admin/reviews/supplements?review_status=pending', {
    headers: authHeaders(token),
  })
}

export async function moderateReview(reviewId, status, token) {
  return request(`/api/v1/admin/reviews/supplements/${reviewId}`, {
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

export async function postSupplementReview(payload, token) {
  return request('/api/v1/reviews/supplements', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  })
}

export async function analyzeLabText(payload, token = null) {
  return request('/api/v1/labs/text', {
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

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })

  if (response.status === 401 && options.allowRefresh !== false) {
    const refreshed = await tryRefreshSession()
    if (refreshed) {
      return request(path, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${refreshed.access_token}`,
        },
        allowRefresh: false,
      })
    }
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail ?? 'Error al conectar con SupleMatch')
  }

  return data
}

async function tryRefreshSession() {
  const refreshToken = localStorage.getItem('suplematch_refresh_token')
  if (!refreshToken) return null
  try {
    const data = await refreshSession(refreshToken)
    localStorage.setItem('suplematch_token', data.access_token)
    localStorage.setItem('suplematch_refresh_token', data.refresh_token)
    localStorage.setItem('suplematch_user', JSON.stringify(data.user))
    window.dispatchEvent(new CustomEvent('suplematch-auth-refreshed', { detail: data }))
    return data
  } catch {
    localStorage.removeItem('suplematch_token')
    localStorage.removeItem('suplematch_refresh_token')
    localStorage.removeItem('suplematch_user')
    window.dispatchEvent(new CustomEvent('suplematch-auth-expired'))
    return null
  }
}
