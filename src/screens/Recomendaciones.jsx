const FALLBACK = [
  { icon: '☀️', nombre: 'Vitamina D3', razon: 'Por déficit detectado', dosis: '1000 UI / día', precio: 16, products: [] },
  { icon: '⚡', nombre: 'Zinc',        razon: 'Refuerza inmunidad',     dosis: '15 mg / día',   precio: 12, products: [] },
  { icon: '🍊', nombre: 'Vitamina C',  razon: 'Potencia el zinc',       dosis: '500 mg / día',  precio: 8, products: [] },
]

export default function Recomendaciones({ goTo, apiResult, setSelectedRec }) {
  const recs = apiResult?.recomendaciones ?? FALLBACK
  const topPack = apiResult?.packs_ranked?.[0]
  const selectedProducts = topPack?.selected_products ?? []

  function verPrecios(r) {
    setSelectedRec(r)
    goTo('precios')
  }

  function openProduct(product, event) {
    event?.stopPropagation()
    if (!product?.url) return
    window.open(product.url, '_blank', 'noopener,noreferrer')
  }

  function bestProduct(rec) {
    return rec.products?.[0] ?? null
  }

  function formatPrice(value) {
    const price = Number(value)
    if (!Number.isFinite(price)) return 'Ver precio'
    return `S/ ${price.toFixed(2)}`
  }

  return (
    <div className="screen" style={{ background: 'var(--gray-50)', gap: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          SupleMatch encontró
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-800)', letterSpacing: -0.5 }}>
          Tu pack personalizado
        </div>
      </div>

      {/* Pack card */}
      <div style={{
        background: 'var(--green-light)', borderRadius: 'var(--radius)', padding: 20,
        marginBottom: 20, border: '1.5px solid rgba(46,204,113,0.2)'
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dark)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Pack ideal · {selectedProducts.length || recs.length} producto{(selectedProducts.length || recs.length) !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {recs.map(r => (
            <div key={r.nombre} style={{
              background: 'white', borderRadius: 99, padding: '6px 14px',
              fontSize: 13, fontWeight: 600, color: 'var(--gray-800)',
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: 'var(--shadow)'
            }}>
              💊 {r.nombre}
            </div>
          ))}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--green)', color: 'white', borderRadius: 99,
          padding: '6px 14px', fontSize: 13, fontWeight: 600
        }}>
          ✅ Combo seguro y compatible
        </div>
      </div>

      {selectedProducts.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 'var(--radius-sm)', padding: 16,
          boxShadow: 'var(--shadow)', marginBottom: 20
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            Acceso rápido del pack
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedProducts.map(product => (
              <div key={`${product.component_id}-${product.url}`} style={{
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
                alignItems: 'center', border: '1px solid var(--gray-200)',
                borderRadius: 10, padding: 12, background: 'var(--gray-50)'
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-800)' }}>
                    {product.commercial_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
                    {product.pharmacy} · RS {product.registro_sanitario}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dark)', marginTop: 4 }}>
                    {formatPrice(product.price)}
                  </div>
                </div>
                <button onClick={(event) => openProduct(product, event)} style={{
                  background: 'var(--green)', color: 'white', border: 'none',
                  borderRadius: 8, padding: '9px 12px', fontSize: 12,
                  fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                }}>
                  Ver producto →
                </button>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 10, lineHeight: 1.4 }}>
            Selección balanceada por precio, farmacia y RS validado.
          </div>
        </div>
      )}

      {/* Rec cards */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
        Detalle por suplemento
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {recs.map(r => {
          const product = bestProduct(r)
          return (
          <div key={r.nombre} onClick={() => verPrecios(r)} style={{
            background: 'white', borderRadius: 'var(--radius-sm)', padding: 16,
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: 'var(--shadow)', cursor: 'pointer'
          }}>
            <div style={{
              width: 48, height: 48, background: 'var(--green-light)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0
            }}>{r.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-800)' }}>{r.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', margin: '2px 0' }}>{r.razon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-dark)' }}>{r.dosis}</div>
              {product && (
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 5 }}>
                  {product.pharmacy} · RS {product.registro_sanitario}
                </div>
              )}
            </div>
            <button onClick={(event) => product ? openProduct(product, event) : verPrecios(r)} style={{
              fontSize: 12, color: 'var(--green)', fontWeight: 600,
              background: 'var(--green-light)', border: 'none',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
              {product ? `${formatPrice(product.price)} →` : `S/ ${r.precio} →`}
            </button>
          </div>
          )
        })}
      </div>

      {/* Alerts */}
      <div style={{
        background: 'var(--amber-light)', borderRadius: 'var(--radius-sm)',
        padding: 16, border: '1px solid rgba(245,158,11,0.2)'
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
          Sinergias y alertas
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 8, lineHeight: 1.5 }}>
          💡 <strong>Zinc + Vitamina C</strong> se potencian mutuamente · tómalos juntos
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5 }}>
          ⚠️ <strong>D3 + Calcio</strong> · si usas ambos, tomar separados
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn-primary dark" onClick={() => goTo('feedback')}>
          ¿Fueron útiles estas recomendaciones?
        </button>
      </div>
    </div>
  )
}
