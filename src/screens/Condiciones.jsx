const FALLBACK = [
  { code: 'DEFICIT_VIT_D', emoji: '☀️', nombre: 'Déficit de Vitamina D', nivel: 'Alta prob.',  probabilidad: 0.82, drivers: [] },
  { code: 'BAJA_INMUNIDAD', emoji: '🛡️', nombre: 'Baja Inmunidad',        nivel: 'Media prob.', probabilidad: 0.55, drivers: [] },
  { code: 'SALUDABLE',     emoji: '✅', nombre: 'Base saludable',         nivel: 'Confirmado',  probabilidad: 0.28, drivers: [] },
]

const IMPACT_COLORS = {
  alto:  { bg: '#FEF2F2', text: '#DC2626' },
  medio: { bg: '#FFFBEB', text: '#D97706' },
  bajo:  { bg: '#F0FDF4', text: '#16A34A' },
}

function condStyle(prob) {
  if (prob >= 0.65) return { bg: '#FFF7ED', border: '#FB923C', barC: '#FB923C' }
  if (prob >= 0.40) return { bg: '#FFFBEB', border: '#F59E0B', barC: '#F59E0B' }
  return { bg: 'var(--green-light)', border: 'var(--green)', barC: 'var(--green)' }
}

export default function Condiciones({ goTo, apiResult }) {
  const condiciones = apiResult?.condiciones ?? FALLBACK

  return (
    <div className="screen" style={{ background: 'var(--gray-50)', gap: 0 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Resultado del análisis
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-800)', letterSpacing: -0.5 }}>
          Tu perfil indica:
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {condiciones.map((c, i) => {
          const s = condStyle(c.probabilidad)
          const drivers = c.drivers ?? []
          return (
            <div key={i} style={{
              borderRadius: 'var(--radius)', padding: '18px 20px',
              background: s.bg, borderLeft: `4px solid ${s.border}`,
              boxShadow: 'var(--shadow)'
            }}>
              {/* Condición + barra */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: drivers.length ? 14 : 0 }}>
                <span style={{ fontSize: 32 }}>{c.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 6 }}>{c.nombre}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(c.probabilidad * 100)}%`, background: s.barC, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {Math.round(c.probabilidad * 100)}% · {c.nivel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drivers — por qué se detectó esta condición */}
              {drivers.length > 0 && (
                <div style={{ paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                    ¿Por qué?
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {drivers.map((d, j) => {
                      const ic = IMPACT_COLORS[d.impact] ?? IMPACT_COLORS.bajo
                      return (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--gray-700)' }}>{d.label}</span>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                            background: ic.bg, color: ic.text, whiteSpace: 'nowrap'
                          }}>
                            {d.value_label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', textAlign: 'center', marginBottom: 16 }}>
          Basado en tus respuestas · No reemplaza diagnóstico médico
        </p>
        <button className="btn-primary" onClick={() => goTo('recomendaciones')}>
          Ver mis recomendaciones →
        </button>
      </div>
    </div>
  )
}
