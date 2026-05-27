export default function Landing({ goTo }) {
  return (
    <div className="screen" style={{ background: 'white', alignItems: 'center', justifyContent: 'space-between' }}>
      {/* Logo */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, background: 'var(--green-light)',
          borderRadius: 22, display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 14px', fontSize: 36
        }}>💊</div>
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
          {['Basado en tu perfil real','Sin registro · Solo 2 minutos','Recomendaciones con evidencia'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-400)' }}>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span> {t}
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={() => goTo('encuesta')}>
          Iniciar evaluación →
        </button>
      </div>
    </div>
  )
}
