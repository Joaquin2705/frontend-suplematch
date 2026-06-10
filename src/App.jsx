import { useState, useCallback, useEffect } from 'react'
import Acceso           from './screens/Acceso'
import AdminCatalog     from './screens/AdminCatalog'
import AdminOps         from './screens/AdminOps'
import AdminReviews     from './screens/AdminReviews'
import AdminSafetyRules from './screens/AdminSafetyRules'
import Landing          from './screens/Landing'
import Encuesta         from './screens/Encuesta'
import Loading          from './screens/Loading'
import Condiciones      from './screens/Condiciones'
import Recomendaciones  from './screens/Recomendaciones'
import Precios          from './screens/Precios'
import Feedback         from './screens/Feedback'
import Historial        from './screens/Historial'
import Legal            from './screens/Legal'
import Examenes         from './screens/Examenes'

const SCREENS = {
  acceso:          Acceso,
  adminCatalog:    AdminCatalog,
  adminOps:        AdminOps,
  adminReviews:    AdminReviews,
  adminSafetyRules: AdminSafetyRules,
  landing:         Landing,
  encuesta:        Encuesta,
  loading:         Loading,
  condiciones:     Condiciones,
  recomendaciones: Recomendaciones,
  precios:         Precios,
  feedback:        Feedback,
  historial:       Historial,
  examenes:        Examenes,
  privacidad:      (props) => <Legal {...props} type="privacy" />,
  terminos:        (props) => <Legal {...props} type="terms" />,
}

export default function App() {
  const [screen,      setScreen]      = useState(() => new URLSearchParams(window.location.search).get('reset_token') ? 'acceso' : 'landing')
  const [prevScreen,  setPrevScreen]  = useState(null)
  const [toast,       setToast]       = useState(null)
  const [userData,    setUserData]    = useState(null)
  const [apiResult,   setApiResult]   = useState(null)
  const [selectedRec, setSelectedRec] = useState(null)
  const [authToken,   setAuthToken]   = useState(() => localStorage.getItem('suplematch_token'))
  const [sessionExpired, setSessionExpired] = useState(false)
  const [authUser,    setAuthUser]    = useState(() => {
    const raw = localStorage.getItem('suplematch_user')
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })

  useEffect(() => {
    function handleAuthRefreshed(event) {
      setAuthToken(event.detail.access_token)
      setAuthUser(event.detail.user)
    }

    function handleAuthExpired() {
      setAuthToken(null)
      setAuthUser(null)
      setSessionExpired(true)
    }

    window.addEventListener('suplematch-auth-refreshed', handleAuthRefreshed)
    window.addEventListener('suplematch-auth-expired', handleAuthExpired)
    return () => {
      window.removeEventListener('suplematch-auth-refreshed', handleAuthRefreshed)
      window.removeEventListener('suplematch-auth-expired', handleAuthExpired)
    }
  }, [])

  const goTo = useCallback((s) => {
    setScreen(prev => { setPrevScreen(prev); return s })
  }, [])

  function saveApiResult(result) {
    setApiResult(result)
    try {
      localStorage.setItem('suplematch_last_result', JSON.stringify({ result, savedAt: new Date().toISOString() }))
    } catch {
      // Ignore browsers that block localStorage.
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2700)
  }

  const Screen = SCREENS[screen]

  return (
    <div className="phone">
      <Screen
        key={screen}
        goTo={goTo}
        prevScreen={prevScreen}
        showToast={showToast}
        userData={userData}
        setUserData={setUserData}
        apiResult={apiResult}
        setApiResult={saveApiResult}
        selectedRec={selectedRec}
        setSelectedRec={setSelectedRec}
        authToken={authToken}
        setAuthToken={setAuthToken}
        authUser={authUser}
        setAuthUser={setAuthUser}
      />
      {toast && <div className="toast">{toast}</div>}
      {sessionExpired && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--gray-800)', marginBottom: 8 }}>Sesión expirada</div>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5, marginBottom: 20 }}>Tu sesión ha expirado. Vuelve a ingresar para continuar.</p>
            <button className="btn-primary" style={{ width: '100%', marginBottom: 10 }} onClick={() => { setSessionExpired(false); goTo('acceso') }}>Re-ingresar</button>
            <button onClick={() => setSessionExpired(false)} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'center', padding: 4 }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
