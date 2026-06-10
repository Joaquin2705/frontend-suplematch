import { useEffect } from 'react'
import { postRecommendation } from '../api/suplematch'

const MOCK_RESULT = {
  recommendation_id: 'rec_mock',
  packs_ranked: [],
  conditions: ['DEFICIT_VIT_D', 'BAJA_INMUNIDAD'],
  conditions_display: [
    { code: 'DEFICIT_VIT_D', display_name: 'Déficit de Vitamina D', level: 'Alta prob.',  probability: 0.82, icon_key: 'sun'      },
    { code: 'BAJA_INMUNIDAD', display_name: 'Baja Inmunidad',        level: 'Media prob.', probability: 0.55, icon_key: 'activity' },
  ],
  recommendations: [
    { component_id: 'vit_d', display_name: 'Vitamina D3',  reason: 'Por déficit detectado', dosage_hint: '1000 UI / día', icon_key: 'sun',    products: [] },
    { component_id: 'zinc',  display_name: 'Zinc',         reason: 'Refuerza inmunidad',     dosage_hint: '15 mg / día',   icon_key: 'zap',    products: [] },
    { component_id: 'vit_c', display_name: 'Vitamina C',   reason: 'Potencia el zinc',       dosage_hint: '500 mg / día',  icon_key: 'citrus', products: [] },
  ],
  explainability: [],
  profile_warnings: [],
  safety_level: 'normal',
  safety_actions: [],
  commercial_recommendations_blocked: false,
}

async function callBackend(userData, authToken) {
  const result = await postRecommendation(userData, authToken)
  return normalizeResult(result)
}

function normalizeResult(result) {
  const conditions = result.conditions ?? []
  const conditionsDisplay = result.conditions_display ?? []
  const recommendations = result.recommendations ?? []
  const packsRanked = result.packs_ranked ?? []

  return {
    ...result,
    packs_ranked: packsRanked.map(pack => ({
      ...pack,
      selected_products: normalizeProducts(pack.selected_products ?? []),
    })),
    condiciones: (conditionsDisplay.length ? conditionsDisplay : conditions.map(condition => ({ code: condition }))).map((condition, index) => {
      const expl = (result.explainability ?? []).find(e => e.condition === condition.code)
      return {
        code: condition.code,
        nombre: condition.display_name ?? formatCondition(condition.code),
        nivel: condition.level ?? (index === 0 ? 'Detectado' : 'Relacionado'),
        probabilidad: condition.probability ?? (index === 0 ? 0.82 : 0.55),
        emoji: iconToEmoji(condition.icon_key, index),
        drivers: expl?.drivers ?? [],
      }
    }),
    explainability: result.explainability ?? [],
    recomendaciones: recommendations.map((item, index) => ({
      component_id: item.component_id,
      nombre: item.display_name ?? item.name,
      razon: item.reason ?? item.condition_display ?? 'Recomendado para tu perfil',
      condicion_display: item.condition_display ?? null,
      dosis: item.dosage_hint ?? item.type_display ?? 'Complementario',
      already_taking: Boolean(item.already_taking),
      safety_note: item.safety_note ?? null,
      products: normalizeProducts(item.products ?? []),
      precio: bestProductPrice(item.products) ?? [16, 12, 8, 18, 22][index % 5],
      icon: iconToEmoji(item.icon_key, index),
    })),
    profile_warnings: result.profile_warnings ?? [],
  }
}

function normalizeProducts(products) {
  return products
    .filter(product => product?.url && product?.price != null)
    .map(product => ({
      pharmacy: product.pharmacy,
      product_id: product.product_id,
      commercial_name: product.commercial_name,
      formal_name: product.formal_name,
      registro_sanitario: product.registro_sanitario,
      digemid_producto: product.digemid_producto,
      component_id: product.component_id,
      ingredient: product.ingredient,
      amount: product.amount,
      unit: product.unit,
      amount_mg: product.amount_mg,
      component_match_score: product.component_match_score,
      price: Number(product.price),
      currency: product.currency ?? 'PEN',
      availability: product.availability,
      url: product.url,
      sku: product.sku,
      brand: product.brand,
      regulatory_status: product.regulatory_status,
      product_score: product.product_score,
      review_score: product.review_score,
      review_count: product.review_count ?? 0,
      avg_rating: product.avg_rating,
      selection_reasons: product.selection_reasons ?? [],
      restriction_warnings: product.restriction_warnings ?? [],
      restriction_penalty: product.restriction_penalty ?? 0,
      restriction_boost: product.restriction_boost ?? 0,
      restriction_flags: product.restriction_flags ?? [],
      restriction_flags_verified: product.restriction_flags_verified ?? [],
      restriction_flags_inferred: product.restriction_flags_inferred ?? [],
      label_verified_at: product.label_verified_at,
      label_verification_source: product.label_verification_source,
    }))
}

function bestProductPrice(products = []) {
  const prices = products
    .map(product => Number(product?.price))
    .filter(price => Number.isFinite(price))

  return prices.length ? Math.min(...prices) : null
}

function iconToEmoji(iconKey, fallbackIndex = 0) {
  const icons = {
    activity: '😌',
    check: '✅',
    sun: '☀️',
    bone: '🦴',
    zap: '⚡',
    citrus: '🍊',
    moon: '🌙',
    waves: '🌊',
    pill: '💊',
  }

  return icons[iconKey] ?? ['☀️', '⚡', '🍊', '💊', '🌿'][fallbackIndex % 5]
}

function formatCondition(value) {
  if (!value) return 'Perfil evaluado'
  return value
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function Loading({ goTo, userData, setApiResult, authToken }) {
  useEffect(() => {
    let cancelled = false

    async function run() {
      let result
      try {
        result = await callBackend(userData, authToken)
      } catch {
        result = normalizeResult(MOCK_RESULT)
      }

      if (cancelled) return
      setTimeout(() => {
        if (!cancelled) {
          setApiResult(result)
          goTo('condiciones')
        }
      }, 600)
    }

    run()
    return () => { cancelled = true }
  }, [goTo, userData, setApiResult, authToken])

  return (
    <div className="screen" style={{ background: 'white', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        border: '4px solid var(--gray-200)',
        borderTopColor: 'var(--green)',
        animation: 'spin 1s linear infinite'
      }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 8 }}>
          Analizando tu perfil...
        </div>
        <div style={{ fontSize: 14, color: 'var(--gray-400)' }}>
          Esto puede tomar unos segundos
        </div>
      </div>
    </div>
  )
}
