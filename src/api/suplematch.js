const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function postRecommendation(payload) {
  return request('/api/v1/recommend', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function postFeedback(payload) {
  return request('/api/v1/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail ?? 'Error al conectar con SupleMatch')
  }

  return data
}
