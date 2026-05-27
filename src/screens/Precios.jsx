const FARMACIAS = [
  { pharmacy: 'Inkafarma', commercial_name: 'Vitamina D3', price: 22.9, url: null, registro_sanitario: 'Demo' },
  { pharmacy: 'Botica local', commercial_name: 'Vitamina D3 genérica', price: 18.5, url: null, registro_sanitario: 'Demo' },
  { pharmacy: 'Mifarma', commercial_name: 'Vitamina D3', price: 16, url: null, registro_sanitario: 'Demo' },
]

export default function Precios({ goTo, selectedRec }) {
  const rec = selectedRec ?? { icon: '☀️', nombre: 'Vitamina D3', dosis: '1000 UI / día', razon: 'Para tu déficit detectado' }
  const products = diversifyProducts(rec.products?.length ? rec.products : FARMACIAS)
  const cheapestPrice = Math.min(...products.map(product => Number(product.price)).filter(Number.isFinite))

  function formatPrice(value) {
    const price = Number(value)
    if (!Number.isFinite(price)) return 'Ver precio'
    return `S/ ${price.toFixed(2)}`
  }

  function openProduct(product) {
    if (!product?.url) return
    window.open(product.url, '_blank', 'noopener,noreferrer')
  }

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
        {products.map((p, index) => {
          const isCheapest = Number(p.price) === cheapestPrice
          const isVerified = p.regulatory_status === 'digemid_match' || p.registro_sanitario
          return (
          <div key={`${p.pharmacy}-${p.url ?? index}`} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: isCheapest ? 'var(--green-light)' : 'var(--gray-50)',
            borderRadius: 'var(--radius-sm)', padding: 16,
            border: `1.5px solid ${isCheapest ? 'var(--green)' : 'var(--gray-200)'}`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: 'var(--shadow)', flexShrink: 0
            }}>{pharmacyIcon(p.pharmacy)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)' }}>{p.pharmacy}</span>
                {isCheapest && (
                <span style={{
                  fontSize: 10, fontWeight: 700, background: 'var(--green)',
                  color: 'white', borderRadius: 99, padding: '2px 8px'
                }}>Mejor precio</span>
              )}
                {isVerified && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, background: 'white',
                    color: 'var(--green-dark)', borderRadius: 99, padding: '2px 8px',
                    border: '1px solid rgba(46,204,113,0.3)'
                  }}>RS validado</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4, lineHeight: 1.3 }}>
                {p.commercial_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
                {p.registro_sanitario ? `RS ${p.registro_sanitario}` : 'Fuente comercial'}
              </div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: isCheapest ? 'var(--green-dark)' : 'var(--gray-800)' }}>
              {formatPrice(p.price)}
            </div>
            <button onClick={() => openProduct(p)} disabled={!p.url} style={{
              background: p.url ? 'white' : 'var(--gray-100)',
              border: `1.5px solid ${isCheapest ? 'var(--green)' : 'var(--gray-200)'}`,
              borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
              color: p.url ? (isCheapest ? 'var(--green)' : 'var(--gray-600)') : 'var(--gray-400)',
              cursor: p.url ? 'pointer' : 'not-allowed'
            }}>Ver →</button>
          </div>
          )
        })}
      </div>

      <div style={{
        background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)', padding: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1.5px dashed var(--gray-200)'
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>Criterio de orden</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>Precio bajo, RS validado y variedad de farmacias</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-800)' }}>
          {products.length} opción{products.length !== 1 ? 'es' : ''}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn-primary" onClick={() => goTo('recomendaciones')}>
          ← Volver al pack completo
        </button>
      </div>
    </div>
  )
}

function diversifyProducts(products) {
  const sorted = [...products].sort((a, b) => Number(a.price) - Number(b.price))
  const byPharmacy = []
  const seen = new Set()

  for (const product of sorted) {
    if (seen.has(product.pharmacy)) continue
    seen.add(product.pharmacy)
    byPharmacy.push(product)
  }

  for (const product of sorted) {
    if (byPharmacy.includes(product)) continue
    byPharmacy.push(product)
  }

  return byPharmacy.slice(0, 6)
}

function pharmacyIcon(pharmacy = '') {
  const name = pharmacy.toLowerCase()
  if (name.includes('mifarma')) return '💙'
  if (name.includes('universal')) return '🏥'
  if (name.includes('boticas')) return '➕'
  return '💊'
}
