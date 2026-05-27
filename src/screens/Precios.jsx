const FARMACIAS = [
  { logo: '💊', nombre: 'Inkafarma', precio: 'S/ 22.90', mejor: false },
  { logo: '🏥', nombre: 'BTL',       precio: 'S/ 18.50', mejor: false },
  { logo: '💙', nombre: 'Mifarma',   precio: 'S/ 16.00', mejor: true  },
]

export default function Precios({ goTo, selectedRec }) {
  const rec = selectedRec ?? { icon: '☀️', nombre: 'Vitamina D3', dosis: '1000 UI / día', razon: 'Para tu déficit detectado' }

  return (
    <div className="screen" style={{ background: 'white', gap: 0 }}>
      <button onClick={() => goTo('recomendaciones')} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--gray-400)', fontSize: 15, marginBottom: 20, padding: 0
      }}>
        ← Volver a recomendaciones
      </button>

      <div style={{ marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, background: 'var(--green-light)', borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, marginBottom: 12
        }}>{rec.icon}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-800)' }}>{rec.nombre}</div>
        <div style={{ fontSize: 14, color: 'var(--gray-400)', marginTop: 2 }}>{rec.dosis} · {rec.razon}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {FARMACIAS.map(p => (
          <div key={p.nombre} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: p.mejor ? 'var(--green-light)' : 'var(--gray-50)',
            borderRadius: 'var(--radius-sm)', padding: 16,
            border: `1.5px solid ${p.mejor ? 'var(--green)' : 'var(--gray-200)'}`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: 'var(--shadow)', flexShrink: 0
            }}>{p.logo}</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{p.nombre}</span>
              {p.mejor && (
                <span style={{
                  fontSize: 10, fontWeight: 700, background: 'var(--green)',
                  color: 'white', borderRadius: 99, padding: '2px 8px'
                }}>⭐ Mejor</span>
              )}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: p.mejor ? 'var(--green-dark)' : 'var(--gray-800)' }}>
              {p.precio}
            </div>
            <button style={{
              background: 'white',
              border: `1.5px solid ${p.mejor ? 'var(--green)' : 'var(--gray-200)'}`,
              borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
              color: p.mejor ? 'var(--green)' : 'var(--gray-600)', cursor: 'pointer'
            }}>Ver →</button>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)', padding: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1.5px dashed var(--gray-200)'
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>Genérico disponible</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>Misma fórmula · Distinto laboratorio</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-800)' }}>S/ 8.00</div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn-primary" onClick={() => goTo('recomendaciones')}>
          ← Volver al pack completo
        </button>
      </div>
    </div>
  )
}
