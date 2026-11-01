import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('threadco_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''

    if (
      error.response?.status === 401 &&
      !url.includes('/login') &&
      !url.includes('/register')
    ) {
      localStorage.removeItem('threadco_token')
      localStorage.removeItem('threadco_user')
      window.dispatchEvent(new Event('auth:logout'))
    }

    return Promise.reject(error)
  },
)

export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data

  if (data?.errors) {
    const firstError = Object.values(data.errors)[0]
    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0]
    }
  }

  return data?.message || fallback
}

export default api
