import { createContext, useContext, useEffect, useState } from 'react'
import { getToken, getUser } from '../api/authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authToken, setAuthToken] = useState(getToken)
  const [authUser,  setAuthUser]  = useState(getUser)

  useEffect(() => {
    function onRefreshed(e) {
      setAuthToken(e.detail.access_token)
      setAuthUser(e.detail.user)
    }
    function onExpired() {
      setAuthToken(null)
      setAuthUser(null)
    }
    window.addEventListener('suplematch-auth-refreshed', onRefreshed)
    window.addEventListener('suplematch-auth-expired',   onExpired)
    return () => {
      window.removeEventListener('suplematch-auth-refreshed', onRefreshed)
      window.removeEventListener('suplematch-auth-expired',   onExpired)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ authToken, setAuthToken, authUser, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
