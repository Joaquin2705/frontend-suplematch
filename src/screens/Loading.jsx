import { useEffect, useState } from 'react'
import { postRecommendation } from '../api/suplematch'
import { useAuth } from '../context/AuthContext'


function validateApiResult(result) {
  if (!result || typeof result !== 'object') throw new Error('La respuesta del servidor no es válida.')
  if (!Array.isArray(result.recomendaciones)) throw new Error('La respuesta no contiene recomendaciones.')
  if (!Array.isArray(result.condiciones)) throw new Error('La respuesta no contiene condiciones de perfil.')
  return result
}

async function callBackend(userData, authToken) {
  const result = await postRecommendation(userData, authToken)
  return validateApiResult(normalizeResult(result))
}

function normalizeResult(result) {
  const conditions = result.conditions ?? []
  const conditionsDisplay = result.conditions_display ?? []
  const recommendations = result.recommendations ?? []
  const packsRanked = result.packs_ranked ?? []
  const conditionResults = normalizeCategorizedResults(result.condition_results ?? [])
  const wellnessPriorities = normalizeCategorizedResults(result.wellness_priorities ?? [])
  const safetyFlags = normalizeCategorizedResults(result.safety_flags ?? [])

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
    condition_results: conditionResults,
    wellness_priorities: wellnessPriorities,
    safety_flags: safetyFlags,
    recomendaciones: recommendations.map((item, index) => ({
      component_id: item.component_id,
      nombre: item.display_name ?? item.name,
      razon: item.reason ?? item.condition_display ?? 'Recomendado para tu perfil',
      condicion_display: item.condition_display ?? null,
      dosis: item.dosage_hint ?? item.type_display ?? 'Complementario',
      already_taking: Boolean(item.already_taking),
      safety_note: item.safety_note ?? null,
      condition_probability: item.condition_probability ?? null,
      evidence_strength: item.evidence_strength ?? null,
      evidence_type: item.evidence_type ?? null,
      evidence_score: item.evidence_score ?? null,
      recommendation_role: item.recommendation_role ?? null,
      requires_lab: item.requires_lab ?? null,
      risk_level: item.risk_level ?? null,
      source_quality: item.source_quality ?? null,
      source_ids: item.source_ids ?? [],
      component_safety_level: item.component_safety_level ?? null,
      interaction_rules: item.interaction_rules ?? [],
      claim_evidence: item.claim_evidence ?? [],
      contraindications: item.contraindications ?? [],
      model2_stage: item.model2_stage ?? null,
      graph_similarity: item.graph_similarity ?? null,
      ranking_reason: item.ranking_reason ?? null,
      recommendation_source: item.recommendation_source ?? null,
      commercial_eligible: item.commercial_eligible ?? true,
      commercial_recommendation_blocked: Boolean(item.commercial_recommendation_blocked),
      commercial_block_reason: item.commercial_block_reason ?? null,
      products: normalizeProducts(item.products ?? []),
      precio: bestProductPrice(item.products) ?? null,
      icon: iconToEmoji(item.icon_key, index),
    })),
    profile_warnings: result.profile_warnings ?? [],
  }
}

function normalizeCategorizedResults(items) {
  if (!Array.isArray(items)) return []
  return items.map((item, index) => ({
    code: item.code,
    nombre: item.display_name ?? formatCondition(item.code),
    kind: item.kind ?? 'context',
    nivel: item.level ?? item.confidence_label ?? 'Contexto',
    probabilidad: item.probability ?? 0,
    emoji: iconForKind(item.kind, item.code, index),
    evidence_group: item.evidence_group,
    confidence_label: item.confidence_label,
    recommendation_strength: item.recommendation_strength,
    benchmark_status: item.benchmark_status,
    validation_source: item.validation_source,
    primary_signal_group: item.primary_signal_group,
    signal_strength: item.signal_strength,
    signal_groups: item.signal_groups ?? {},
    drivers: normalizeConditionDrivers(item.drivers ?? [], item.signal_groups ?? {}),
    missing_data: item.missing_data ?? [],
    model_probability: item.model_probability ?? null,
    rule_score: item.rule_score ?? null,
    calibrated_by_rules: Boolean(item.calibrated_by_rules),
    allowed_for_commercial_recommendation: item.allowed_for_commercial_recommendation,
    requires_disclaimer: item.requires_disclaimer,
    explanation: item.explanation,
  }))
}

function normalizeConditionDrivers(drivers, signalGroups) {
  if (!Array.isArray(drivers)) return []
  return drivers.slice(0, 6).map(driver => {
    if (driver && typeof driver === 'object') return driver
    const feature = String(driver)
    const group = Object.entries(signalGroups || {}).find(([, value]) =>
      Array.isArray(value?.drivers) && value.drivers.includes(feature)
    )?.[0]
    return {
      feature,
      label: feature.replaceAll('_', ' '),
      value: '',
      value_label: formatEvidence(group || 'unknown'),
      impact: group === 'observed_lab' || group === 'medical_safety' ? 'alto' : group === 'declared_diet' || group === 'self_reported_symptoms' ? 'medio' : 'bajo',
    }
  })
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
      image_url: product.image_url,
      image_source: product.image_source,
      image_local_path: product.image_local_path,
      regulatory_status: product.regulatory_status,
      component_traceable: product.component_traceable,
      product_score: product.product_score,
      commercial_score: product.commercial_score,
      commercial_score_version: product.commercial_score_version,
      commercial_score_breakdown: product.commercial_score_breakdown ?? {},
      commercial_quality_flags: product.commercial_quality_flags ?? {},
      commercial_decision: product.commercial_decision,
      component_match_type: product.component_match_type,
      commercial_blocked: Boolean(product.commercial_blocked),
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

function iconForKind(kind, code, fallbackIndex = 0) {
  if (kind === 'safety_flag') return '⚠️'
  if (kind === 'wellness_priority') return '🌿'
  if (code?.includes('OMEGA')) return '🌊'
  if (code?.includes('VIT_D')) return '☀️'
  if (code?.includes('CALCIO') || code?.includes('OSEA')) return '🦴'
  if (code?.includes('B12') || code?.includes('HIERRO')) return '⚡'
  return ['☀️', '⚡', '🍊', '💊', '🌿'][fallbackIndex % 5]
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

function formatEvidence(value) {
  const labels = {
    observed_lab: 'laboratorio',
    medical_safety: 'seguridad médica',
    declared_diet: 'dieta declarada',
    self_reported_symptoms: 'síntomas',
    restrictions: 'restricciones',
    profile_context: 'perfil',
    survey_context: 'encuesta',
    derived_soft_signal: 'señal derivada',
    lab_only: 'laboratorio',
    diet_only: 'dieta',
    safety_only: 'seguridad',
    unknown: 'contexto',
  }
  return labels[value] ?? value
}

export default function Loading({ goTo, userData, setApiResult }) {
  const { authToken } = useAuth()
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!authToken) {
        setError('Inicia sesión para guardar la evaluación en tu cuenta.')
        return
      }
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo de espera agotado. Intenta de nuevo.')), 30_000)
      )
      let result
      try {
        result = await Promise.race([callBackend(userData, authToken), timeout])
      } catch (err) {
        if (!cancelled) setError(err?.message || 'No se pudo conectar con el servidor')
        return
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

  if (error) {
    const needsLogin = error.includes('Inicia sesión')
    return (
      <div className="screen app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="surface" style={{ width: 'min(100%, 520px)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 8 }}>
            Error al obtener recomendaciones
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5 }}>
            {error}
          </div>
        </div>
        <button className="btn-primary" onClick={() => goTo(needsLogin ? 'acceso' : 'encuesta')} style={{ marginTop: 8 }}>
          {needsLogin ? 'Ingresar' : 'Volver a la encuesta'}
        </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="surface" style={{ width: 'min(100%, 520px)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20 }}>
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
      <button
        onClick={() => goTo('encuesta')}
        style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 13, cursor: 'pointer', marginTop: 8 }}
      >
        Cancelar
      </button>
      </div>
    </div>
  )
}
