import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

const TOKEN_KEY = 'threadco_token'
const USER_KEY = 'threadco_user'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const persistAuth = useCallback((payload) => {
    localStorage.setItem(TOKEN_KEY, payload.token)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
    setToken(payload.token)
    setUser(payload.user)
  }, [])

  useEffect(() => {
    const handleLogout = () => clearAuth()

    window.addEventListener('auth:logout', handleLogout)

    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [clearAuth])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    let active = true

    api
      .get('/user')
      .then(({ data }) => {
        if (!active) return
        setUser(data.data)
        localStorage.setItem(USER_KEY, JSON.stringify(data.data))
      })
      .catch(() => {
        if (active) clearAuth()
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token, clearAuth])

  const login = useCallback(
    async (credentials) => {
      const { data } = await api.post('/login', credentials)
      persistAuth(data)
      return data.user
    },
    [persistAuth],
  )

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/register', payload)
      persistAuth(data)
      return data.user
    },
    [persistAuth],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      // The token may already be invalid; local cleanup still applies.
    } finally {
      clearAuth()
    }
  }, [clearAuth])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: Boolean(user?.is_admin),
      login,
      register,
      logout,
    }),
    [token, user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
