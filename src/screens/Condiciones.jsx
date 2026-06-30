import { GOAL_CODES } from '../constants'
import {
  FALLBACK, IMPACT_COLORS,
  associatedSignalsFor, condStyle, formatEvidence, probabilityLabel,
  hasObservedLabEvidence, conditionDisplayTitle, confidenceText,
  explanationText, formatDriverLabel, driverPriority,
} from './CondicionesUtils'

function EmptyNote({ text }) {
  return (
    <div style={{
      border: '1px dashed var(--gray-200)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 14px',
      fontSize: 12,
      color: 'var(--gray-500)',
      background: 'white',
      lineHeight: 1.4,
    }}>
      {text}
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.35 }}>{subtitle}</div>
      </div>
      {children}
    </section>
  )
}

function CondCard({ c, tone = 'risk' }) {
  const s = condStyle(c.probabilidad)
  const associatedSignals = associatedSignalsFor(c)
  const drivers = (c.drivers ?? []).map(driver => ({
    ...driver,
    label: formatDriverLabel(driver.label || driver.feature),
  })).sort((a, b) => driverPriority(b) - driverPriority(a))
  const visibleDrivers = drivers.slice(0, 3)
  const hiddenDrivers = drivers.slice(3)
  const border = tone === 'safety' ? '#F87171' : tone === 'wellness' ? 'var(--green)' : s.border
  const bg = tone === 'safety' ? '#FEF2F2' : tone === 'wellness' ? 'var(--green-light)' : s.bg
  return (
    <div style={{
      borderRadius: 'var(--radius)', padding: '18px 20px',
      background: bg, borderLeft: `4px solid ${border}`,
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: drivers.length ? 14 : 0 }}>
        <span style={{ fontSize: 32 }}>{c.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 6 }}>
            {conditionDisplayTitle(c, tone)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round(c.probabilidad * 100)}%`, background: s.barC, borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {probabilityLabel(c.probabilidad)}
            </span>
          </div>
          {(c.confidence_label || c.evidence_group) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {c.confidence_label && (
                <span style={{ fontSize: 10, color: 'var(--gray-600)', background: 'rgba(255,255,255,0.7)', borderRadius: 99, padding: '2px 7px', fontWeight: 700 }}>
                  Confianza {confidenceText(c.confidence_label)}
                </span>
              )}
              {c.evidence_group && (
                <span style={{ fontSize: 10, color: 'var(--gray-600)', background: 'rgba(255,255,255,0.7)', borderRadius: 99, padding: '2px 7px', fontWeight: 700 }}>
                  {formatEvidence(c.evidence_group)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.4, marginTop: drivers.length ? 0 : 10 }}>
        {explanationText(c, tone)}
      </div>
      {associatedSignals.length > 0 && (
        <div style={{
          marginTop: 12,
          border: '1px solid rgba(0,0,0,0.06)',
          background: 'rgba(255,255,255,0.65)',
          borderRadius: 10,
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 850, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 7 }}>
            Señales que podrías notar
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {associatedSignals.slice(0, 3).map(signal => (
              <span key={signal} style={{
                fontSize: 11, color: 'var(--gray-700)', background: 'white',
                border: '1px solid var(--gray-200)', borderRadius: 99,
                padding: '4px 8px', lineHeight: 1.2,
              }}>
                {signal}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--gray-500)', lineHeight: 1.35, marginTop: 7 }}>
            Son señales orientativas; pueden tener muchas causas y no confirman una deficiencia.
          </div>
        </div>
      )}
      {drivers.length > 0 && (
        <div style={{ paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            Señales principales
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {visibleDrivers.map((d, j) => {
              const ic = IMPACT_COLORS[d.impact] ?? IMPACT_COLORS.bajo
              return (
                <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--gray-700)' }}>{d.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                    background: ic.bg, color: ic.text, whiteSpace: 'nowrap',
                  }}>
                    {formatEvidence(d.value_label)}
                  </span>
                </div>
              )
            })}
          </div>
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 800, cursor: 'pointer' }}>
              Ver más señales
            </summary>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.45, marginTop: 7 }}>
              Estas señales ayudan a ordenar prioridades. No confirman una deficiencia ni reemplazan una evaluación profesional.
            </div>
            {hiddenDrivers.map((d, j) => {
              const ic = IMPACT_COLORS[d.impact] ?? IMPACT_COLORS.bajo
              return (
                <div key={`${d.label}-${j}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{d.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                    background: ic.bg, color: ic.text, whiteSpace: 'nowrap',
                  }}>
                    {formatEvidence(d.value_label)}
                  </span>
                </div>
              )
            })}
          </details>
        </div>
      )}
    </div>
  )
}

export default function Condiciones({ goTo, apiResult }) {
  const condiciones = apiResult?.condiciones ?? FALLBACK
  const conditionResults = apiResult?.condition_results ?? []
  const wellnessPriorities = apiResult?.wellness_priorities ?? []
  const safetyFlags = apiResult?.safety_flags ?? []
  const safetyLevel = apiResult?.safety_level ?? 'normal'
  const safetyActions = apiResult?.safety_actions ?? []
  const profileWarnings = apiResult?.profile_warnings ?? []

  const deficits = conditionResults.length > 0
    ? conditionResults
    : condiciones.filter(c => !GOAL_CODES.has(c.code))
  const highPriorityCount = deficits.filter(c => Number(c.probabilidad) >= 0.65).length
  const wellnessCount = wellnessPriorities.length
  const labSignalsCount = [...deficits, ...wellnessPriorities].filter(hasObservedLabEvidence).length

  return (
    <div className="screen app-shell">
      <header className="surface" style={{ gap: 16 }}>
        <button onClick={() => goTo('encuesta')} className="back-link" type="button">
          ← Ajustar respuestas
        </button>
        <div>
          <div className="app-kicker">Resultado del análisis</div>
          <h1 className="app-title">Tu perfil indica estas prioridades</h1>
          <p className="app-subtitle">
            Ordenamos señales nutricionales y de bienestar según tus respuestas. No es un diagnóstico ni reemplaza una evaluación profesional.
          </p>
        </div>
        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-label">Prioridad alta</div>
            <div className="metric-value">{highPriorityCount}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Bienestar</div>
            <div className="metric-value">{wellnessCount}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Con laboratorio</div>
            <div className="metric-value">{labSignalsCount}</div>
          </div>
        </div>
      </header>

      <details className="surface-soft" style={{ padding: 14 }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 900, color: 'var(--gray-800)' }}>
          Cómo leer colores y prioridades
        </summary>
        <div style={{ display: 'grid', gap: 8, marginTop: 10, fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.45 }}>
          <span><strong style={{ color: '#C2410C' }}>Naranja:</strong> prioridad alta o media por dieta, síntomas, hábitos o laboratorio.</span>
          <span><strong style={{ color: 'var(--green-dark)' }}>Verde:</strong> señal de contexto o bienestar para ordenar sugerencias.</span>
          <span><strong style={{ color: '#B91C1C' }}>Rojo:</strong> requiere precaución o revisión médica antes de consumir suplementos.</span>
        </div>
      </details>

      {(safetyLevel === 'medical_review_required' || safetyFlags.length > 0) && (
        <div className="alert alert-danger">
          <div style={{ fontSize: 12, color: '#B91C1C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            Revisión médica requerida
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {safetyActions.map(action => (
              <span key={action} style={{ fontSize: 12, color: '#7F1D1D', lineHeight: 1.4 }}>{action}</span>
            ))}
            {safetyFlags.map(flag => (
              <span key={flag.code} style={{ fontSize: 12, color: '#7F1D1D', lineHeight: 1.4 }}>
                {flag.nombre}: {flag.explanation ?? 'Requiere revisión profesional.'}
              </span>
            ))}
          </div>
        </div>
      )}

      {safetyLevel !== 'medical_review_required' && profileWarnings.length > 0 && (
        <div className="alert alert-warn">
          <div style={{ fontSize: 12, color: '#92400E', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            Alertas de seguridad
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {profileWarnings.map(warning => (
              <span key={warning} style={{ fontSize: 12, color: '#78350F', lineHeight: 1.4 }}>{warning}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 18 }}>
        <Section
          title="Riesgos estimados"
          subtitle="Prioridades nutricionales estimadas. No son diagnóstico ni reemplazan exámenes."
        >
          {deficits.length > 0
            ? deficits.map((c, i) => <CondCard key={`${c.code}-${i}`} c={c} />)
            : <EmptyNote text="No se detectaron riesgos priorizados con la información entregada." />}
        </Section>

        <Section
          title="Prioridades de bienestar"
          subtitle="Señales de encuesta útiles para ordenar el resultado, no para confirmar enfermedades."
        >
          {wellnessPriorities.length > 0
            ? wellnessPriorities.map((c, i) => <CondCard key={`${c.code}-${i}`} c={c} tone="wellness" />)
            : <EmptyNote text="No hay prioridades de bienestar adicionales." />}
        </Section>
      </div>

      <div className="surface-soft" style={{ marginTop: 2, padding: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', textAlign: 'center', marginBottom: 16 }}>
          Basado en tus respuestas · No reemplaza diagnóstico médico
        </p>
        <button className="btn-primary" onClick={() => goTo('recomendaciones')}>
          Ver mis recomendaciones →
        </button>
        <button onClick={() => goTo('encuesta')} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 13, cursor: 'pointer', width: '100%', marginTop: 12, padding: 4 }}>
          ← Modificar respuestas
        </button>
      </div>
    </div>
  )
}
