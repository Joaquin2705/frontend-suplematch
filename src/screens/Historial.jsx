import { useEffect, useState } from 'react'
import { getHistory } from '../api/suplematch'

export default function Historial({ goTo, showToast, authToken }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(authToken))

  const lastLocal = (() => {
    try {
      return JSON.parse(localStorage.getItem('suplematch_last_result'))
    } catch {
      return null
    }
  })()

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!authToken) return
      try {
        const data = await getHistory(authToken)
        if (!cancelled) setItems(data)
      } catch (error) {
        showToast(error.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [authToken, showToast])

  return (
    <div className="screen" style={{ background: 'var(--gray-50)', gap: 16 }}>
      <button onClick={() => goTo('landing')} style={backStyle}>←</button>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Historial
        </div>
        <h1 style={titleStyle}>Tus recomendaciones</h1>
      </div>

      {/* Última sesión local */}
      {lastLocal && (
        <div style={{ ...cardStyle, borderLeft: '3px solid var(--green)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            Última evaluación · {new Date(lastLocal.savedAt).toLocaleString()}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {(lastLocal.result?.condiciones ?? []).filter(c => !['RENDIMIENTO_DEPORTIVO','SALUD_CAPILAR','SALUD_CAPILAR_PIEL','SALUD_COGNITIVA','SALUD_OSEA'].includes(c.code)).map(c => (
              <span key={c.code} style={{ fontSize: 12, background: 'var(--green-light)', color: 'var(--green-dark)', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>
                {c.nombre}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {(lastLocal.result?.recomendaciones ?? []).slice(0, 4).map(r => (
              <div key={r.component_id ?? r.nombre} style={{ fontSize: 13, color: 'var(--gray-700)', display: 'flex', gap: 8 }}>
                <span>{r.icon}</span>
                <span><strong>{r.nombre}</strong> · {r.dosis}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={() => goTo('recomendaciones')} style={{ fontSize: 13, padding: '10px 16px', flex: 1 }}>
              Ver resultados →
            </button>
            <button className="btn-secondary" onClick={() => {
              try {
                localStorage.removeItem('suplematch_encuesta_answers')
              } catch {
                // Ignore browsers that block localStorage.
              }
              goTo('encuesta')
            }} style={{ fontSize: 13, padding: '10px 14px' }}>
              Nueva evaluación
            </button>
          </div>
        </div>
      )}

      {/* Historial de cuenta */}
      {!authToken && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ ...bodyStyle, marginBottom: 14 }}>Inicia sesión para guardar tu historial entre dispositivos.</p>
          <button className="btn-secondary" onClick={() => goTo('acceso')}>Ingresar</button>
        </div>
      )}

      {authToken && loading && <p style={bodyStyle}>Cargando historial...</p>}
      {authToken && !loading && items.length === 0 && <p style={bodyStyle}>Aún no tienes recomendaciones guardadas en tu cuenta.</p>}

      {items.map(session => (
        <div key={session.id} style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 5 }}>
            {new Date(session.created_at).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 10 }}>
            {session.conditions.join(', ') || 'Perfil evaluado'}
          </div>
          {session.profile_warnings?.slice(0, 2).map(warning => (
            <div key={warning} style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700, lineHeight: 1.35, marginBottom: 5 }}>
              {warning}
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {session.items?.slice(0, 4).map(item => (
              <div key={item.id} style={{ fontSize: 12, color: 'var(--gray-700)' }}>
                {item.rank}. {item.component_name || item.component_id} · {item.reason || 'Recomendado'}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const backStyle = { background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 20, alignSelf: 'flex-start', cursor: 'pointer' }
const titleStyle = { fontSize: 25, color: 'var(--gray-800)', lineHeight: 1.2 }
const bodyStyle = { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.45 }
const cardStyle = { background: 'white', borderRadius: 'var(--radius-sm)', padding: 15, boxShadow: 'var(--shadow)' }
