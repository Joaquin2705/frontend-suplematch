import { useEffect, useState } from 'react'
import { getHistory } from '../api/suplematch'
import { useAuth } from '../context/AuthContext'

const ICON_MAP = [
  [['vitamina d'], '☀️'],
  [['vitamina b12', 'b12'], '⚡'],
  [['vitamina c'], '🍊'],
  [['omega', 'epa', 'dha'], '🐟'],
  [['hierro'], '🔴'],
  [['zinc'], '🔵'],
  [['magnesio'], '💫'],
  [['calcio'], '🦴'],
  [['proteína', 'proteina', 'whey'], '💪'],
  [['probiótico', 'probiotico'], '🌱'],
  [['ácido fólico', 'acido folico', 'folato'], '🌿'],
  [['creatina'], '⚡'],
  [['luteína', 'luteina'], '👁️'],
]

function iconForComponent(name = '') {
  const lower = name.toLowerCase()
  for (const [keys, icon] of ICON_MAP) {
    if (keys.some(k => lower.includes(k))) return icon
  }
  return '💊'
}

function sessionToApiResult(session) {
  const productByComponent = {}
  for (const pack of (session.packs ?? [])) {
    for (const sp of (pack.selected_products ?? [])) {
      if (sp.component_id && !productByComponent[sp.component_id]) {
        productByComponent[sp.component_id] = {
          product_id: sp.product_id,
          commercial_name: sp.commercial_name,
          pharmacy: sp.pharmacy,
          url: sp.url,
          price: sp.price_at_recommendation,
          commercial_decision: 'allowed',
          product_safety_blocked: false,
          commercial_quality_flags: { has_traceable_components: true, has_valid_registration: false },
          component_traceable: true,
          ingredient: sp.component_name,
        }
      }
    }
  }

  return {
    recomendaciones: (session.items ?? []).map(item => ({
      component_id: item.component_id,
      nombre: item.component_name || item.component_id,
      razon: item.reason || '',
      condicion_display: null,
      icon: iconForComponent(item.component_name || ''),
      dosis: null,
      products: productByComponent[item.component_id] ? [productByComponent[item.component_id]] : [],
      commercial_eligible: Boolean(productByComponent[item.component_id]),
      evidence_strength: null,
      recommendation_role: item.recommendation_type || null,
      model2_stage: null,
    })),
    profile_warnings: session.profile_warnings ?? [],
    safety_level: (session.profile_warnings?.length ?? 0) > 0 ? 'attention' : 'normal',
    commercial_recommendations_blocked: false,
    conditions: session.conditions ?? [],
    sinergias: [],
    alertas: [],
    recommendation_id: session.recommendation_id || session.id,
    _historical: true,
    _historical_date: session.created_at,
  }
}

export default function Historial({ goTo, showToast, setApiResult }) {
  const { authToken } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(authToken))

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!authToken) { setLoading(false); return }
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
    <div className="screen app-shell">
      <header className="surface" style={{ gap: 12 }}>
        <button onClick={() => goTo('landing')} className="back-link" type="button">← Volver</button>
        <div>
          <div className="app-kicker">Historial</div>
          <h1 className="app-title">Tus recomendaciones</h1>
          <p className="app-subtitle">
            Revisa evaluaciones anteriores y repite el flujo cuando cambien tus hábitos, exámenes o suplementos actuales.
          </p>
        </div>
      </header>

      {/* Historial de cuenta */}
      {!authToken && (
        <div className="surface" style={{ textAlign: 'center' }}>
          <p style={{ ...bodyStyle, marginBottom: 14 }}>Inicia sesión para guardar y consultar evaluaciones asociadas a tu cuenta.</p>
          <button className="btn-secondary" onClick={() => goTo('acceso')}>Ingresar</button>
        </div>
      )}

      {authToken && loading && <p style={bodyStyle}>Cargando historial...</p>}
      {authToken && !loading && items.length === 0 && (
        <div className="surface" style={{ textAlign: 'center' }}>
          <p style={{ ...bodyStyle, marginBottom: 14 }}>Aún no tienes recomendaciones guardadas en tu cuenta.</p>
          <button className="btn-primary" onClick={() => goTo('encuesta')}>Crear primera evaluación</button>
        </div>
      )}

      {items.map(session => (
        <div key={session.id} className="surface">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 7 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 5 }}>
                {new Date(session.created_at).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                {session.conditions.join(', ') || 'Perfil evaluado'}
              </div>
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 850,
              color: session.profile_warnings?.length ? '#92400E' : 'var(--green-dark)',
              background: session.profile_warnings?.length ? 'var(--amber-light)' : 'var(--green-light)',
              borderRadius: 99,
              padding: '3px 7px',
              whiteSpace: 'nowrap',
            }}>
              {session.profile_warnings?.length ? 'Precaución' : 'Normal'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <MiniMetric label="Nutrientes" value={session.items?.length ?? 0} />
            <MiniMetric label="Alertas" value={session.profile_warnings?.length ?? 0} />
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
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              className="btn-secondary"
              style={{ flex: 1, fontSize: 12, padding: '10px 10px' }}
              onClick={() => {
                setApiResult(sessionToApiResult(session))
                goTo('recomendaciones')
              }}
            >
              Ver recomendación
            </button>
            <button className="btn-secondary" onClick={() => {
              try {
                localStorage.removeItem('suplematch_encuesta_answers')
              } catch {
                // Ignore browsers that block localStorage.
              }
              goTo('encuesta')
            }} style={{ flex: 1, fontSize: 12, padding: '10px 10px' }}>
              Nueva evaluación
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function MiniMetric({ label, value }) {
  return (
    <div style={{ background: 'var(--gray-50)', borderRadius: 9, padding: '8px 9px' }}>
      <div style={{ fontSize: 10, fontWeight: 850, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--gray-800)', marginTop: 1 }}>{value}</div>
    </div>
  )
}

const bodyStyle = { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.45 }
