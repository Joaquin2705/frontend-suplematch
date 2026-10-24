import { postRecommendationEvents } from './suplematch'

/**
 * Telemetria del recomendador: que se mostro, en que posicion, que se abrio, que se compro y que se
 * siguio tomando. Alimenta `recommendation_events` en el backend (ver docs/recommender_events.md) para
 * pasar de un rating 1-5 a una recompensa real y, con volumen, a un bandit contextual.
 *
 * Reglas:
 * - Fire-and-forget: nunca lanza, nunca muestra toasts, nunca retrasa la UI.
 * - Solo envia si hay un recommendation_id real del backend (los ids 'rec_frontend_*' son demo).
 * - Las impresiones se deduplican en memoria por sesion para no inflar la base.
 * - Usuario anonimo: se envia un anonymous_session_id estable por navegador.
 */

const ANON_KEY = 'suplematch_anon_session'
const MAX_BATCH = 50
const sentImpressions = new Set()
let queue = []
let flushTimer = null

export function anonymousSessionId() {
  try {
    let value = localStorage.getItem(ANON_KEY)
    if (!value) {
      value = `anon_${(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`)}`
      localStorage.setItem(ANON_KEY, value)
    }
    return value
  } catch {
    return null
  }
}

export function isTrackableRecommendationId(recommendationId) {
  if (!recommendationId || typeof recommendationId !== 'string') return false
  return !recommendationId.startsWith('rec_frontend')
}

/** pack_key del primer pack del backend; los packs armados en el frontend no tienen clave propia. */
export function primaryPackKey(apiResult) {
  return apiResult?.packs_ranked?.[0]?.pack_id ?? apiResult?.packs?.[0]?.pack_key ?? null
}

function conditionsOf(apiResult) {
  const conditions = apiResult?.conditions ?? []
  return Array.isArray(conditions) ? conditions.slice(0, 20).map(String) : []
}

function buildEvent(apiResult, { eventType, componentId = null, productId = null, position = null, packKey, payload = {} }) {
  return {
    recommendation_id: apiResult.recommendation_id,
    event_type: eventType,
    pack_key: packKey === undefined ? primaryPackKey(apiResult) : packKey,
    component_id: componentId ?? null,
    product_id: productId ?? null,
    position: Number.isInteger(position) && position >= 0 ? position : null,
    conditions: conditionsOf(apiResult),
    payload: { source: 'frontend', ...payload },
  }
}

/** Encola un evento. `position` es el rank mostrado (1 = primero). */
export function trackEvent(apiResult, event, token = null) {
  if (!isTrackableRecommendationId(apiResult?.recommendation_id)) return false
  const built = buildEvent(apiResult, event)
  if (built.event_type === 'impression') {
    const key = [built.recommendation_id, built.pack_key, built.component_id, built.product_id, built.position].join('|')
    if (sentImpressions.has(key)) return false
    sentImpressions.add(key)
  }
  queue.push({ event: built, token })
  scheduleFlush()
  return true
}

/** Impresiones de una lista de recomendaciones visibles, con su rank. */
export function trackImpressions(apiResult, recs, token = null) {
  if (!Array.isArray(recs)) return 0
  let count = 0
  recs.forEach((rec, index) => {
    if (!rec) return
    const ok = trackEvent(apiResult, {
      eventType: 'impression',
      componentId: rec.component_id ?? null,
      position: index + 1,
      payload: { ui: 'recomendaciones', component_name: rec.nombre ?? null },
    }, token)
    if (ok) count += 1
  })
  return count
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flush()
  }, 400)
}

export async function flush() {
  if (queue.length === 0) return
  const pending = queue
  queue = []
  // Un lote por token (anonimo vs autenticado) y por recommendation_id para respetar el 404 por id.
  const groups = new Map()
  for (const item of pending) {
    const key = `${item.token ?? ''}|${item.event.recommendation_id}`
    if (!groups.has(key)) groups.set(key, { token: item.token, events: [] })
    groups.get(key).events.push(item.event)
  }
  for (const { token, events } of groups.values()) {
    for (let start = 0; start < events.length; start += MAX_BATCH) {
      const body = { events: events.slice(start, start + MAX_BATCH) }
      const anon = anonymousSessionId()
      if (anon) body.anonymous_session_id = anon
      try {
        await postRecommendationEvents(body, token)
      } catch {
        // Telemetria: si falla (sin red, 404 de id demo, backend caido) se descarta en silencio.
      }
    }
  }
}

/** Solo para pruebas: olvida impresiones ya enviadas. */
export function resetTrackingForTests() {
  sentImpressions.clear()
  queue = []
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
}
