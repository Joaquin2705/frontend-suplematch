import { postSurveyEvents } from './suplematch'
import surveyContract from '../data/surveyContract.json'

/**
 * Embudo de la encuesta: qué pasos se ven, se completan y dónde se abandona. Alimenta `survey_step_events`
 * en el backend (GET /api/v1/survey/funnel) para decidir con datos qué preguntas sobran.
 *
 * Reglas:
 * - Fire-and-forget: nunca lanza, nunca muestra toasts, nunca retrasa la UI.
 * - Solo envía la clave del paso y su posición, nunca respuestas.
 * - Una sesión por encuesta (sessionStorage); se renueva al enviar.
 */

const SESSION_KEY = 'suplematch_survey_session'
const FLUSH_DELAY_MS = 1500
const MAX_BATCH = 100
let queue = []
let flushTimer = null
let lastToken = null

function newSessionId() {
  return `sv_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`}`
}

export function surveySessionId() {
  try {
    let value = sessionStorage.getItem(SESSION_KEY)
    if (!value) {
      value = newSessionId()
      sessionStorage.setItem(SESSION_KEY, value)
    }
    return value
  } catch {
    return newSessionId()
  }
}

export function resetSurveySession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Ignore browsers that block sessionStorage.
  }
}

function flush() {
  flushTimer = null
  if (queue.length === 0) return
  const events = queue.slice(0, MAX_BATCH)
  queue = queue.slice(MAX_BATCH)
  postSurveyEvents({ events }, lastToken).catch(() => {})
  if (queue.length > 0) flushTimer = setTimeout(flush, FLUSH_DELAY_MS)
}

export function trackSurveyStep(eventType, stepKey, { position = null, visibleSteps = null, token = null } = {}) {
  try {
    if (!stepKey) return
    lastToken = token
    queue.push({
      survey_session_id: surveySessionId(),
      step_key: stepKey,
      event_type: eventType,
      position: Number.isInteger(position) && position >= 0 ? position : null,
      visible_steps: Number.isInteger(visibleSteps) && visibleSteps >= 0 ? visibleSteps : null,
      contract_version: surveyContract.version ?? null,
    })
    if (eventType === 'submit') {
      if (flushTimer) clearTimeout(flushTimer)
      flush()
      return
    }
    if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_DELAY_MS)
  } catch {
    // La telemetría nunca debe romper la encuesta.
  }
}
