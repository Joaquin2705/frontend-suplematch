import { logout as apiLogout, logoutAll as apiLogoutAll } from '../api/suplematch'
import { clearSession, getRefreshToken } from '../api/authStorage'
import { useAuth } from '../context/AuthContext'

export default function Landing({ goTo, showToast }) {
  const { authToken, setAuthToken, authUser, setAuthUser } = useAuth()
  const roles = new Set(authUser?.roles ?? [])
  const canAdmin = roles.has('admin')
  const canModerate = roles.has('admin') || roles.has('moderator')
  const hasAccount = Boolean(authToken)

  function startEvaluation() {
    if (!hasAccount) {
      showToast('Crea una cuenta para iniciar tu evaluación')
      goTo('acceso')
      return
    }
    goTo('encuesta')
  }

  async function logoutAllDevices() {
    try {
      await apiLogoutAll(authToken)
    } catch {
      // cierra sesión local de todas formas
    }
    clearSession()
    setAuthToken(null)
    setAuthUser(null)
  }

  async function logout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await apiLogout(refreshToken)
      } catch {
        // Local logout still clears an unusable or expired server session.
      }
    }
    clearSession()
    setAuthToken(null)
    setAuthUser(null)
  }

  return (
    <div className="screen app-shell">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, background: 'var(--green)',
            borderRadius: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 14px 24px rgba(25,169,116,0.24)',
          }}>
            <span style={{ fontSize: 18, fontWeight: 950, color: 'white', letterSpacing: -1 }}>SM</span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 950, color: 'var(--gray-900)', letterSpacing: -0.5 }}>
              Suple<span style={{ color: 'var(--green)' }}>Match</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 750 }}>
              Recomendación orientativa personalizada
            </div>
          </div>
        </div>
        {authUser && (
          <div className="badge badge-gray" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {authUser.email}
          </div>
        )}
      </header>

      <section className="surface mobile-hero-card">
        <div className="hero-lockup">
          <div style={{ minWidth: 0 }}>
            <span className="app-kicker">Plan personalizado</span>
            <h1 className="app-title" style={{ marginTop: 7 }}>
              Tu ruta inteligente para elegir suplementos.
            </h1>
          </div>
          <div className="health-ring" aria-hidden="true">
            <span>SM</span>
          </div>
        </div>
        <p className="app-subtitle" style={{ marginTop: 12 }}>
          SupleMatch convierte tus hábitos, restricciones, exámenes opcionales y presupuesto en una recomendación orientativa con productos trazables.
        </p>
        <div className="dashboard-status">
          <div>
            <span>{hasAccount ? 'Cuenta activa' : 'Cuenta requerida'}</span>
            <strong>{hasAccount ? 'Listo para evaluar' : 'Crea tu perfil para empezar'}</strong>
          </div>
          <button type="button" onClick={() => goTo(hasAccount ? 'perfil' : 'acceso')}>
            {hasAccount ? 'Ver perfil' : 'Crear cuenta'}
          </button>
        </div>
        <button className="btn-primary" onClick={startEvaluation} style={{ marginTop: 16 }}>
          {hasAccount ? 'Iniciar evaluación →' : 'Crear cuenta e iniciar →'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.4, marginTop: 10 }}>
          Necesitas una cuenta para guardar historial, exámenes y feedback. La recomendación no reemplaza atención profesional.
        </p>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <span>1</span>
          <strong>Perfil guiado</strong>
          <small>Preguntas cortas sobre alimentación, sueño, actividad física y seguridad.</small>
        </article>
        <article className="dashboard-card">
          <span>2</span>
          <strong>Motor híbrido</strong>
          <small>Modelos de riesgo, reglas safety y evidencia por componente.</small>
        </article>
        <article className="dashboard-card">
          <span>3</span>
          <strong>Pack útil</strong>
          <small>Productos priorizados por precio, trazabilidad, reviews y presupuesto.</small>
        </article>
      </section>

      <section>
        <div className="section-title" style={{ marginBottom: 10 }}>Acciones rápidas</div>
        <div className="quick-grid">
          <button className="quick-card" onClick={() => goTo(hasAccount ? 'examenes' : 'acceso')}>
            <span className="quick-icon">+</span>
            <strong>Subir examen</strong>
            <small>{hasAccount ? 'OCR y revisión' : 'Requiere cuenta'}</small>
          </button>
          <button className="quick-card" onClick={() => goTo(hasAccount ? 'historial' : 'acceso')}>
            <span className="quick-icon">◷</span>
            <strong>Historial</strong>
            <small>{hasAccount ? 'Resultados previos' : 'Guarda tus avances'}</small>
          </button>
          <button className="quick-card" onClick={() => goTo(authToken ? 'perfil' : 'acceso')}>
            <span className="quick-icon">○</span>
            <strong>{authToken ? 'Perfil' : 'Acceso'}</strong>
            <small>{authToken ? 'Datos guardados' : 'Guardar avances'}</small>
          </button>
          <button className="quick-card" onClick={startEvaluation}>
            <span className="quick-icon">›</span>
            <strong>Nuevo pack</strong>
            <small>{hasAccount ? 'Top 3 o Top 5' : 'Primero crea cuenta'}</small>
          </button>
        </div>
      </section>

      <section className="surface" style={{ padding: 16 }}>
        <div className="section-title">Qué hace diferente a SupleMatch</div>
        <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.45, marginTop: 6 }}>
          No mostramos una lista genérica. Separamos necesidades probables, componentes sugeridos y productos comerciales para reducir compras impulsivas o incompatibles.
        </p>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {[
            ['✓', 'Personalización real', 'Usa datos físicos, hábitos, alimentos semanales, suplementos actuales y presupuesto.'],
            ['✓', 'Safety antes de venta', 'Anticoagulantes, tiroides, alergias u otras alertas ajustan lo que se puede comprar.'],
            ['✓', 'Catálogo trazable', 'Prioriza productos con precio, farmacia, registro y señales de calidad comercial.'],
          ].map(([n, title, detail]) => (
            <div key={n} className="timeline-row">
              <span>{n}</span>
              <div>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-soft commercial-panel">
        <div>
          <span className="app-kicker">Resultado esperado</span>
          <h2>De una encuesta a un pack accionable.</h2>
          <p>
            Al terminar, verás prioridades del perfil, suplementos sugeridos, packs dentro de presupuesto y explicación simple de por qué aparece cada producto.
          </p>
        </div>
        <div className="wellness-strip">
          <span>Perfil</span>
          <span>Safety</span>
          <span>Pack</span>
          <span>Feedback</span>
        </div>
      </section>

      <section className="surface-soft" style={{ padding: 16 }}>
        {canModerate && !canAdmin && (
          <button className="btn-secondary" onClick={() => goTo('adminReviews')}>Reviews</button>
        )}
        {canAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            <button className="btn-secondary" onClick={() => goTo('adminCatalog')}>Catálogo</button>
            <button className="btn-secondary" onClick={() => goTo('adminOps')}>Operación</button>
            <button className="btn-secondary" onClick={() => goTo('adminSafetyRules')}>Safety</button>
            <button className="btn-secondary" onClick={() => goTo('adminReviews')}>Moderación</button>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: canAdmin || canModerate ? 12 : 0, flexWrap: 'wrap' }}>
          <button
            onClick={() => authToken ? logout() : goTo('acceso')}
            style={{ background: 'none', border: 'none', color: 'var(--gray-600)', fontSize: 13, cursor: 'pointer', padding: 4, fontWeight: 800 }}
          >
            {authToken ? 'Cerrar sesión' : 'Iniciar sesión'}
          </button>
          {authToken && (
            <button
              onClick={logoutAllDevices}
              style={{ background: 'none', border: 'none', color: 'var(--gray-500)', fontSize: 12, cursor: 'pointer', padding: 4, fontWeight: 750 }}
            >
              Cerrar todas las sesiones
            </button>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 12, marginTop: 8 }}>
          <button type="button" onClick={() => goTo('privacidad')} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>Privacidad</button>
          <button type="button" onClick={() => goTo('terminos')} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>Términos</button>
        </div>
      </section>
    </div>
  )
}
