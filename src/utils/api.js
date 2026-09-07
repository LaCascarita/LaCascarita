const API_URL = import.meta.env.VITE_API_URL || window.location.origin

let refreshPromise = null

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = fetch(`${API_URL}/api/refresh`, {
    method: 'POST',
    credentials: 'include'
  }).finally(() => {
    refreshPromise = null
  })

  const response = await refreshPromise
  return response.ok
}

export async function apiFetch(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`
  const fetchOptions = { ...options, credentials: 'include' }

  let response = await fetch(fullUrl, fetchOptions)

  if (response.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await fetch(fullUrl, fetchOptions)
    } else {
      window.location.href = '/login'
      throw new Error('Sesión expirada')
    }
  }

  return response
}
