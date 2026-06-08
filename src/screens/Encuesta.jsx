import { useMemo, useState } from 'react'

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
    title: '¿Qué presupuesto prefieres para comparar productos?',
    sub: 'Afecta el orden de productos comerciales, no la necesidad nutricional estimada.',
    type: 'single',
    required: true,
    options: [
      { label: 'Bajo', value: 'bajo', detail: 'Priorizar opciones económicas.' },
      { label: 'Medio', value: 'medio', detail: 'Balance entre precio y calidad.' },
      { label: 'Alto', value: 'alto', detail: 'Puede priorizar mejores métricas aunque cueste más.' },
      { label: 'Sin preferencia', value: 'sin_preferencia', detail: 'Usar ranking general.' },
    ],
  },
]

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

    payload[q.key] = value
  }

  if (payload.toma_suplementos === 'no') {
    payload.suplementos_actuales = []
  }
  if (!payload.objetivos) payload.objetivos = []
  return payload
}

function answerIsValid(q, answers) {
  const value = answers[q.key]
  if (!q.required) return true
  if (q.type === 'single') return value !== undefined
  return Array.isArray(value) && value.length > 0
}

export default function Encuesta({ goTo, showToast, setUserData }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})

  const questions = useMemo(() => visibleQuestions(answers), [answers])
  const total = questions.length
  const q = questions[Math.min(step, total - 1)]
  const pct = Math.max(Math.round(((step + 1) / total) * 100), 8)

  function select(value) {
    setAnswers(prev => {
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
    setAnswers(prev => {
      const current = prev[q.key] || []
      const updated = normalizeMultiSelection(q, current, value)
      return { ...prev, [q.key]: updated }
    })
  }

  function next() {
    if (!answerIsValid(q, answers)) {
      showToast(q.type === 'multi' ? 'Selecciona al menos una opción' : 'Selecciona una opción')
      return
    }
    if (step < total - 1) {
      setStep(s => s + 1)
    } else {
      setUserData(buildPayload(answers))
      goTo('loading')
    }
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
    else goTo('landing')
  }

  if (!q) return null

  return (
    <div className="screen" style={{ background: 'white', gap: 0, paddingTop: 50 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 20 }}>←</button>
          <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>Paso {step + 1} de {total}</span>
        </div>
        <div style={{ height: 5, background: 'var(--gray-200)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--green)', borderRadius: 99, width: `${pct}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <h2 style={{ fontSize: 21, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1.25, marginBottom: 8 }}>{q.title}</h2>
      <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.45, marginBottom: 20 }}>{q.sub}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto', paddingRight: 2 }}>
        {q.options.map((opt) => {
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

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button className="btn-secondary" onClick={back} style={{ opacity: step === 0 ? 0.3 : 1 }}>← Atrás</button>
        <button className="btn-primary" onClick={next} style={{ flex: 2 }}>
          {step === total - 1 ? 'Ver resultados →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}
