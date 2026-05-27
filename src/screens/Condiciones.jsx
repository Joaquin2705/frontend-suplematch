const FALLBACK = [
  { emoji: '😌', nombre: 'Déficit de Vitamina D', nivel: 'Alta prob.',  probabilidad: 0.82 },
  { emoji: '🛡️', nombre: 'Baja Inmunidad',        nivel: 'Media prob.', probabilidad: 0.55 },
  { emoji: '✅', nombre: 'Base saludable',         nivel: 'Confirmado',  probabilidad: 0.28 },
]

function condStyle(prob) {
  if (prob >= 0.65) return { bg: '#FFFBEB', border: '#F59E0B', barC: '#F59E0B' }
  if (prob >= 0.40) return { bg: '#FFF7ED', border: '#FB923C', barC: '#FB923C' }
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
          return (
            <div key={i} style={{
              borderRadius: 'var(--radius)', padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              background: s.bg, borderLeft: `4px solid ${s.border}`,
              boxShadow: 'var(--shadow)'
            }}>
              <span style={{ fontSize: 32 }}>{c.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 6 }}>{c.nombre}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round(c.probabilidad * 100)}%`, background: s.barC, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap', fontWeight: 500 }}>{c.nivel}</span>
                </div>
              </div>
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
