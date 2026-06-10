import { useMemo, useState, useCallback, useRef } from 'react'
import surveyContract from '../contracts/surveyContract.json'

const SYMPTOM_FIELDS = {
  dolor_muscular: 'dolor_muscular',
  dolor_articular: 'dolor_articular',
  niebla_mental: 'niebla_mental',
  caida_cabello: 'caida_cabello',
  piel_seca: 'piel_seca',
  unas_quebradizas: 'unas_quebradizas',
  calambres: 'calambres',
}

const QUESTIONS = [
  {
    key: 'edad_rango',
    title: '¿En qué rango de edad estás?',
    sub: 'La edad cambia el riesgo relativo de algunos déficits. No reemplaza análisis clínicos.',
    type: 'single',
    required: true,
    options: [
      { label: 'Menos de 18 años', value: 'menos_18', detail: 'Requiere supervisión profesional.' },
      { label: '18 a 30 años', value: '18_30', detail: 'Adulto joven.' },
      { label: '31 a 50 años', value: '31_50', detail: 'Adulto.' },
      { label: '51 años o más', value: 'mas_50', detail: 'Mayor riesgo de salud ósea y vitamina D.' },
    ],
  },
  {
    key: 'sexo',
    title: '¿Qué sexo quieres usar para esta evaluación?',
    sub: 'Se usa solo como señal del modelo. Puedes omitirlo si prefieres.',
    type: 'single',
    required: true,
    options: [
      { label: 'Femenino', value: 'femenino', detail: 'Usar referencia femenina.' },
      { label: 'Masculino', value: 'masculino', detail: 'Usar referencia masculina.' },
      { label: 'Prefiero no decir', value: 'prefiero_no_decir', detail: 'Usar configuración neutra del sistema.' },
    ],
  },
  {
    key: 'peso_rango',
    title: '¿Cuánto pesas aproximadamente?',
    sub: 'Ayuda a ajustar referencias del modelo. No se almacena con tu nombre.',
    type: 'single',
    required: true,
    options: [
      { label: 'Menos de 50 kg', value: 'menos_50', detail: 'Peso bajo.' },
      { label: '50 a 65 kg',     value: '50_65',    detail: 'Peso medio-bajo.' },
      { label: '66 a 80 kg',     value: '66_80',    detail: 'Peso medio-alto.' },
      { label: 'Más de 80 kg',   value: 'mas_80',   detail: 'Peso alto.' },
    ],
  },
  {
    key: 'talla_rango',
    title: '¿Cuánto mides aproximadamente?',
    sub: 'Se usa como referencia junto al peso.',
    type: 'single',
    required: true,
    options: [
      { label: 'Menos de 155 cm', value: 'menos_155', detail: 'Talla baja.' },
      { label: '155 a 165 cm',    value: '155_165',   detail: 'Talla media-baja.' },
      { label: '166 a 175 cm',    value: '166_175',   detail: 'Talla media-alta.' },
      { label: 'Más de 175 cm',   value: 'mas_175',   detail: 'Talla alta.' },
    ],
  },
  {
    key: 'tipo_dieta',
    title: '¿Qué patrón de alimentación sigues?',
    sub: 'Ayuda a detectar riesgos como B12, hierro, calcio u omega 3.',
    type: 'single',
    required: true,
    options: [
      { label: 'Omnívora', value: 'omnivoro', detail: 'Incluye alimentos animales y vegetales.' },
      { label: 'Pescetariana', value: 'pescetariano', detail: 'Incluye pescado, pero poca o ninguna carne.' },
      { label: 'Vegetariana', value: 'vegetariano', detail: 'No incluye carne ni pescado.' },
      { label: 'Vegana', value: 'vegano', detail: 'No incluye alimentos de origen animal.' },
    ],
  },
  {
    key: 'dieta',
    title: '¿Qué tan variada fue tu alimentación en las últimas 2 semanas?',
    sub: 'Piensa en frutas, verduras, proteínas, granos y grasas saludables.',
    type: 'single',
    required: true,
    options: [
      { label: 'Poco variada', value: 'poco_variada', detail: 'Pocas fuentes de nutrientes o comidas repetidas.' },
      { label: 'Regular', value: 'regular', detail: 'Algo variada, pero con vacíos frecuentes.' },
      { label: 'Bastante variada', value: 'bastante_variada', detail: 'Incluye varios grupos de alimentos.' },
      { label: 'Muy balanceada', value: 'muy_balanceada', detail: 'Variada y consistente la mayoría de días.' },
    ],
  },
  {
    key: 'exposicion_solar',
    title: '¿Cuánta exposición solar directa tienes al día?',
    sub: 'Cuenta exposición en brazos, piernas o rostro, no solo estar cerca de una ventana.',
    type: 'single',
    required: true,
    options: [
      { label: 'Menos de 15 minutos', value: 'menos_15min', detail: 'Exposición baja.' },
      { label: '15 a 30 minutos', value: '15_30min', detail: 'Exposición moderada.' },
      { label: '30 a 60 minutos', value: '30_60min', detail: 'Exposición suficiente para muchas personas.' },
      { label: 'Más de 1 hora', value: 'mas_1h', detail: 'Exposición alta.' },
    ],
  },
  {
    key: 'frecuencia_ejercicio',
    title: '¿Con qué frecuencia haces actividad física?',
    sub: 'Incluye caminar rápido, gimnasio, deporte o entrenamiento estructurado.',
    type: 'single',
    required: true,
    options: [
      { label: 'Casi nunca', value: 'casi_nunca', detail: 'Menos de una vez por semana.' },
      { label: '1 a 2 veces por semana', value: '1_2_semana', detail: 'Actividad ligera o moderada.' },
      { label: '3 a 4 veces por semana', value: '3_4_semana', detail: 'Actividad regular.' },
      { label: 'Diario o casi diario', value: 'diario', detail: 'Actividad alta o entrenamiento frecuente.' },
    ],
  },
  {
    key: 'fatiga',
    title: '¿Con qué frecuencia sientes fatiga durante el día?',
    sub: 'No cuentes cansancio normal después de una mala noche aislada.',
    type: 'single',
    required: true,
    options: [
      { label: 'Casi nunca', value: 'casi_nunca', detail: 'Energía estable la mayoría de días.' },
      { label: 'A veces', value: 'a_veces', detail: 'Aparece algunos días.' },
      { label: 'A menudo', value: 'a_menudo', detail: 'Afecta varias actividades semanales.' },
      { label: 'Siempre', value: 'siempre', detail: 'Presente casi todos los días.' },
    ],
  },
  {
    key: 'horas_sueno',
    title: '¿Cuántas horas duermes normalmente?',
    sub: 'Usa tu promedio de una semana típica.',
    type: 'single',
    required: true,
    options: [
      { label: 'Menos de 5 horas', value: 'menos_5h', detail: 'Sueño muy corto.' },
      { label: '5 a 7 horas', value: '5_7h', detail: 'Sueño reducido.' },
      { label: '7 a 9 horas', value: '7_9h', detail: 'Rango habitual recomendado para adultos.' },
      { label: 'Más de 9 horas', value: 'mas_9h', detail: 'Sueño prolongado.' },
    ],
  },
  {
    key: 'frecuencia_enfermedad',
    title: '¿Con qué frecuencia te enfermas de resfríos o infecciones leves?',
    sub: 'Usa el último año como referencia.',
    type: 'single',
    required: true,
    options: [
      { label: 'Casi nunca', value: 'casi_nunca', detail: 'Rara vez.' },
      { label: '1 a 2 veces al año', value: '1_2_anio', detail: 'Frecuencia baja.' },
      { label: '3 a 4 veces al año', value: '3_4_anio', detail: 'Frecuencia moderada.' },
      { label: 'Muy seguido', value: 'muy_seguido', detail: 'Más de 4 veces al año o recuperación lenta.' },
    ],
  },
  {
    key: 'estres',
    title: '¿Qué nivel de estrés o irritabilidad tienes últimamente?',
    sub: 'Considera las últimas 2 semanas, no un evento puntual.',
    type: 'single',
    required: true,
    options: [
      { label: 'Bajo', value: 'bajo', detail: 'Manejable la mayoría de días.' },
      { label: 'Moderado', value: 'moderado', detail: 'Presente, pero no domina tu rutina.' },
      { label: 'Alto', value: 'alto', detail: 'Interfiere con sueño, concentración o ánimo.' },
      { label: 'Muy alto', value: 'muy_alto', detail: 'Persistente o difícil de controlar.' },
    ],
  },
  {
    key: 'sintomas',
    title: '¿Qué señales has notado recientemente?',
    sub: 'Selecciona solo síntomas frecuentes o repetidos. Si no aplica, marca la primera opción.',
    type: 'multi',
    required: true,
    noneValue: 'ninguno',
    options: [
      { label: 'Ninguno de estos', value: 'ninguno', detail: 'No usar señales adicionales.' },
      { label: 'Dolor muscular frecuente', value: 'dolor_muscular', detail: 'Molestias sin causa clara o recuperación lenta.' },
      { label: 'Dolor articular', value: 'dolor_articular', detail: 'Molestias en articulaciones.' },
      { label: 'Niebla mental o baja concentración', value: 'niebla_mental', detail: 'Dificultad para enfocarte.' },
      { label: 'Caída de cabello', value: 'caida_cabello', detail: 'Más de lo habitual.' },
      { label: 'Piel seca', value: 'piel_seca', detail: 'Persistente, no solo por clima.' },
      { label: 'Uñas quebradizas', value: 'unas_quebradizas', detail: 'Se rompen o descaman.' },
      { label: 'Calambres', value: 'calambres', detail: 'Frecuentes o repetidos.' },
    ],
  },
  {
    key: 'objetivos',
    title: '¿Qué quieres priorizar?',
    sub: 'Elige hasta 4 objetivos. Sirve para ordenar recomendaciones cuando hay varias opciones.',
    type: 'multi',
    max: 4,
    options: [
      { label: 'Energía', value: 'energia', detail: 'Menos cansancio diario.' },
      { label: 'Inmunidad', value: 'inmunidad', detail: 'Soporte ante resfríos frecuentes.' },
      { label: 'Sueño', value: 'suenio', detail: 'Mejor descanso.' },
      { label: 'Rendimiento físico', value: 'rendimiento', detail: 'Entrenamiento o recuperación.' },
      { label: 'Salud ósea', value: 'salud_osea', detail: 'Huesos, calcio o vitamina D.' },
      { label: 'Cabello, piel y uñas', value: 'cabello_piel_unas', detail: 'Señales visibles.' },
      { label: 'Estrés', value: 'estres', detail: 'Relajación y balance.' },
    ],
  },
  {
    key: 'alcohol',
    title: '¿Con qué frecuencia consumes alcohol?',
    sub: 'Ayuda a estimar demanda nutricional y hábitos de recuperación.',
    type: 'single',
    required: true,
    options: [
      { label: 'Nunca', value: 'nunca', detail: 'No consumes alcohol.' },
      { label: 'Raro', value: 'raro', detail: 'Menos de una vez al mes.' },
      { label: 'Ocasional', value: 'ocasional', detail: 'Algunas veces al mes.' },
      { label: 'Frecuente', value: 'frecuente', detail: 'Semanal o más.' },
    ],
  },
  {
    key: 'toma_suplementos',
    title: '¿Actualmente tomas suplementos?',
    sub: 'Esto es obligatorio para evitar duplicar dosis o recomendar algo que ya consumes.',
    type: 'single',
    required: true,
    options: [
      { label: 'No tomo suplementos', value: 'no', detail: 'No consumes suplementos actualmente.' },
      { label: 'Sí tomo suplementos', value: 'si', detail: 'Indicarás cuáles en el siguiente paso.' },
    ],
  },
  {
    key: 'suplementos_actuales',
    title: '¿Cuáles consumes actualmente?',
    sub: 'Selecciona todos los que tomas al menos una vez por semana.',
    type: 'multi',
    required: true,
    when: answers => answers.toma_suplementos === 'si',
    options: [
      { label: 'Vitamina D', value: 'vitamina_d', detail: 'Incluye D3 o colecalciferol.' },
      { label: 'Calcio', value: 'calcio', detail: 'Calcio solo o combinado.' },
      { label: 'Magnesio', value: 'magnesio', detail: 'Citrato, glicinato u otros.' },
      { label: 'Zinc', value: 'zinc', detail: 'Zinc solo o en multivitamínico.' },
      { label: 'Vitamina C', value: 'vitamina_c', detail: 'Ácido ascórbico u otros.' },
      { label: 'Hierro', value: 'hierro', detail: 'Solo si lo usas actualmente.' },
      { label: 'Omega 3', value: 'omega_3', detail: 'EPA/DHA o aceite de pescado.' },
      { label: 'Multivitamínico', value: 'multivitaminico', detail: 'Fórmula con varios nutrientes.' },
      { label: 'Proteína', value: 'proteina', detail: 'Whey, vegetal u otra.' },
      { label: 'Otro suplemento', value: 'otro', detail: 'No listado arriba.' },
    ],
  },
  {
    key: 'restricciones',
    title: '¿Tienes alergias o restricciones relevantes?',
    sub: 'No diagnostica alergias. Sirve para mostrar advertencias y revisar etiquetas.',
    type: 'multi',
    required: true,
    noneValue: 'sin_restricciones',
    options: [
      { label: 'Sin restricciones conocidas', value: 'sin_restricciones', detail: 'No aplicar alertas por excipientes.' },
      { label: 'Alergia a lácteos', value: 'alergia_lacteos', detail: 'Cuidado con suero de leche y excipientes.' },
      { label: 'Alergia a soya', value: 'alergia_soya', detail: 'Revisar excipientes.' },
      { label: 'Alergia a pescado o mariscos', value: 'alergia_pescado_mariscos', detail: 'Revisar omega 3 de origen marino.' },
      { label: 'Evito gelatina', value: 'evita_gelatina', detail: 'Cuidado con cápsulas blandas.' },
      { label: 'Sin gluten', value: 'sin_gluten', detail: 'Verificar declaración del fabricante.' },
    ],
  },
  {
    key: 'condiciones_seguridad',
    title: '¿Alguna condición requiere precaución?',
    sub: 'Si aplica, el resultado incluirá advertencias. No reemplaza evaluación médica.',
    type: 'multi',
    required: true,
    noneValue: 'ninguna',
    options: [
      { label: 'Ninguna de estas', value: 'ninguna', detail: 'No declarar condiciones de esta lista.' },
      { label: 'Embarazo o lactancia', value: 'embarazo_lactancia', detail: 'Requiere validación profesional.' },
      { label: 'Enfermedad renal', value: 'enfermedad_renal', detail: 'Cuidado con minerales y dosis.' },
      { label: 'Enfermedad hepática', value: 'enfermedad_hepatica', detail: 'Cuidado con metabolismo y dosis.' },
      { label: 'Uso anticoagulantes', value: 'anticoagulantes', detail: 'Riesgo de interacciones.' },
      { label: 'Medicación crónica', value: 'medicacion_cronica', detail: 'Revisar interacciones.' },
    ],
  },
  {
    key: 'presupuesto',
    title: '¿Cuánto quieres gastar en suplementos?',
    sub: 'Arrastra los controles para indicar tu rango de precio mensual en soles. El sistema priorizará productos dentro de este rango.',
    type: 'price_range',
    required: false,
    min: 0,
    max: 500,
    step: 10,
  },
]

function PriceRangeQuestion({ q, answers, onChange }) {
  const stored = answers[q.key] || {}
  const rangeMin = q.min ?? 0
  const rangeMax = q.max ?? 500
  const step = q.step ?? 10

  const currentMin = stored.min ?? rangeMin
  const currentMax = stored.max ?? rangeMax
  const hasPreference = stored.min != null || stored.max != null

  const trackRef = useRef(null)
  const draggingRef = useRef(null)

  const pct = (val) => ((val - rangeMin) / (rangeMax - rangeMin)) * 100

  function snapToStep(raw) {
    return Math.round(raw / step) * step
  }

  function valueFromPointer(clientX) {
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return snapToStep(rangeMin + ratio * (rangeMax - rangeMin))
  }

  function handlePointerDown(e) {
    const val = valueFromPointer(e.clientX)
    const distMin = Math.abs(val - currentMin)
    const distMax = Math.abs(val - currentMax)
    draggingRef.current = distMin <= distMax ? 'min' : 'max'
    e.currentTarget.setPointerCapture(e.pointerId)
    applyDrag(val)
  }

  function handlePointerMove(e) {
    if (!draggingRef.current) return
    applyDrag(valueFromPointer(e.clientX))
  }

  function handlePointerUp() {
    draggingRef.current = null
  }

  function applyDrag(val) {
    if (draggingRef.current === 'min') {
      onChange({ min: Math.min(val, currentMax - step), max: currentMax })
    } else {
      onChange({ min: currentMin, max: Math.max(val, currentMin + step) })
    }
  }

  const thumbStyle = {
    position: 'absolute',
    top: '50%',
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: hasPreference ? 'var(--green)' : 'var(--gray-400)',
    border: '3px solid white',
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 2,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, paddingTop: 8 }}>
      <div style={{
        background: hasPreference ? 'var(--green-light)' : 'var(--gray-50)',
        border: `2px solid ${hasPreference ? 'var(--green)' : 'var(--gray-200)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '16px 20px',
        textAlign: 'center',
      }}>
        {hasPreference ? (
          <>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--green-dark)' }}>
              S/ {currentMin} – S/ {currentMax}
            </span>
            <p style={{ fontSize: 12, color: 'var(--gray-600)', margin: '4px 0 0 0' }}>
              rango mensual en soles
            </p>
          </>
        ) : (
          <span style={{ fontSize: 15, color: 'var(--gray-400)' }}>Sin preferencia de precio</span>
        )}
      </div>

      <div style={{ padding: '0 12px' }}>
        <div
          ref={trackRef}
          style={{ position: 'relative', height: 40, cursor: 'pointer', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Track base */}
          <div style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: 0,
            right: 0,
            height: 6,
            background: 'var(--gray-200)',
            borderRadius: 3,
          }} />
          {/* Active range */}
          <div style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: `${pct(currentMin)}%`,
            right: `${100 - pct(currentMax)}%`,
            height: 6,
            background: hasPreference ? 'var(--green)' : 'var(--gray-300)',
            borderRadius: 3,
            transition: 'background 0.2s',
          }} />
          {/* Thumb min */}
          <div style={{ ...thumbStyle, left: `${pct(currentMin)}%` }} />
          {/* Thumb max */}
          <div style={{ ...thumbStyle, left: `${pct(currentMax)}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
          <span>S/ {rangeMin}</span>
          <span>S/ {rangeMax}</span>
        </div>
      </div>

      {hasPreference && (
        <button
          type="button"
          onClick={() => onChange({})}
          style={{
            background: 'none',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 16px',
            fontSize: 12,
            color: 'var(--gray-500)',
            cursor: 'pointer',
            alignSelf: 'center',
          }}
        >
          Quitar preferencia de precio
        </button>
      )}
    </div>
  )
}

function validateQuestionContract() {
  const enums = surveyContract.enums || {}
  const mismatches = []

  for (const question of QUESTIONS) {
    if (question.type === 'price_range') continue
    const allowedValues = enums[question.key]
    if (!allowedValues) continue

    const allowed = new Set(allowedValues)
    for (const option of question.options) {
      if (!allowed.has(option.value)) {
        mismatches.push(`${question.key}.${option.value}`)
      }
    }
  }

  if (mismatches.length > 0) {
    throw new Error(`Contrato de encuesta desalineado: ${mismatches.join(', ')}`)
  }
}

validateQuestionContract()

function visibleQuestions(answers) {
  return QUESTIONS.filter(q => !q.when || q.when(answers))
}

function normalizeMultiSelection(q, current, value) {
  const selected = current.includes(value)
  if (q.noneValue && value === q.noneValue) {
    return selected ? [] : [value]
  }

  let next = selected ? current.filter(item => item !== value) : [...current, value]
  if (q.noneValue) {
    next = next.filter(item => item !== q.noneValue)
  }
  if (q.max && next.length > q.max) {
    return current
  }
  return next
}

function buildPayload(answers) {
  const payload = {}
  for (const q of QUESTIONS) {
    if (q.when && !q.when(answers)) continue
    const value = answers[q.key]
    if (value === undefined) continue

    if (q.key === 'sintomas') {
      for (const field of Object.values(SYMPTOM_FIELDS)) {
        payload[field] = value.includes(field) ? 'frecuente' : 'nunca'
      }
      continue
    }

    if (q.type === 'price_range') {
      if (value && typeof value === 'object') {
        if (value.min != null) payload.presupuesto_min = value.min
        if (value.max != null) payload.presupuesto_max = value.max
      }
      continue
    }

    payload[q.key] = value
  }

  if (payload.toma_suplementos === 'no') {
    payload.suplementos_actuales = []
  }
  try {
    const labResults = JSON.parse(localStorage.getItem('suplematch_lab_results') || '[]')
    if (Array.isArray(labResults) && labResults.length > 0) {
      payload.lab_results = labResults.slice(0, 40)
    }
  } catch {
    // Ignore invalid localStorage data.
  }
  if (!payload.objetivos) payload.objetivos = []
  return payload
}

function answerIsValid(q, answers) {
  const value = answers[q.key]
  if (!q.required) return true
  if (q.type === 'price_range') return true
  if (q.type === 'single') return value !== undefined
  return Array.isArray(value) && value.length > 0
}

function answerLabel(q, answers) {
  const value = answers[q.key]

  if (q.type === 'price_range') {
    if (!value || typeof value !== 'object') return 'Sin preferencia'
    const { min, max } = value
    if (min == null && max == null) return 'Sin preferencia'
    if (min != null && max != null) return `S/ ${min} – S/ ${max}`
    if (max != null) return `Hasta S/ ${max}`
    return `Desde S/ ${min}`
  }

  if (value === undefined) return 'Sin responder'

  if (q.type === 'single') {
    return q.options.find(opt => opt.value === value)?.label || String(value)
  }

  if (!Array.isArray(value) || value.length === 0) return 'Sin responder'
  const labels = value.map(item => q.options.find(opt => opt.value === item)?.label || item)
  return labels.join(', ')
}

function safetyAlerts(answers) {
  const alerts = []
  const conditions = answers.condiciones_seguridad || []

  if (answers.edad_rango === 'menos_18') {
    alerts.push('Menor de edad: requiere supervisión de un adulto y profesional de salud antes de usar suplementos.')
  }
  if (conditions.includes('embarazo_lactancia')) {
    alerts.push('Embarazo o lactancia: no inicies suplementos sin validación profesional.')
  }
  if (conditions.includes('anticoagulantes')) {
    alerts.push('Uso de anticoagulantes: revisa interacciones, especialmente con omega 3, vitamina K y fórmulas herbales.')
  }
  if (conditions.includes('enfermedad_renal')) {
    alerts.push('Enfermedad renal: evita minerales o dosis altas sin control médico.')
  }
  if (conditions.includes('enfermedad_hepatica')) {
    alerts.push('Enfermedad hepática: revisa seguridad y dosis con un profesional antes de tomar suplementos.')
  }
  if (conditions.includes('medicacion_cronica')) {
    alerts.push('Medicación crónica: confirma posibles interacciones antes de iniciar cualquier suplemento.')
  }

  return alerts
}

export default function Encuesta({ goTo, showToast, setUserData }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('suplematch_encuesta_answers')) || {} } catch { return {} }
  })
  const hasSaved = Object.keys(answers).length > 0
  const [resumeModal, setResumeModal] = useState(hasSaved)
  const [acceptedConsent, setAcceptedConsent] = useState(false)
  const [legalNote, setLegalNote] = useState(null)
  const [editingFromSummary, setEditingFromSummary] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)

  const questions = useMemo(() => visibleQuestions(answers), [answers])
  const summaryStep = questions.length
  const total = questions.length + 1
  const isSummary = step >= summaryStep
  const q = isSummary ? null : questions[Math.min(step, questions.length - 1)]
  const pct = Math.max(Math.round(((Math.min(step, total - 1) + 1) / total) * 100), 8)
  const alerts = isSummary ? safetyAlerts(answers) : []
  const summaryQuestions = isSummary ? questions.filter(item => answers[item.key] !== undefined) : []

  function persistAnswers(updater) {
    setAnswers(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      try {
        localStorage.setItem('suplematch_encuesta_answers', JSON.stringify(next))
      } catch {
        // Ignore browsers that block localStorage.
      }
      return next
    })
  }

  function select(value) {
    persistAnswers(prev => {
      const next = { ...prev, [q.key]: value }
      if (q.key === 'toma_suplementos' && value === 'no') {
        next.suplementos_actuales = []
      }
      if (q.key === 'sexo' && value === 'masculino') {
        next.condiciones_seguridad = (next.condiciones_seguridad || []).filter(item => item !== 'embarazo_lactancia')
      }
      return next
    })
  }

  function toggleMulti(value) {
    persistAnswers(prev => {
      const current = prev[q.key] || []
      const updated = normalizeMultiSelection(q, current, value)
      return { ...prev, [q.key]: updated }
    })
  }

  function next() {
    if (isSummary) {
      if (!acceptedConsent) {
        showToast('Acepta el consentimiento para continuar')
        return
      }
      setUserData(buildPayload(answers))
      try {
        localStorage.removeItem('suplematch_encuesta_answers')
      } catch {
        // Ignore browsers that block localStorage.
      }
      goTo('loading')
      return
    }

    if (!answerIsValid(q, answers)) {
      showToast(q.type === 'multi' ? 'Selecciona al menos una opción' : 'Selecciona una opción')
      return
    }
    if (editingFromSummary) {
      setEditingFromSummary(false)
      setStep(summaryStep)
    } else if (step < questions.length - 1) {
      setStep(s => s + 1)
    } else {
      setStep(summaryStep)
    }
  }

  function back() {
    if (isSummary) setStep(Math.max(0, questions.length - 1))
    else if (editingFromSummary) { setEditingFromSummary(false); setStep(summaryStep) }
    else if (step > 0) setStep(s => s - 1)
    else setConfirmExit(true)
  }

  if (!q && !isSummary) return null

  return (
    <div className="screen" style={{ background: 'white', gap: 0, paddingTop: 50 }}>
      {resumeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24
        }}>
          <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: 28, width: '100%', maxWidth: 340 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 10 }}>Tienes una evaluación guardada</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 24, lineHeight: 1.5 }}>¿Quieres continuar donde lo dejaste o empezar de cero?</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => {
                try {
                  localStorage.removeItem('suplematch_encuesta_answers')
                } catch {
                  // Ignore browsers that block localStorage.
                }
                setAnswers({})
                setResumeModal(false)
              }}>Empezar de cero</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => setResumeModal(false)}>Continuar</button>
            </div>
          </div>
        </div>
      )}
      {confirmExit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24
        }}>
          <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: 28, width: '100%', maxWidth: 340 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 10 }}>¿Salir de la evaluación?</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 24, lineHeight: 1.5 }}>Perderás tu progreso actual.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmExit(false)}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => goTo('landing')}>Salir</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 20 }}>←</button>
          <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>
            {isSummary ? 'Resumen final' : `Paso ${step + 1} de ${total}`}
          </span>
        </div>
        <div style={{ height: 5, background: 'var(--gray-200)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--green)', borderRadius: 99, width: `${pct}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <h2 style={{ fontSize: 21, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1.25, marginBottom: 8 }}>
        {isSummary ? 'Revisa tus respuestas' : q.title}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.45, marginBottom: 20 }}>
        {isSummary ? 'Confirma que el perfil sea correcto antes de generar recomendaciones.' : q.sub}
      </p>

      {isSummary ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto', paddingRight: 2 }}>
          {alerts.length > 0 && (
            <div style={{
              border: '1px solid #f4b66d',
              background: '#fff7ed',
              color: '#7c2d12',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <strong style={{ fontSize: 13 }}>Alertas de seguridad</strong>
              {alerts.map(alert => (
                <span key={alert} style={{ fontSize: 12, lineHeight: 1.4 }}>{alert}</span>
              ))}
            </div>
          )}

          {summaryQuestions.map((item) => (
            <div
              key={item.key}
              style={{
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--gray-500)', fontWeight: 650, marginBottom: 4 }}>
                  {item.title}
                </span>
                <span style={{ display: 'block', fontSize: 14, color: 'var(--gray-800)', lineHeight: 1.35 }}>
                  {answerLabel(item, answers)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => { setEditingFromSummary(true); setStep(Math.max(0, questions.findIndex(candidate => candidate.key === item.key))) }}
                style={{
                  border: '1px solid var(--gray-200)',
                  background: 'white',
                  borderRadius: 8,
                  color: 'var(--green-dark)',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '7px 10px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Editar
              </button>
            </div>
          ))}

          <label style={{
            border: `2px solid ${acceptedConsent ? 'var(--green)' : 'var(--gray-200)'}`,
            background: acceptedConsent ? 'var(--green-light)' : 'white',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={acceptedConsent}
              onChange={event => setAcceptedConsent(event.target.checked)}
              style={{ marginTop: 3, accentColor: 'var(--green)', flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.45 }}>
              Acepto que SupleMatch entrega orientación informativa, no diagnóstico ni receta. Entiendo que debo revisar etiquetas, dosis e interacciones, y que si mi perfil requiere revisión médica se ocultarán productos comerciales.
              {' '}
              <button type="button" onClick={(event) => { event.preventDefault(); setLegalNote('terms') }} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Términos</button>
              {' · '}
              <button type="button" onClick={(event) => { event.preventDefault(); setLegalNote('privacy') }} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Privacidad</button>
            </span>
          </label>
          {legalNote && (
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', background: 'var(--gray-50)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                <strong style={{ fontSize: 13, color: 'var(--gray-800)' }}>
                  {legalNote === 'privacy' ? 'Privacidad' : 'Términos de uso'}
                </strong>
                <button type="button" onClick={() => setLegalNote(null)} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>Cerrar</button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.45 }}>
                {legalNote === 'privacy'
                  ? 'Usamos tus respuestas para generar recomendaciones, guardar historial si inicias sesión y mejorar señales agregadas como feedback y reseñas. Evitamos texto libre sensible en esta encuesta.'
                  : 'SupleMatch es informativo. No diagnostica ni prescribe. Verifica etiquetas, dosis, contraindicaciones e interacciones antes de tomar o comprar suplementos.'}
              </p>
            </div>
          )}
        </div>
      ) : q.type === 'price_range' ? (
        <PriceRangeQuestion q={q} answers={answers} onChange={(val) => persistAnswers(prev => ({ ...prev, [q.key]: val }))} />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto', paddingRight: 2 }}>
            {q.options.filter(opt => {
              if (opt.value === 'embarazo_lactancia' && answers.sexo === 'masculino') return false
              return true
            }).map((opt) => {
              const selected = q.type === 'single'
                ? answers[q.key] === opt.value
                : (answers[q.key] || []).includes(opt.value)

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => q.type === 'single' ? select(opt.value) : toggleMulti(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${selected ? 'var(--green)' : 'var(--gray-200)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: selected ? 'var(--green-light)' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 22,
                    height: 22,
                    borderRadius: q.type === 'single' ? '50%' : 5,
                    border: `2px solid ${selected ? 'var(--green)' : 'var(--gray-200)'}`,
                    background: selected ? 'var(--green)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 700,
                  }}>
                    {selected && (q.type === 'single' ? <span style={{ width: 8, height: 8, background: 'white', borderRadius: '50%' }} /> : '✓')}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <span style={{ fontSize: 14, color: selected ? 'var(--green-dark)' : 'var(--gray-800)', fontWeight: 650, lineHeight: 1.25 }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.35 }}>
                      {opt.detail}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {q.type === 'multi' && (
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 8, textAlign: 'center', lineHeight: 1.35 }}>
              {q.max ? `Puedes seleccionar hasta ${q.max}.` : 'Puedes seleccionar varias opciones.'}
            </p>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button className="btn-secondary" onClick={back} style={{ opacity: step === 0 ? 0.3 : 1 }}>← Atrás</button>
        <button className="btn-primary" onClick={next} style={{ flex: 2 }}>
          {isSummary ? 'Enviar encuesta →' : step === questions.length - 1 ? 'Revisar respuestas →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}
