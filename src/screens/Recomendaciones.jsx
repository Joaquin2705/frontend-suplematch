import { useState, useMemo } from 'react'
import { postFeedback, postProductReview } from '../api/suplematch'
import { useAuth } from '../context/AuthContext'
import Chip from '../components/Chip'
import ProductThumb from '../components/ProductThumb'
import ProductPreviewModal from './ProductPreviewModal'
import {
  FALLBACK,
  formatPrice, verificationLabel, productBlocked,
  commercialScoreLabel, productDescription,
  isProductUserSafe, availableStoresFor, stageInfo, evidenceInfo,
  componentRole, naturalConditionText, naturalReason,
  recommendationInsights, recommendationPriority, humanizeToken,
  isDirectRecommendation,
} from './RecomendacionesUtils'

function buildPacksFromRecs(recommendations, { commercialBlocked, preferredPackSize, hasBudgetMax, budgetMax, alertas }) {
  if (commercialBlocked) return []

  const pairs = []
  const seenComponents = new Set()
  for (const rec of recommendations) {
    if (rec?.commercial_eligible === false) continue
    const product = rec.products?.find(p => isProductUserSafe(p)) ?? null
    if (!product || productBlocked(product)) continue
    if (hasBudgetMax && !Number.isFinite(Number(product.price))) continue
    const componentKey = rec.component_id ?? rec.nombre
    if (seenComponents.has(componentKey)) continue
    seenComponents.add(componentKey)
    pairs.push({ rec, product })
    if (pairs.length >= 12) break
  }

  const pairKey = pair => `${pair.rec?.component_id ?? pair.rec?.nombre}-${pair.product?.product_id ?? pair.product?.url ?? pair.product?.commercial_name}`

  function localPackTotal(items) {
    const total = items.reduce((sum, item) => {
      const price = Number(item.product?.price)
      return Number.isFinite(price) ? sum + price : sum
    }, 0)
    return total > 0 ? total : null
  }

  function localCombinations(items, size, start = 0, picked = []) {
    if (picked.length === size) return [picked]
    const out = []
    for (let i = start; i <= items.length - (size - picked.length); i += 1) {
      out.push(...localCombinations(items, size, i + 1, [...picked, items[i]]))
      if (out.length >= 200) break
    }
    return out
  }

  function localPackHasUnsafePair(items) {
    if (!alertas.length) return false
    const names = items.map(item => String(item.rec?.nombre || '').toLowerCase())
    return alertas.some(alert => {
      const a = String(alert.component_a || '').toLowerCase()
      const b = String(alert.component_b || '').toLowerCase()
      if (!a || !b) return false
      return names.some(name => name.includes(a) || a.includes(name))
        && names.some(name => name.includes(b) || b.includes(name))
    })
  }

  const pickPack = (excluded = new Set()) => {
    const pool = pairs.filter(pair => !excluded.has(pairKey(pair)))
    if (pool.length < preferredPackSize) return null
    if (!hasBudgetMax) return pool.slice(0, preferredPackSize)
    const limit = pool.slice(0, 10)
    for (const items of localCombinations(limit, preferredPackSize)) {
      if (localPackHasUnsafePair(items)) continue
      const total = localPackTotal(items)
      if (total != null && total <= budgetMax) return items
    }
    return null
  }

  const packs = []
  const baseItems = pickPack()
  if (baseItems) {
    packs.push({
      label: 'Pack base',
      reason: hasBudgetMax
        ? `Cubre señales principales sin superar tu presupuesto máximo de ${formatPrice(budgetMax)}.`
        : 'Cubre las señales principales con productos trazables.',
      items: baseItems,
      total: localPackTotal(baseItems),
    })
  }
  const used = new Set(baseItems?.map(pairKey) ?? [])
  const extraItems = pickPack(used)
  if (extraItems) {
    packs.push({
      label: 'Pack complementario',
      reason: hasBudgetMax
        ? `Segunda combinación dentro de ${formatPrice(budgetMax)}.`
        : 'Amplía el soporte si quieres comparar una segunda combinación.',
      items: extraItems,
      total: localPackTotal(extraItems),
    })
  }
  return packs
}

export default function Recomendaciones({ goTo, prevScreen, apiResult, userData, showToast }) {
  const { authToken } = useAuth()
  const recs = apiResult?.recomendaciones ?? apiResult?.recommendations ?? FALLBACK
  const profileWarnings = apiResult?.profile_warnings ?? []
  const safetyLevel = apiResult?.safety_level ?? 'normal'
  const commercialBlocked = Boolean(apiResult?.commercial_recommendations_blocked)
  const [infoRec, setInfoRec] = useState(null)
  const [showComplementary, setShowComplementary] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(null)
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [productPreview, setProductPreview] = useState(null)
  const [productRating, setProductRating] = useState(null)
  const [productReviewSending, setProductReviewSending] = useState(false)
  const budgetMax = Number(userData?.presupuesto_max ?? userData?.budget_max ?? apiResult?.presupuesto_max ?? apiResult?.budget_max)
  const hasBudgetMax = Number.isFinite(budgetMax) && budgetMax > 0
  const preferredPackSize = [3, 5].includes(Number(userData?.preferred_pack_size))
    ? Number(userData.preferred_pack_size)
    : 3
  const hiddenSafetyRecs = commercialBlocked ? [] : recs.filter(isRecommendationHiddenFromMain)
  const actionableRecs = commercialBlocked ? recs.filter(Boolean) : recs.filter(r => !isRecommendationHiddenFromMain(r))
  const sortedRecs = [...actionableRecs].sort((a, b) => recommendationPriority(b) - recommendationPriority(a))
  const initialRecommendationLimit = commercialBlocked
    ? Math.max(3, Math.min(sortedRecs.length, preferredPackSize))
    : preferredPackSize
  const visibleRecs = sortedRecs.slice(0, initialRecommendationLimit)
  const primaryRecs = visibleRecs
  const complementaryRecs = sortedRecs.slice(initialRecommendationLimit)

  function openProduct(product, event) {
    event?.stopPropagation()
    if (!product?.url) return
    window.open(product.url, '_blank', 'noopener,noreferrer')
  }

  function openProductPreview(rec, product, event) {
    event?.stopPropagation()
    if (!product) return
    setProductPreview({ rec, product })
    setProductRating(null)
  }

  function bestProduct(rec) {
    if (commercialBlocked) return null
    return rec.products?.find(product => isProductUserSafe(product)) ?? null
  }

  function isRecommendationHiddenFromMain(rec) {
    if (!rec) return true
    if (commercialBlocked) return false
    if (rec.commercial_recommendation_blocked) return false
    if (rec.commercial_eligible === false) return false
    if (rec.interaction_rules?.some(rule => ['high', 'critical', 'block'].includes(String(rule.severity || '').toLowerCase()))) return true
    if (rec.products?.length > 0 && !rec.products.some(isProductUserSafe)) return true
    return false
  }

  function isRecCommercialEligible(rec) {
    if (commercialBlocked) return false
    return rec?.commercial_eligible !== false
  }

  function commercialBlockReason(rec) {
    if (commercialBlocked) return 'Sugerencia para revisar con un profesional. La compra directa queda desactivada por seguridad.'
    return String(rec?.commercial_block_reason || 'Este componente se muestra solo como referencia, no como producto comercial.')
      .replace(/Perfil crítico:?/gi, 'Perfil requiere revisión profesional:')
      .replace(/productos comerciales/gi, 'compra directa')
  }

  function hiddenReason(rec) {
    if (commercialBlocked) return 'Perfil requiere revisión profesional'
    if (rec?.commercial_block_reason) return rec.commercial_block_reason
    const highInteraction = rec?.interaction_rules?.find(rule => ['high', 'critical', 'block'].includes(String(rule.severity || '').toLowerCase()))
    if (highInteraction?.message) return highInteraction.message
    if (rec?.commercial_eligible === false) return 'se muestra solo como contexto, sin compra directa'
    if (rec?.products?.length > 0 && !rec.products.some(isProductUserSafe)) return 'no encontramos un producto comercial adecuado para mostrar'
    return 'filtro de seguridad aplicado'
  }

  const supplementPacks = useMemo(
    () => buildPacksFromRecs(sortedRecs, { commercialBlocked, preferredPackSize, hasBudgetMax, budgetMax, alertas: apiResult?.alertas ?? [] }),
    [sortedRecs, commercialBlocked, preferredPackSize, hasBudgetMax, budgetMax, apiResult?.alertas],
  )
  const directInfoRecs = useMemo(() => sortedRecs.filter(isDirectRecommendation).slice(0, 8), [sortedRecs])
  const activeInfoRec = infoRec ?? directInfoRecs[0] ?? visibleRecs[0] ?? null
  const withProduct = useMemo(() => {
    if (commercialBlocked) return 0
    return sortedRecs.filter(rec => rec?.commercial_eligible !== false && rec.products?.some(p => isProductUserSafe(p))).length
  }, [sortedRecs, commercialBlocked])
  const summaryText = useMemo(() => {
    if (commercialBlocked) return `${sortedRecs.length} suplemento${sortedRecs.length !== 1 ? 's' : ''} identificado${sortedRecs.length !== 1 ? 's' : ''} para revisar con un profesional.`
    if (withProduct > 0) return `Identificamos ${sortedRecs.length} suplemento${sortedRecs.length !== 1 ? 's' : ''} para tu perfil, con ${withProduct} producto${withProduct !== 1 ? 's' : ''} trazable${withProduct !== 1 ? 's' : ''} disponible${withProduct !== 1 ? 's' : ''}.`
    return `Identificamos ${sortedRecs.length} suplemento${sortedRecs.length !== 1 ? 's' : ''} orientativos basados en tu perfil.`
  }, [sortedRecs, commercialBlocked, withProduct])
  const routineItems = useMemo(() => {
    if (supplementPacks[0]?.items) return supplementPacks[0].items
    return visibleRecs
      .map(rec => ({ rec, product: !commercialBlocked && rec?.commercial_eligible !== false ? rec.products?.find(p => isProductUserSafe(p)) ?? null : null }))
      .filter(item => item.rec)
      .slice(0, Math.min(preferredPackSize, 3))
  }, [supplementPacks, visibleRecs, commercialBlocked, preferredPackSize])

  async function copyResumen() {
    const lines = ['Mis suplementos sugeridos por SupleMatch:\n']
    sortedRecs.forEach((rec, i) => {
      const dosisText = rec.dosis ? ` — ${rec.dosis}` : ''
      lines.push(`${i + 1}. ${rec.nombre}${dosisText}`)
      const reason = naturalReason(rec)
      if (reason) lines.push(`   ${reason}`)
      const product = isRecCommercialEligible(rec) ? bestProduct(rec) : null
      if (product) lines.push(`   Producto: ${product.commercial_name} (${product.pharmacy}) — ${formatPrice(product.price)}`)
      lines.push('')
    })
    lines.push('Generado con SupleMatch · No reemplaza evaluación médica.')
    const text = lines.join('\n')
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      showToast?.('Resumen copiado al portapapeles')
    } catch {
      showToast?.('No se pudo copiar el resumen')
    }
  }

  async function submitQuickFeedback() {
    if (!feedbackRating) {
      showToast?.('Elige una calificación')
      return
    }

    const pack = apiResult?.packs_ranked?.[0]
    const fallbackComponentIds = (apiResult?.recomendaciones ?? apiResult?.recommendations)
      ?.map(item => item.component_id)
      .filter(Boolean) ?? []
    const selectedProducts = pack?.selected_products ?? supplementPacks[0]?.items?.map(item => ({
      product_id: item.product?.product_id ?? null,
      component_id: item.rec?.component_id ?? null,
      commercial_name: item.product?.commercial_name ?? null,
      pharmacy: item.product?.pharmacy ?? null,
      commercial_score: item.product?.commercial_score ?? item.product?.product_score ?? null,
      selection_reasons: item.product?.selection_reasons ?? [],
    })).filter(item => item.commercial_name) ?? []
    const selectedProductIds = selectedProducts.map(product => product.product_id).filter(Boolean)

    setFeedbackSending(true)
    try {
      await postFeedback({
        recommendation_id: apiResult?.recommendation_id ?? 'rec_frontend_quick',
        pack_id: pack?.pack_id,
        component_ids: pack?.component_ids ?? fallbackComponentIds,
        selected_product_ids: selectedProductIds,
        chosen_product_id: selectedProductIds[0] ?? null,
        product_context: { selected_products: selectedProducts },
        rating: feedbackRating,
        conditions: apiResult?.conditions ?? [],
        comment: 'Feedback rápido desde resultados',
      }, authToken)
      showToast?.('Gracias. Registramos tu calificación')
      setFeedbackOpen(false)
    } catch (error) {
      showToast?.(error.message)
    } finally {
      setFeedbackSending(false)
    }
  }

  async function submitProductRating() {
    if (!productPreview?.product) return
    if (!authToken) {
      showToast?.('Inicia sesión para calificar productos')
      return
    }
    if (!productRating) {
      showToast?.('Elige una calificación')
      return
    }
    if (!productPreview.product.product_id) {
      showToast?.('Este producto no tiene ID para registrar reseña')
      return
    }

    setProductReviewSending(true)
    try {
      await postProductReview({
        product_id: productPreview.product.product_id,
        rating: productRating,
        effectiveness_score: productRating,
        price_value_score: productRating,
        source: 'quick_recommendation',
      }, authToken)
      showToast?.('Calificación registrada. Influirá en futuras recomendaciones')
      setProductPreview(null)
    } catch (error) {
      showToast?.(error.message)
    } finally {
      setProductReviewSending(false)
    }
  }

  function renderComponentDetail(rec, product, blockedProduct, stage, insights, eligible) {
    const supports = insights?.supports?.slice(0, 3) ?? []
    const hasWarning = rec.already_taking
      || rec.interaction_rules?.some(rule => ['high', 'critical', 'block'].includes(String(rule.severity || '').toLowerCase()))
      || rec.contraindications?.length > 0

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {supports.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--green-dark)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              Puede ayudarte con
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {supports.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--green)', fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 }}>
            Por qué aparece en tu perfil
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5 }}>
            {naturalReason(rec)}
          </div>
        </div>

        {rec.dosis && (
          <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--green-dark)', fontWeight: 800 }}>
            Referencia de dosis: {rec.dosis}
          </div>
        )}

        {hasWarning && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rec.already_taking && (
              <div style={{ fontSize: 12, color: '#78350F', background: 'var(--amber-light)', borderRadius: 8, padding: '8px 10px', lineHeight: 1.4 }}>
                Ya consumes algo similar — verifica que no dupliques la dosis.
              </div>
            )}
            {rec.interaction_rules?.some(rule => ['high', 'critical', 'block'].includes(String(rule.severity || '').toLowerCase())) && (
              <div style={{ fontSize: 12, color: '#7F1D1D', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 10px', lineHeight: 1.4, fontWeight: 700 }}>
                {rec.interaction_rules.filter(rule => ['high', 'critical', 'block'].includes(String(rule.severity || '').toLowerCase())).map(rule => rule.message).filter(Boolean).join(' · ')}
              </div>
            )}
            {rec.contraindications?.length > 0 && (
              <div style={{ background: 'var(--amber-light)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, color: '#92400E', fontWeight: 850, marginBottom: 5 }}>Precauciones:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {rec.contraindications.slice(0, 4).map(c => (
                    <Chip key={c} color="#92400E" bg="rgba(255,255,255,0.55)">{humanizeToken(c)}</Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
            Producto sugerido
          </div>
          {eligible && product ? (
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, overflow: 'hidden' }}>
              <div
                role="button"
                tabIndex={0}
                onClick={(event) => openProductPreview(rec, product, event)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openProductPreview(rec, product, event) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, cursor: 'pointer', background: 'white' }}
              >
                <ProductThumb product={product} icon={rec.icon ?? '💊'} size={48} label={product.commercial_name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--gray-800)', fontWeight: 850, lineHeight: 1.3 }}>{product.commercial_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{product.pharmacy}</div>
                  <div style={{ fontSize: 13, color: 'var(--green-dark)', fontWeight: 900, marginTop: 3 }}>{formatPrice(product.price)}</div>
                </div>
              </div>
              <button
                type="button"
                disabled={blockedProduct}
                onClick={(event) => openProduct(product, event)}
                style={{
                  width: '100%', border: 'none', borderTop: '1px solid var(--gray-100)', borderRadius: 0,
                  background: blockedProduct ? 'var(--gray-50)' : 'var(--green)',
                  color: blockedProduct ? 'var(--gray-400)' : 'white',
                  padding: '12px', fontSize: 13, fontWeight: 850,
                  cursor: blockedProduct ? 'default' : 'pointer',
                }}
              >
                {blockedProduct ? 'Producto bloqueado' : 'Ver en tienda →'}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#78350F', background: 'var(--amber-light)', borderRadius: 10, padding: '10px 12px', lineHeight: 1.45 }}>
              {commercialBlocked ? 'Revisa este componente con un profesional antes de comprar.' : commercialBlockReason(rec)}
            </div>
          )}
        </div>

        <div style={{ fontSize: 10, color: 'var(--gray-400)', lineHeight: 1.4, textAlign: 'center' }}>
          Sugerencia orientativa · Consulta a un profesional antes de cambiar dosis
        </div>

      </div>
    )
  }

  return (
    <div className="screen app-shell">

      <header className="surface" style={{ gap: 14 }}>
        <button onClick={() => goTo(prevScreen ?? 'condiciones')} className="back-link" type="button">
          ← Volver
        </button>
        <div>
          <div className="app-kicker">SupleMatch encontró</div>
          <h1 className="app-title">Tus suplementos y packs sugeridos</h1>
          <p className="app-subtitle">
            Primero mostramos combinaciones útiles y luego el detalle de cada componente. La recomendación es orientativa y debe revisarse si tienes una condición médica.
          </p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, var(--green-light) 0%, #EAF5FF 100%)',
          border: '1px solid rgba(25,169,116,0.22)', borderRadius: 14, padding: '13px 14px',
        }}>
          <div style={{ fontSize: 14, color: 'var(--gray-800)', fontWeight: 850, lineHeight: 1.4 }}>{summaryText}</div>
          {!commercialBlocked && supplementPacks.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 5 }}>
              {supplementPacks.length} pack{supplementPacks.length !== 1 ? 's' : ''} armado{supplementPacks.length !== 1 ? 's' : ''} · revisa etiquetas antes de comprar.
            </div>
          )}
        </div>
      </header>

      {apiResult?._historical && (
        <div className="alert alert-info" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 15, marginTop: 1 }}>◷</span>
          <div style={{ fontSize: 12, color: '#1D4ED8', lineHeight: 1.45 }}>
            <strong>Recomendación del {new Date(apiResult._historical_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            <div style={{ marginTop: 2 }}>Estás viendo un resultado anterior. Los productos y precios pueden haber cambiado.</div>
          </div>
        </div>
      )}

      {(safetyLevel === 'medical_review_required' || profileWarnings.length > 0) && (
        <div className="alert alert-warn" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 16, marginTop: 1 }}>⚠️</span>
          <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.45, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <strong>{safetyLevel === 'medical_review_required' ? 'Revisión médica requerida' : 'Alertas de seguridad'}</strong>
            <span>Prioriza una recomendación médica profesional antes de comprar, combinar o cambiar dosis.</span>
            {profileWarnings[0] && <span>{profileWarnings[0]}</span>}
          </div>
        </div>
      )}

      {commercialBlocked && (
        <div className="alert alert-warn" style={{ fontSize: 12, color: '#78350F', lineHeight: 1.45 }}>
          ⚠️ Mostramos los suplementos sugeridos para revisar con un profesional. Por tu perfil, dejamos fuera tiendas, precios y compra directa hasta que el caso sea revisado.
        </div>
      )}

      {supplementPacks.length > 0 && (
        <section className="surface">
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--gray-800)' }}>Paquetes sugeridos</div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.45, marginTop: 2, marginBottom: 12 }}>
            Combinaciones Top {preferredPackSize} para apoyar las áreas detectadas. Revisa etiquetas, dosis e interacciones antes de comprar.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {supplementPacks.map(pack => (
              <div key={pack.label} style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 12, background: 'var(--gray-50)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--gray-800)', fontWeight: 900 }}>{pack.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.35, marginTop: 2 }}>{pack.reason}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--green-dark)', fontWeight: 900, whiteSpace: 'nowrap' }}>{formatPrice(pack.total)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {pack.items.map(({ rec, product }) => (
                    <div
                      key={`${rec.component_id}-${product.url}`}
                      role="button"
                      tabIndex={0}
                      onClick={(event) => openProductPreview(rec, product, event)}
                      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openProductPreview(rec, product, event) }}
                      style={{
                        display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: 8, alignItems: 'center',
                        background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10,
                        padding: '9px 10px', cursor: 'pointer',
                      }}
                    >
                      <ProductThumb product={product} icon={rec.icon} size={42} label={product.commercial_name} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--gray-800)', fontWeight: 850, lineHeight: 1.25 }}>{rec.nombre}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.3, marginTop: 2 }}>{product.commercial_name}</div>
                        <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>{product.pharmacy} · {formatPrice(product.price)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => openProduct(product, event)}
                        style={{
                          border: 'none', borderRadius: 8, background: 'var(--green-light)', color: 'var(--green-dark)',
                          padding: '7px 9px', fontSize: 11, fontWeight: 850, cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        Ver en tienda →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {routineItems.length > 0 && (
        <section className="routine-card">
          <div className="section-title">Rutina sugerida</div>
          <p className="section-copy" style={{ marginTop: 4 }}>
            Una forma simple de revisar el pack antes de decidir. No define dosis personalizada.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            <div className="routine-row">
              <div className="routine-icon">1</div>
              <div>
                <strong>Prioriza lo principal</strong>
                <span>{routineItems.slice(0, 2).map(item => item.rec?.nombre).filter(Boolean).join(' + ') || 'Componentes principales'}.</span>
              </div>
            </div>
            <div className="routine-row">
              <div className="routine-icon">2</div>
              <div>
                <strong>Revisa etiquetas</strong>
                <span>Confirma dosis total diaria, ingredientes repetidos y advertencias del envase.</span>
              </div>
            </div>
            <div className="routine-row">
              <div className="routine-icon">3</div>
              <div>
                <strong>Compra con criterio</strong>
                <span>Elige productos trazables y consulta a un profesional si tienes alertas de salud.</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {!commercialBlocked && hiddenSafetyRecs.length > 0 && (
        <div className="alert alert-warn">
          <div style={{ fontSize: 12, color: '#92400E', fontWeight: 850, lineHeight: 1.35 }}>
            Ocultamos {hiddenSafetyRecs.length} sugerencia{hiddenSafetyRecs.length !== 1 ? 's' : ''} por seguridad.
          </div>
          <details style={{ marginTop: 7 }}>
            <summary style={{ fontSize: 11, color: '#92400E', fontWeight: 800, cursor: 'pointer' }}>Ver filtros aplicados</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {hiddenSafetyRecs.slice(0, 6).map(rec => (
                <div key={rec.component_id ?? rec.nombre} style={{ fontSize: 11, color: '#78350F', lineHeight: 1.35 }}>
                  <strong>{rec.nombre}</strong>: {hiddenReason(rec)}
                </div>
              ))}
              {hiddenSafetyRecs.length > 6 && (
                <div style={{ fontSize: 11, color: '#78350F' }}>Hay más filtros aplicados internamente.</div>
              )}
            </div>
          </details>
        </div>
      )}

      <section className="surface" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 16, color: 'var(--gray-800)', fontWeight: 900 }}>Componentes sugeridos</div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.45, marginTop: 2 }}>
            Tus {preferredPackSize} principales primero, luego las complementarias. Toca "Ver más información" para detalles y producto asociado.
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {primaryRecs.length === 0 && (
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: 16, fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.45 }}>
              No hay suplementos para mostrar con la información actual. Revisa tus respuestas o consulta a un profesional antes de comprar.
            </div>
          )}
          {primaryRecs.map((r, recIndex) => {
            const stage = stageInfo(r)
            return (
              <div key={r.component_id ?? r.nombre} className="rec-card-enter" style={{
                background: 'white', borderRadius: 'var(--radius-sm)', padding: 16,
                display: 'flex', alignItems: 'flex-start', gap: 14,
                border: '1px solid var(--gray-200)', boxShadow: '0 10px 26px rgba(15,23,42,0.05)',
                animationDelay: `${recIndex * 0.07}s`,
              }}>
                <div style={{
                  width: 48, height: 48, background: 'var(--green-light)', borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                }}>{r.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gray-800)', overflowWrap: 'break-word' }}>{r.nombre}</div>
                      {r.condicion_display && (
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 3, lineHeight: 1.35, overflowWrap: 'break-word' }}>
                          {naturalConditionText(r.condicion_display)}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setInfoRec(r)}
                      style={{
                        border: '1px solid var(--gray-200)', borderRadius: 8, background: 'white',
                        color: 'var(--gray-700)', padding: '7px 9px', fontSize: 11,
                        fontWeight: 850, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      Ver más información
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '8px 0' }}>
                    <Chip>{componentRole(r)}</Chip>
                    <Chip color={stage.color} bg={stage.bg}>Respaldo {evidenceInfo(r)}</Chip>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.4, overflowWrap: 'break-word' }}>{naturalReason(r)}</div>
                  {r.already_taking && (
                    <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700, marginTop: 4 }}>
                      Ya consumes algo similar: revisa etiqueta y dosis total.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {complementaryRecs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowComplementary(prev => !prev)}
              style={{
                width: '100%', border: '1px dashed var(--gray-300)', borderRadius: 12,
                background: 'var(--gray-50)', color: 'var(--gray-500)',
                padding: '11px 14px', fontSize: 13, fontWeight: 850, cursor: 'pointer', textAlign: 'center',
              }}
            >
              {showComplementary
                ? 'Ocultar complementarias'
                : `+ Ver complementarias${complementaryRecs.length > 5 ? ` (top 5 de ${complementaryRecs.length})` : ` (${complementaryRecs.length})`}`
              }
            </button>
          )}
          {showComplementary && (
            <div className="rec-card-enter" style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', background: 'white', overflow: 'hidden' }}>
              {complementaryRecs.slice(0, 5).map((r, i) => (
                <button
                  key={r.component_id ?? r.nombre}
                  type="button"
                  onClick={() => setInfoRec(r)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', border: 'none', borderTop: i > 0 ? '1px solid var(--gray-100)' : 'none',
                    background: 'white', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, background: 'var(--gray-100)', borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                  }}>{r.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-800)' }}>{r.nombre}</div>
                    {r.condicion_display && (
                      <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 1, lineHeight: 1.3 }}>
                        {naturalConditionText(r.condicion_display)}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 16, color: 'var(--gray-300)', flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {infoRec && activeInfoRec && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.42)', zIndex: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={() => setInfoRec(null)}
        >
          <div
            style={{
              width: 'min(720px, 100%)', maxHeight: '84vh', overflowY: 'auto',
              background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)',
              boxShadow: '0 24px 80px rgba(15,23,42,0.2)', padding: 16,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Componentes recomendados
                </div>
                <div style={{ fontSize: 18, color: 'var(--gray-800)', fontWeight: 900, marginTop: 3 }}>
                  {activeInfoRec.nombre}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInfoRec(null)}
                style={{ border: 'none', background: 'var(--gray-100)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: 'var(--gray-600)' }}
              >×</button>
            </div>

            {directInfoRecs.length > 0 && (
              <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
                {directInfoRecs.map(rec => {
                  const active = (rec.component_id ?? rec.nombre) === (activeInfoRec.component_id ?? activeInfoRec.nombre)
                  return (
                    <button
                      key={rec.component_id ?? rec.nombre}
                      type="button"
                      onClick={() => setInfoRec(rec)}
                      style={{
                        border: `1px solid ${active ? 'var(--green)' : 'var(--gray-200)'}`,
                        background: active ? 'var(--green-light)' : 'white',
                        color: active ? 'var(--green-dark)' : 'var(--gray-700)',
                        borderRadius: 999, padding: '7px 10px', fontSize: 12,
                        fontWeight: 850, whiteSpace: 'nowrap', cursor: 'pointer',
                      }}
                    >
                      {rec.nombre}
                    </button>
                  )
                })}
              </div>
            )}

            {complementaryRecs.some(c => (c.component_id ?? c.nombre) === (activeInfoRec.component_id ?? activeInfoRec.nombre)) && (
              <div style={{
                fontSize: 12, color: 'var(--gray-600)', background: 'var(--gray-50)',
                border: '1px solid var(--gray-200)', borderRadius: 10, padding: '9px 11px',
                lineHeight: 1.45, marginBottom: 4,
              }}>
                Aparece como complementario porque tiene menor prioridad en tu perfil. No es una señal principal, pero puede ser útil según tu contexto específico.
              </div>
            )}
            {renderComponentDetail(
              activeInfoRec,
              isRecCommercialEligible(activeInfoRec) ? bestProduct(activeInfoRec) : null,
              productBlocked(isRecCommercialEligible(activeInfoRec) ? bestProduct(activeInfoRec) : null),
              stageInfo(activeInfoRec),
              recommendationInsights(activeInfoRec),
              isRecCommercialEligible(activeInfoRec),
            )}
          </div>
        </div>
      )}

      <ProductPreviewModal
        preview={productPreview}
        productRating={productRating}
        productReviewSending={productReviewSending}
        onClose={() => setProductPreview(null)}
        onRatingChange={setProductRating}
        onSubmitRating={submitProductRating}
        onOpenProduct={openProduct}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-primary dark" onClick={() => setFeedbackOpen(true)}>
          ¿Fueron útiles estas recomendaciones?
        </button>
        <button
          type="button"
          onClick={copyResumen}
          style={{
            background: 'white', border: '1px solid var(--gray-200)', borderRadius: 999,
            color: 'var(--gray-600)', padding: '11px 14px', fontSize: 13, fontWeight: 850, cursor: 'pointer',
          }}
        >
          Copiar resumen para mi médico
        </button>
        <button onClick={() => goTo('landing')} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 13, cursor: 'pointer', padding: 4 }}>
          Ir al menú principal
        </button>
      </div>

      {((apiResult?.sinergias?.length > 0) || (apiResult?.alertas?.length > 0)) && (
        <div className="alert alert-warn">
          <details>
            <summary style={{ fontSize: 12, fontWeight: 800, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: 0.8, cursor: 'pointer' }}>
              Ver combinaciones y alertas
            </summary>
            <div style={{ marginTop: 9 }}>
              {(apiResult?.sinergias ?? []).slice(0, 8).map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 5, lineHeight: 1.5 }}>
                  <strong>{s.component_a} + {s.component_b}</strong> · se complementan
                </div>
              ))}
              {(apiResult?.alertas ?? []).slice(0, 8).map((a, i) => (
                <div key={i} style={{ fontSize: 12, color: '#92400E', marginBottom: 5, lineHeight: 1.5 }}>
                  <strong>{a.component_a} + {a.component_b}</strong> · revisar antes de combinar
                </div>
              ))}
              {((apiResult?.sinergias?.length ?? 0) + (apiResult?.alertas?.length ?? 0)) > 16 && (
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 6 }}>Se muestran las combinaciones principales.</div>
              )}
            </div>
          </details>
        </div>
      )}

      {feedbackOpen && (
        <div className="feedback-overlay" role="dialog" aria-modal="true" onClick={() => setFeedbackOpen(false)}>
          <div className="feedback-sheet" onClick={(event) => event.stopPropagation()}>
            <div style={{ width: 42, height: 4, borderRadius: 99, background: 'var(--gray-200)', margin: '0 auto 14px' }} />
            <div className="section-title">Califica tu recomendación</div>
            <p className="section-copy" style={{ marginTop: 6 }}>
              Tu respuesta ayuda a ajustar futuras recomendaciones y productos. No cambia tus resultados actuales.
            </p>
            <div className="rating-row" aria-label="Calificación rápida">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  className={`rating-button ${feedbackRating === value ? 'is-active' : ''}`}
                  onClick={() => setFeedbackRating(value)}
                  aria-pressed={feedbackRating === value}
                >
                  {value}
                </button>
              ))}
            </div>
            <button className="btn-primary" type="button" onClick={submitQuickFeedback} disabled={feedbackSending}>
              {feedbackSending ? 'Enviando...' : 'Enviar calificación'}
            </button>
            <button className="btn-secondary" type="button" onClick={() => goTo('feedback')} style={{ width: '100%', marginTop: 10 }}>
              Dar feedback detallado
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
