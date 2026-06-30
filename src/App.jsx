import { useState, useCallback, useEffect, lazy, Suspense, Component } from 'react'
import { useAuth } from './context/AuthContext'

const Acceso           = lazy(() => import('./screens/Acceso'))
const AdminCatalog     = lazy(() => import('./screens/AdminCatalog'))
const AdminOps         = lazy(() => import('./screens/AdminOps'))
const AdminReviews     = lazy(() => import('./screens/AdminReviews'))
const AdminSafetyRules = lazy(() => import('./screens/AdminSafetyRules'))
const Landing          = lazy(() => import('./screens/Landing'))
const Encuesta         = lazy(() => import('./screens/Encuesta'))
const Loading          = lazy(() => import('./screens/Loading'))
const Condiciones      = lazy(() => import('./screens/Condiciones'))
const Recomendaciones  = lazy(() => import('./screens/Recomendaciones'))
const Precios          = lazy(() => import('./screens/Precios'))
const Feedback         = lazy(() => import('./screens/Feedback'))
const Historial        = lazy(() => import('./screens/Historial'))
const Legal            = lazy(() => import('./screens/Legal'))
const Examenes         = lazy(() => import('./screens/Examenes'))
const Perfil           = lazy(() => import('./screens/Perfil'))

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 8 }}>Algo salió mal</div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20 }}>{this.state.error.message}</div>
          <button className="btn-primary" onClick={() => this.setState({ error: null })}>Reintentar</button>
        </div>
      )
    }
    return this.props.children
  }
}

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
  perfil:          Perfil,
  privacidad:      (props) => <Legal {...props} type="privacy" />,
  terminos:        (props) => <Legal {...props} type="terms" />,
}

const TAB_SCREENS = new Set(['landing', 'examenes', 'historial', 'perfil', 'acceso'])

function TabButton({ currentScreen, target, profileTarget, label, icon, goTo }) {
  const active = currentScreen === target || (target === profileTarget && (currentScreen === 'perfil' || currentScreen === 'acceso'))
  return (
    <button
      type="button"
      className={`mobile-tab ${active ? 'is-active' : ''}`}
      onClick={() => goTo(target)}
      aria-current={active ? 'page' : undefined}
    >
      <span className="mobile-tab-icon">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export default function App() {
  const [screen,      setScreen]      = useState('landing')
  const [prevScreen,  setPrevScreen]  = useState(null)
  const [toast,       setToast]       = useState(null)
  const [userData,    setUserData]    = useState(null)
  const [apiResult,   setApiResult]   = useState(null)
  const [selectedRec, setSelectedRec] = useState(null)
  const { authToken } = useAuth()
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    const onExpired  = () => setSessionExpired(true)
    const onRefreshed = () => setSessionExpired(false)
    window.addEventListener('suplematch-auth-expired',   onExpired)
    window.addEventListener('suplematch-auth-refreshed', onRefreshed)
    return () => {
      window.removeEventListener('suplematch-auth-expired',   onExpired)
      window.removeEventListener('suplematch-auth-refreshed', onRefreshed)
    }
  }, [])

  const goTo = useCallback((s) => {
    setScreen(prev => { setPrevScreen(prev); return s })
  }, [])

  function saveApiResult(result) {
    setApiResult(result)
  }

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2700)
  }, [])

  const Screen = SCREENS[screen]
  const showTabBar = TAB_SCREENS.has(screen)
  const profileTarget = authToken ? 'perfil' : 'acceso'

  return (
    <div className={`phone ${showTabBar ? 'has-tabbar' : ''}`}>
      <ErrorBoundary key={screen}>
      <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}><span style={{ color: 'var(--gray-400)', fontSize: 13 }}>Cargando…</span></div>}>
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
      />
      </Suspense>
      </ErrorBoundary>
      {showTabBar && (
        <nav className="mobile-tabbar" aria-label="Navegación principal">
          <TabButton currentScreen={screen} target="landing" profileTarget={profileTarget} label="Inicio" icon="⌂" goTo={goTo} />
          <TabButton currentScreen={screen} target="examenes" profileTarget={profileTarget} label="Labs" icon="+" goTo={goTo} />
          <TabButton currentScreen={screen} target="historial" profileTarget={profileTarget} label="Historial" icon="◷" goTo={goTo} />
          <TabButton currentScreen={screen} target={profileTarget} profileTarget={profileTarget} label={authToken ? 'Perfil' : 'Acceso'} icon="○" goTo={goTo} />
        </nav>
      )}
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
