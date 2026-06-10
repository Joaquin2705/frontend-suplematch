import { useState } from 'react'
import { postSupplementReview } from '../api/suplematch'

const FALLBACK = [
  { icon: '☀️', nombre: 'Vitamina D3', razon: 'Por déficit detectado', dosis: '1000 UI / día', precio: 16, products: [] },
  { icon: '⚡', nombre: 'Zinc',        razon: 'Refuerza inmunidad',     dosis: '15 mg / día',   precio: 12, products: [] },
  { icon: '🍊', nombre: 'Vitamina C',  razon: 'Potencia el zinc',       dosis: '500 mg / día',  precio: 8, products: [] },
]

export default function Recomendaciones({ goTo, prevScreen, showToast, apiResult, setSelectedRec, authToken }) {
  const recs = apiResult?.recomendaciones ?? FALLBACK
  const topPack = apiResult?.packs_ranked?.[0]
  const selectedProducts = topPack?.selected_products ?? []
  const profileWarnings = apiResult?.profile_warnings ?? []
  const safetyLevel = apiResult?.safety_level ?? 'normal'
  const safetyActions = apiResult?.safety_actions ?? []
  const commercialBlocked = false
  const [reviewProduct, setReviewProduct] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSending, setReviewSending] = useState(false)

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

  function verificationLabel(product) {
    if (!product) return null
    const rs = product.registro_sanitario && product.registro_sanitario !== 'N/D'
    const traceable = product.component_traceable && product.component_traceable !== 'N/D'
    if (rs && traceable) return 'RS y componente trazables'
    if (rs) return 'RS informado'
    if (traceable) return 'Componente inferido'
    return 'Trazabilidad limitada'
  }

  async function submitProductReview() {
    if (!authToken) {
      showToast('Inicia sesión para dejar una reseña')
      goTo('acceso')
      return
    }
    if (!reviewProduct?.product_id) {
      showToast('Este producto aún no tiene ID relacional')
      return
    }

    setReviewSending(true)
    try {
      await postSupplementReview({
        product_id: reviewProduct.product_id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      }, authToken)
      showToast('Reseña enviada a moderación')
      setReviewProduct(null)
      setReviewComment('')
      setReviewRating(5)
    } catch (error) {
      showToast(error.message)
    } finally {
      setReviewSending(false)
    }
  }

  const [packOpen, setPackOpen] = useState(false)

  return (
    <div className="screen" style={{ background: 'var(--gray-50)', gap: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => goTo(prevScreen ?? 'condiciones')} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 13, cursor: 'pointer', padding: '0 0 10px 0', display: 'block' }}>
          ← Volver
        </button>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          SupleMatch encontró
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-800)', letterSpacing: -0.5 }}>
          Tus suplementos
        </div>
      </div>

      {/* Aviso médico compacto */}
      {(safetyLevel === 'medical_review_required' || profileWarnings.length > 0) && (
        <div style={{
          background: safetyLevel === 'medical_review_required' ? '#FFFBEB' : 'var(--amber-light)',
          border: `1px solid ${safetyLevel === 'medical_review_required' ? '#FCD34D' : 'rgba(245,158,11,0.25)'}`,
          borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'flex-start', gap: 8
        }}>
          <span style={{ fontSize: 16, marginTop: 1 }}>⚠️</span>
          <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.45 }}>
            {safetyLevel === 'medical_review_required'
              ? (safetyActions[0] ?? 'Tu perfil requiere supervisión médica. Consulta un profesional antes de consumir.')
              : profileWarnings[0]}
          </div>
        </div>
      )}

      {commercialBlocked && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 12,
          color: '#7F1D1D',
          lineHeight: 1.45,
          fontWeight: 700,
        }}>
          Productos comerciales ocultos hasta que el perfil sea revisado por un profesional de salud.
        </div>
      )}

      {/* Cards individuales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {recs.map(r => {
          const product = commercialBlocked ? null : bestProduct(r)
          return (
            <div key={r.component_id ?? r.nombre} style={{
              background: 'white', borderRadius: 'var(--radius-sm)', padding: 16,
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{
                width: 48, height: 48, background: 'var(--green-light)', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0
              }}>{r.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-800)' }}>{r.nombre}</div>
                {r.condicion_display && (
                  <div style={{ fontSize: 11, color: 'var(--green-dark)', fontWeight: 600, background: 'var(--green-light)', borderRadius: 99, padding: '2px 8px', display: 'inline-block', marginBottom: 2 }}>
                    Para: {r.condicion_display}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--gray-400)', margin: '2px 0' }}>{r.razon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-dark)' }}>{r.dosis}</div>
                {r.already_taking && (
                  <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700, marginTop: 4 }}>
                    Ya consumes algo similar — revisar dosis.
                  </div>
                )}
              </div>
              <button onClick={(event) => product ? openProduct(product, event) : verPrecios(r)} style={{
                fontSize: 12, color: 'var(--green)', fontWeight: 700,
                background: 'var(--green-light)', border: 'none',
                borderRadius: 8, padding: '8px 12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
              }}>
                {product ? `${formatPrice(product.price)} →` : 'Ver →'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Sinergias y alertas */}
      {((apiResult?.sinergias?.length > 0) || (apiResult?.alertas?.length > 0)) && (
        <div style={{
          background: 'var(--amber-light)', borderRadius: 'var(--radius-sm)',
          padding: 14, border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            Sinergias y alertas
          </div>
          {(apiResult?.sinergias ?? []).map((s, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 5, lineHeight: 1.5 }}>
              💡 <strong>{s.component_a} + {s.component_b}</strong> · se complementan
            </div>
          ))}
          {(apiResult?.alertas ?? []).map((a, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 5, lineHeight: 1.5 }}>
              ⚠️ <strong>{a.component_a} + {a.component_b}</strong> · tomar con precaución
            </div>
          ))}
        </div>
      )}

      {/* Pack colapsable */}
      {!commercialBlocked && selectedProducts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setPackOpen(o => !o)}
            style={{
              width: '100%', background: 'white', border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-sm)', padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--gray-700)'
            }}
          >
            Ver productos recomendados del pack
            <span style={{ fontSize: 16, color: 'var(--gray-400)' }}>{packOpen ? '▲' : '▼'}</span>
          </button>
          {packOpen && (
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderTop: 'none', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', padding: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedProducts.map(product => (
                  <div key={`${product.component_id}-${product.url}`} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
                    alignItems: 'center', border: '1px solid var(--gray-200)',
                    borderRadius: 10, padding: 12, background: 'var(--gray-50)'
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-800)' }}>{product.commercial_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>{product.pharmacy} · {formatPrice(product.price)}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-600)', marginTop: 2, fontWeight: 700 }}>{verificationLabel(product)}</div>
                      {product.selection_reasons?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {product.selection_reasons.slice(0, 3).map(reason => (
                            <span key={reason} style={{
                              fontSize: 10,
                              color: 'var(--green-dark)',
                              background: 'var(--green-light)',
                              borderRadius: 99,
                              padding: '2px 7px',
                              fontWeight: 700,
                            }}>
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button onClick={(event) => openProduct(product, event)} style={{
                        background: 'var(--green)', color: 'white', border: 'none',
                        borderRadius: 8, padding: '8px 12px', fontSize: 12,
                        fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                      }}>Comprar →</button>
                      {product.product_id && (
                        <button onClick={(event) => { event.stopPropagation(); setReviewProduct(product) }} style={{
                          background: 'white', color: 'var(--green-dark)', border: '1px solid var(--gray-200)',
                          borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                        }}>Reseñar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {reviewProduct && (
                <div style={{ border: '1px solid var(--gray-200)', borderRadius: 10, padding: 12, marginTop: 12, background: 'white' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 8 }}>
                    Reseña de {reviewProduct.commercial_name}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 10 }}>
                    {[1, 2, 3, 4, 5].map(value => (
                      <button key={value} type="button" onClick={() => setReviewRating(value)} style={{
                        border: `1px solid ${reviewRating === value ? 'var(--green)' : 'var(--gray-200)'}`,
                        background: reviewRating === value ? 'var(--green-light)' : 'white',
                        borderRadius: 8, padding: 8, cursor: 'pointer', fontWeight: 800,
                      }}>{value}</button>
                    ))}
                  </div>
                  <textarea value={reviewComment} onChange={event => setReviewComment(event.target.value)}
                    placeholder="Comentario opcional" maxLength={800}
                    style={{ width: '100%', minHeight: 70, border: '1px solid var(--gray-200)', borderRadius: 8, padding: 10, resize: 'vertical', fontFamily: 'inherit', fontSize: 13, marginBottom: 10 }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button className="btn-secondary" type="button" onClick={() => setReviewProduct(null)}>Cancelar</button>
                    <button className="btn-primary" type="button" disabled={reviewSending} onClick={submitProductReview}>
                      {reviewSending ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 10, lineHeight: 1.4 }}>
                Selección balanceada por precio, farmacia y RS validado. No es diagnóstico ni receta.
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-primary dark" onClick={() => goTo('feedback')}>
          ¿Fueron útiles estas recomendaciones?
        </button>
        <button onClick={() => goTo('landing')} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 13, cursor: 'pointer', padding: 4 }}>
          Ir al menú principal
        </button>
      </div>
    </div>
  )
}
