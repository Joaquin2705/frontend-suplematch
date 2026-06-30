import { useMemo, useState } from 'react'

const FARMACIAS = [
  { pharmacy: 'Inkafarma', commercial_name: 'Vitamina D3', price: 22.9, url: null, registro_sanitario: 'Demo' },
  { pharmacy: 'Botica local', commercial_name: 'Vitamina D3 genérica', price: 18.5, url: null, registro_sanitario: 'Demo' },
  { pharmacy: 'Mifarma', commercial_name: 'Vitamina D3', price: 16, url: null, registro_sanitario: 'Demo' },
]

export default function Precios({ goTo, selectedRec }) {
  const rec = selectedRec ?? { icon: '☀️', nombre: 'Vitamina D3', dosis: '1000 UI / día', razon: 'Para tu déficit detectado' }
  const [sortMode, setSortMode] = useState('score')
  const [pharmacyFilter, setPharmacyFilter] = useState('all')
  const sourceProducts = (rec.products?.length ? rec.products : FARMACIAS).filter(isLikelyUserProduct)
  const pharmacies = useMemo(() => [...new Set(sourceProducts.map(product => product.pharmacy).filter(Boolean))], [sourceProducts])
  const products = useMemo(
    () => orderProducts(sourceProducts, sortMode, pharmacyFilter),
    [sourceProducts, sortMode, pharmacyFilter]
  )
  const validPrices = products.map(product => Number(product.price)).filter(Number.isFinite)
  const cheapestPrice = validPrices.length ? Math.min(...validPrices) : null

  function formatPrice(value) {
    const price = Number(value)
    if (!Number.isFinite(price)) return 'Ver precio'
    return `S/ ${price.toFixed(2)}`
  }

  function openProduct(product) {
    if (!product?.url) return
    window.open(product.url, '_blank', 'noopener,noreferrer')
  }

  function productBlocked(product) {
    return product?.commercial_decision === 'blocked' || product?.product_safety_blocked === true
  }

  function scoreLabel(product) {
    const score = Number(product?.commercial_score ?? product?.product_score)
    if (!Number.isFinite(score)) return null
    return `Score ${Math.round(score * 100)}`
  }

  function badges(product) {
    const flags = product?.commercial_quality_flags ?? {}
    const out = []
    if (flags.is_unit_component || product?.component_match_type === 'unit_component') out.push(['Unitario', 'var(--green-dark)', 'var(--green-light)'])
    if (flags.is_multicomponent || product?.component_match_type === 'multi_component') out.push(['Multicomponente', '#92400E', 'var(--amber-light)'])
    if (flags.has_valid_registration) out.push(['RS trazable', 'var(--green-dark)', 'var(--green-light)'])
    if (flags.has_verified_label_flags) out.push(['Etiqueta verificada', '#1D4ED8', '#DBEAFE'])
    if (flags.has_inferred_label_flags) out.push(['Restricciones inferidas', '#92400E', 'var(--amber-light)'])
    if (flags.contains_fish_or_shellfish) out.push(['Pescado/mariscos', '#B91C1C', '#FEF2F2'])
    if (flags.may_contain_gelatin) out.push(['Gelatina posible', '#92400E', 'var(--amber-light)'])
    return out.slice(0, 5)
  }

  return (
    <div className="screen app-shell">
      <header className="product-detail-hero">
        <button onClick={() => goTo('recomendaciones')} className="back-link" type="button" style={{ color: 'rgba(255,255,255,0.86)' }}>
          ← Volver a recomendaciones
        </button>

        <div>
          <div style={{
            width: 64, height: 64, background: 'rgba(255,255,255,0.16)', borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, marginBottom: 12, border: '1px solid rgba(255,255,255,0.2)'
          }}>{rec.icon}</div>
          <div className="app-kicker">Detalle comercial</div>
          <h1 className="app-title">{rec.nombre}</h1>
          <p className="app-subtitle">{rec.dosis} · {rec.razon}</p>
          {cheapestPrice !== null && <span className="price-pill">Desde {formatPrice(cheapestPrice)}</span>}
        </div>
      </header>

      <section className="surface-soft" style={{ padding: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.4, marginBottom: 10 }}>
          Los precios y stock pueden cambiar en la farmacia. Revisa la página del producto antes de comprar.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={controlLabelStyle}>
            Ordenar
            <select value={sortMode} onChange={event => setSortMode(event.target.value)} style={controlStyle}>
              <option value="score">Mejor match</option>
              <option value="price">Menor precio</option>
              <option value="pharmacy">Farmacia</option>
            </select>
          </label>
          <label style={controlLabelStyle}>
            Farmacia
            <select value={pharmacyFilter} onChange={event => setPharmacyFilter(event.target.value)} style={controlStyle}>
              <option value="all">Todas</option>
              {pharmacies.map(pharmacy => <option key={pharmacy} value={pharmacy}>{pharmacy}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="surface" style={{ gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, color: 'var(--gray-800)', fontWeight: 900 }}>Opciones disponibles</div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.4, marginTop: 2 }}>
            Ordenadas por match comercial, trazabilidad, precio y diversidad de farmacia.
          </div>
        </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {products.length === 0 && (
          <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: 16, fontSize: 13, color: 'var(--gray-600)' }}>
            No hay productos para el filtro seleccionado.
          </div>
        )}
        {products.map((p, index) => {
          const isCheapest = cheapestPrice !== null && Number(p.price) === cheapestPrice
          const isVerified = p.regulatory_status === 'digemid_match' || p.registro_sanitario
          const blocked = productBlocked(p)
          return (
          <div key={`${p.pharmacy}-${p.url ?? index}`} className="compact-product-card" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: isCheapest ? 'var(--green-light)' : 'white',
            borderColor: isCheapest ? 'var(--green)' : 'var(--gray-200)',
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
                {scoreLabel(p) && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, background: 'white',
                    color: '#1D4ED8', borderRadius: 99, padding: '2px 8px',
                    border: '1px solid #BFDBFE'
                  }}>{scoreLabel(p)}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4, lineHeight: 1.3 }}>
                {p.commercial_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
                {p.registro_sanitario ? `RS ${p.registro_sanitario}` : 'Fuente comercial'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                {badges(p).map(([label, color, bg]) => (
                  <span key={label} style={{ fontSize: 10, fontWeight: 800, color, background: bg, borderRadius: 99, padding: '2px 7px' }}>{label}</span>
                ))}
              </div>
              {p.selection_reasons?.slice(0, 3).map(reason => (
                <div key={reason} style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4, lineHeight: 1.35 }}>{reason}</div>
              ))}
              {blocked && (
                <div style={{ fontSize: 11, color: '#B91C1C', background: '#FEF2F2', borderRadius: 8, padding: 7, marginTop: 6, fontWeight: 800 }}>
                  Producto bloqueado por seguridad o restricción.
                </div>
              )}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: isCheapest ? 'var(--green-dark)' : 'var(--gray-800)' }}>
              {formatPrice(p.price)}
            </div>
            <button onClick={() => openProduct(p)} disabled={!p.url || blocked} style={{
              background: p.url && !blocked ? 'white' : 'var(--gray-100)',
              border: `1.5px solid ${isCheapest ? 'var(--green)' : 'var(--gray-200)'}`,
              borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
              color: p.url && !blocked ? (isCheapest ? 'var(--green)' : 'var(--gray-600)') : 'var(--gray-400)',
              cursor: p.url && !blocked ? 'pointer' : 'not-allowed'
            }}>{blocked ? 'Bloqueado' : 'Ver en tienda →'}</button>
          </div>
          )
        })}
      </div>
      </section>

      <div className="surface-soft" style={{
        padding: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1.5px dashed var(--gray-200)'
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>Criterio de orden</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>Score comercial, producto unitario, safety, precio, RS y variedad de farmacias</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-800)' }}>
          {products.length} opción{products.length !== 1 ? 'es' : ''}
        </div>
      </div>

      <div>
        <button className="btn-primary" onClick={() => goTo('recomendaciones')}>
          ← Volver al pack completo
        </button>
      </div>
    </div>
  )
}

function orderProducts(products, sortMode = 'score', pharmacyFilter = 'all') {
  const filtered = pharmacyFilter === 'all'
    ? [...products]
    : products.filter(product => product.pharmacy === pharmacyFilter)
  const sorted = filtered.sort((a, b) => {
    if (sortMode === 'price') {
      return (Number.isFinite(Number(a.price)) ? Number(a.price) : Number.POSITIVE_INFINITY) -
        (Number.isFinite(Number(b.price)) ? Number(b.price) : Number.POSITIVE_INFINITY)
    }
    if (sortMode === 'pharmacy') {
      return String(a.pharmacy || '').localeCompare(String(b.pharmacy || '')) || Number(a.price) - Number(b.price)
    }
    const scoreA = Number(a.commercial_score ?? a.product_score)
    const scoreB = Number(b.commercial_score ?? b.product_score)
    if (Number.isFinite(scoreA) || Number.isFinite(scoreB)) {
      return (Number.isFinite(scoreB) ? scoreB : 0) - (Number.isFinite(scoreA) ? scoreA : 0)
    }
    return Number(a.price) - Number(b.price)
  })
  if (sortMode !== 'score') return sorted.slice(0, 6)

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

function isLikelyUserProduct(product) {
  const name = String(product?.commercial_name || '').toLowerCase()
  const nonSupplementHints = ['esparadrapo', 'apósito', 'vendaje', 'crema', 'shampoo', 'champú', 'gel tópico']
  if (nonSupplementHints.some(hint => name.includes(hint))) return false
  if (product?.commercial_decision === 'blocked' || product?.product_safety_blocked) return false
  return true
}

const controlLabelStyle = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11, color: 'var(--gray-600)', fontWeight: 800 }
const controlStyle = { width: '100%', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '9px 10px', fontSize: 12, color: 'var(--gray-800)', background: 'white' }

function pharmacyIcon(pharmacy = '') {
  const name = pharmacy.toLowerCase()
  if (name.includes('inkafarma')) return '🟠'
  if (name.includes('mifarma')) return '💙'
  if (name.includes('universal')) return '🏥'
  if (name.includes('boticas')) return '➕'
  return '💊'
}
