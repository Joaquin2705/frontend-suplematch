import { useState } from 'react'

const QUESTIONS = [
  {
    key: 'edad_rango',
    title: '¿Cuántos años tienes?',
    sub: 'Rango de edad',
    type: 'single',
    options: [
      { label: 'Menos de 18 años', value: 'menos_18' },
      { label: '18 – 30 años',     value: '18_30' },
      { label: '31 – 50 años',     value: '31_50' },
      { label: '51 años o más',    value: 'mas_50' },
    ],
  },
  {
    key: 'dieta',
    title: '¿Cómo describes tu alimentación?',
    sub: 'Variedad de dieta habitual',
    type: 'single',
    options: [
      { label: 'Poco variada',       value: 'poco_variada' },
      { label: 'Regular',            value: 'regular' },
      { label: 'Bastante variada',   value: 'bastante_variada' },
      { label: 'Muy balanceada',     value: 'muy_balanceada' },
    ],
  },
  {
    key: 'exposicion_solar',
    title: '¿Cuánto tiempo al sol recibes al día?',
    sub: 'Exposición solar directa',
    type: 'single',
    options: [
      { label: 'Menos de 15 min', value: 'menos_15min' },
      { label: '15 – 30 min',     value: '15_30min' },
      { label: '30 – 60 min',     value: '30_60min' },
      { label: 'Más de 1 hora',   value: 'mas_1h' },
    ],
  },
  {
    key: 'frecuencia_ejercicio',
    title: '¿Qué tan activo/a eres físicamente?',
    sub: 'Actividad física semanal',
    type: 'single',
    options: [
      { label: 'Casi nunca',             value: 'casi_nunca' },
      { label: '1 – 2 veces / semana',   value: '1_2_semana' },
      { label: '3 – 4 veces / semana',   value: '3_4_semana' },
      { label: 'Diario o casi diario',   value: 'diario' },
    ],
  },
  {
    key: 'fatiga',
    title: '¿Con qué frecuencia sientes fatiga o cansancio?',
    sub: 'Energía en el día a día',
    type: 'single',
    options: [
      { label: 'Casi nunca',     value: 'casi_nunca' },
      { label: 'A veces',        value: 'a_veces' },
      { label: 'A menudo',       value: 'a_menudo' },
      { label: 'Siempre',        value: 'siempre' },
    ],
  },
  {
    key: 'horas_sueno',
    title: '¿Tienes problemas para dormir bien?',
    sub: 'Calidad y duración del sueño',
    type: 'single',
    options: [
      { label: 'Menos de 5 horas', value: 'menos_5h' },
      { label: '5 – 7 horas',      value: '5_7h' },
      { label: '7 – 9 horas',      value: '7_9h' },
      { label: 'Más de 9 horas',   value: 'mas_9h' },
    ],
  },
  {
    key: 'frecuencia_enfermedad',
    title: '¿Con qué frecuencia te enfermas?',
    sub: 'Resfríos, infecciones, etc.',
    type: 'single',
    options: [
      { label: 'Casi nunca',          value: 'casi_nunca' },
      { label: '1 – 2 veces al año',  value: '1_2_anio' },
      { label: '3 – 4 veces al año',  value: '3_4_anio' },
      { label: 'Muy seguido',         value: 'muy_seguido' },
    ],
  },
  {
    key: 'estres',
    title: '¿Qué tan irritable o estresado/a te sientes?',
    sub: 'Estado emocional habitual',
    type: 'single',
    options: [
      { label: 'Bajo',          value: 'bajo' },
      { label: 'Moderado',      value: 'moderado' },
      { label: 'Alto',          value: 'alto' },
      { label: 'Muy alto',      value: 'muy_alto' },
    ],
  },
  {
    key: 'alcohol',
    title: '¿Con qué frecuencia consumes alcohol?',
    sub: 'Consumo habitual',
    type: 'single',
    options: [
      { label: 'Nunca',      value: 'nunca' },
      { label: 'Raro',       value: 'raro' },
      { label: 'Ocasional',  value: 'ocasional' },
      { label: 'Frecuente',  value: 'frecuente' },
    ],
  },
]

function buildPayload(answers) {
  const p = {}

  QUESTIONS.forEach(q => {
    if (q.type === 'single') {
      p[q.key] = q.options[answers[q.key]].value
    } else if (q.type === 'multi') {
      const selected = answers[q.key] || []
      q.options.forEach(opt => {
        if (opt.field.startsWith('meta_')) {
          p[opt.field] = selected.includes(opt.field) ? 1 : 0
        } else {
          p[opt.field] = selected.includes(opt.field) ? 4 : 1
        }
      })
    }
  })
  return p
}

export default function Encuesta({ goTo, showToast, setUserData }) {
  const [step,    setStep]    = useState(0)
  const [answers, setAnswers] = useState({})

  const total = QUESTIONS.length
  const q     = QUESTIONS[step]
  const pct   = Math.max(Math.round((step / total) * 100), 8)

  function select(idx) {
    setAnswers(prev => ({ ...prev, [q.key]: idx }))
  }

  function toggleMulti(field) {
    setAnswers(prev => {
      const current = prev[q.key] || []
      const updated = current.includes(field)
        ? current.filter(f => f !== field)
        : [...current, field]
      return { ...prev, [q.key]: updated }
    })
  }

  function next() {
    if (q.type === 'single' && answers[q.key] === undefined) {
      showToast('Selecciona una opción')
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

  return (
    <div className="screen" style={{ background: 'white', gap: 0, paddingTop: 50 }}>
      {/* Progress */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 20 }}>←</button>
          <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>Paso {step + 1} de {total}</span>
        </div>
        <div style={{ height: 5, background: 'var(--gray-200)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--green)', borderRadius: 99, width: `${pct}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Question */}
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1.3, marginBottom: 8 }}>{q.title}</h2>
      <p  style={{ fontSize: 14, color: 'var(--gray-400)', marginBottom: 28 }}>{q.sub}</p>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
        {q.type === 'single' && q.options.map((opt, i) => {
          const selected = answers[q.key] === i
          return (
            <div key={i} onClick={() => select(i)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px',
              border: `2px solid ${selected ? 'var(--green)' : 'var(--gray-200)'}`,
              borderRadius: 'var(--radius-sm)',
              background: selected ? 'var(--green-light)' : 'white',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                border: `2px solid ${selected ? 'var(--green)' : 'var(--gray-200)'}`,
                background: selected ? 'var(--green)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s'
              }}>
                {selected && <div style={{ width: 8, height: 8, background: 'white', borderRadius: '50%' }} />}
              </div>
              <span style={{ fontSize: 15, color: selected ? 'var(--green-dark)' : 'var(--gray-800)', fontWeight: 500 }}>
                {opt.label}
              </span>
            </div>
          )
        })}

        {q.type === 'multi' && q.options.map((opt) => {
          const selected = (answers[q.key] || []).includes(opt.field)
          return (
            <div key={opt.field} onClick={() => toggleMulti(opt.field)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px',
              border: `2px solid ${selected ? 'var(--green)' : 'var(--gray-200)'}`,
              borderRadius: 'var(--radius-sm)',
              background: selected ? 'var(--green-light)' : 'white',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 5,
                border: `2px solid ${selected ? 'var(--green)' : 'var(--gray-200)'}`,
                background: selected ? 'var(--green)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s',
                fontSize: 13, color: 'white', fontWeight: 700
              }}>
                {selected && '✓'}
              </div>
              <span style={{ fontSize: 15, color: selected ? 'var(--green-dark)' : 'var(--gray-800)', fontWeight: 500 }}>
                {opt.label}
              </span>
            </div>
          )
        })}
      </div>

      {q.type === 'multi' && (
        <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 8, textAlign: 'center' }}>
          Puedes seleccionar varios · Si ninguno aplica, continúa
        </p>
      )}

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button className="btn-secondary" onClick={back} style={{ opacity: step === 0 ? 0.3 : 1 }}>← Atrás</button>
        <button className="btn-primary" onClick={next} style={{ flex: 2 }}>
          {step === total - 1 ? 'Ver resultados →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}
