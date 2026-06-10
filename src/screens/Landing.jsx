import { logout as apiLogout, logoutAll as apiLogoutAll } from '../api/suplematch'

export default function Landing({ goTo, authToken, setAuthToken, authUser, setAuthUser }) {
  const roles = new Set(authUser?.roles ?? [])
  const canAdmin = roles.has('admin')
  const canModerate = roles.has('admin') || roles.has('moderator')

  async function logoutAllDevices() {
    try {
      await apiLogoutAll(authToken)
    } catch {
      // cierra sesión local de todas formas
    }
    localStorage.removeItem('suplematch_token')
    localStorage.removeItem('suplematch_refresh_token')
    localStorage.removeItem('suplematch_user')
    setAuthToken(null)
    setAuthUser(null)
  }

  async function logout() {
    const refreshToken = localStorage.getItem('suplematch_refresh_token')
    if (refreshToken) {
      try {
        await apiLogout(refreshToken)
      } catch {
        // Local logout still clears an unusable or expired server session.
      }
    }
    localStorage.removeItem('suplematch_token')
    localStorage.removeItem('suplematch_refresh_token')
    localStorage.removeItem('suplematch_user')
    setAuthToken(null)
    setAuthUser(null)
  }

  return (
    <div className="screen" style={{ background: 'white', alignItems: 'center', justifyContent: 'space-between' }}>
      {/* Logo */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, background: 'var(--green)',
          borderRadius: 22, display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 14px',
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: 'white', letterSpacing: -1 }}>SM</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gray-800)', letterSpacing: -0.5 }}>
          Suple<span style={{ color: 'var(--green)' }}>Match</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, width: '100%' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--gray-800)', lineHeight: 1.25, letterSpacing: -0.8 }}>
          Descubre qué <span style={{ color: 'var(--green)' }}>suplementos</span> necesita tu cuerpo
        </h1>
        <p style={{ fontSize: 15, color: 'var(--gray-400)', lineHeight: 1.6 }}>
          Basado en tu perfil real, no en suposiciones genéricas.
        </p>
        <div style={{
          background: 'var(--green-light)', borderRadius: 24,
          padding: 28, display: 'flex', justifyContent: 'center', gap: 16
        }}>
          {[['💊','Vitamina D'],['🌿','Zinc'],['🍊','Vitamina C']].map(([emoji, label]) => (
            <div key={label} style={{
              background: 'white', borderRadius: 14, padding: '14px 12px',
              textAlign: 'center', fontSize: 26, boxShadow: 'var(--shadow)', flex: 1
            }}>
              {emoji}
              <small style={{ display: 'block', fontSize: 11, color: 'var(--gray-400)', marginTop: 4, fontWeight: 500 }}>
                {label}
              </small>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Basado en tu perfil real','Sin registro · Solo unos minutos','Recomendaciones con evidencia'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-400)' }}>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span> {t}
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={() => goTo('encuesta')}>
          Iniciar evaluación →
        </button>
        <button className="btn-secondary" onClick={() => goTo('examenes')}>
          Analizar exámenes
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: canModerate ? '1fr 1fr' : '1fr', gap: 8 }}>
          <button className="btn-secondary" onClick={() => goTo('historial')}>Historial</button>
          {canModerate && <button className="btn-secondary" onClick={() => goTo('adminReviews')}>Reviews</button>}
        </div>
        {canAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="btn-secondary" onClick={() => goTo('adminCatalog')}>Catálogo</button>
            <button className="btn-secondary" onClick={() => goTo('adminOps')}>Operación</button>
            <button className="btn-secondary" onClick={() => goTo('adminSafetyRules')}>Safety</button>
            <button className="btn-secondary" onClick={() => goTo('adminReviews')}>Moderación</button>
          </div>
        )}
        {authUser && (
          <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
            {authUser.email} · {(authUser.roles ?? ['user']).join(', ')}
          </div>
        )}
        <button
          onClick={() => authToken ? logout() : goTo('acceso')}
          style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 13, cursor: 'pointer', padding: 4 }}
        >
          {authToken ? 'Cerrar sesión' : 'Iniciar sesión'}
        </button>
        {authToken && (
          <button
            onClick={logoutAllDevices}
            style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 12, cursor: 'pointer', padding: 4 }}
          >
            Cerrar sesiones en todos los dispositivos
          </button>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 12 }}>
          <button type="button" onClick={() => goTo('privacidad')} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>Privacidad</button>
          <button type="button" onClick={() => goTo('terminos')} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>Términos</button>
        </div>
      </div>
    </div>
  )
}
