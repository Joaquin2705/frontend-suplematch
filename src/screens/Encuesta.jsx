import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  visibleQuestions, answerIsValid, answerLabel,
  normalizeMultiSelection, buildPayload,
  initialAnthropometrics, safetyAlerts, summaryHighlights,
} from './EncuestaUtils'
import {
  PriceRangeQuestion, FieldGroupQuestion,
  AnthropometricsQuestion, LabEntryQuestion, ColorLegend,
} from './EncuestaQuestions'

export default function Encuesta({ goTo, showToast, setUserData }) {
  const { authToken } = useAuth()
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
  const highlights = isSummary ? summaryHighlights(answers) : []
  const summaryQuestions = isSummary ? questions.filter(item => answers[item.key] !== undefined) : []
  const sectionNames = [...new Set(questions.map(item => item.section).filter(Boolean))]
  const currentSection = isSummary ? 'Resumen' : q?.section
  const currentSectionIndex = Math.max(0, sectionNames.findIndex(section => section === currentSection))

  useEffect(() => {
    if (answers.antropometria !== undefined) return
    const initial = initialAnthropometrics()
    if (answerIsValid({ type: 'anthropometrics', required: true, key: 'antropometria' }, { antropometria: initial })) {
      persistAnswers(prev => ({ ...prev, antropometria: initial }))
    }
  }, [answers.antropometria])

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
        next.suplementos_detalle = {}
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
      const next = { ...prev, [q.key]: updated }
      if (q.key === 'suplementos_actuales') {
        const currentDoses = prev.suplementos_detalle?.suplementos_dosis_actual ?? {}
        const keptDoses = Object.fromEntries(Object.entries(currentDoses).filter(([key]) => updated.includes(key)))
        next.suplementos_detalle = {
          ...(prev.suplementos_detalle ?? {}),
          suplementos_dosis_actual: keptDoses,
        }
      }
      return next
    })
  }

  function next() {
    if (isSummary) {
      if (!acceptedConsent) {
        showToast('Acepta el consentimiento para continuar')
        return
      }
      if (!authToken) {
        showToast('Inicia sesión para guardar la evaluación en tu cuenta')
        goTo('acceso')
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
      showToast(q.type === 'anthropometrics'
        ? 'Ingresa edad, peso y talla con valores válidos'
        : q.type === 'field_group' ? 'Revisa los valores ingresados'
        : q.type === 'multi' ? 'Selecciona al menos una opción' : 'Selecciona una opción')
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

  function skipLabEntry() {
    persistAnswers(prev => ({ ...prev, [q.key]: 'omitido' }))
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
    <div className="screen app-shell">
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
                try { localStorage.removeItem('suplematch_encuesta_answers') } catch { /* ignore */ }
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
      <header className="surface" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={back} className="back-link">← Volver</button>
          <span className="badge badge-green">
            {isSummary ? 'Resumen final' : `Paso ${step + 1} de ${total}`}
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--green), #5EEAD4)', borderRadius: 99, width: `${pct}%`, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {sectionNames.map((section, index) => {
            const active = section === currentSection
            const done = index < currentSectionIndex || isSummary
            return (
              <span
                key={section}
                className={`badge ${active ? 'badge-green' : done ? 'badge-blue' : 'badge-gray'}`}
                style={{ flexShrink: 0 }}
              >
                {done && !active ? '✓ ' : ''}{section}
              </span>
            )
          })}
          <span className={`badge ${isSummary ? 'badge-green' : 'badge-gray'}`} style={{ flexShrink: 0 }}>
            Resumen
          </span>
        </div>
      </header>

      <main className="surface" style={{ padding: 'clamp(18px, 4vw, 28px)', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <div>
          {!isSummary && q.section && <div className="app-kicker" style={{ marginBottom: 8 }}>{q.section}</div>}
          <h2 style={{ fontSize: 'clamp(23px, 3vw, 32px)', fontWeight: 950, color: 'var(--gray-900)', lineHeight: 1.1, letterSpacing: -0.5, marginBottom: 8 }}>
            {isSummary ? 'Revisa tus respuestas' : q.title}
          </h2>
          <p className="app-subtitle" style={{ fontSize: 14 }}>
            {isSummary ? 'Confirma que el perfil sea correcto antes de generar recomendaciones orientativas.' : q.sub}
          </p>
        </div>
        {!isSummary && q.note && (
          <details className="alert alert-info">
            <summary style={{ cursor: 'pointer', fontWeight: 900 }}>Ver explicación breve</summary>
            <div style={{ marginTop: 7 }}>{q.note}</div>
          </details>
        )}

        {isSummary ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto', paddingRight: 2 }}>
            <ColorLegend />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {highlights.map(item => (
                <div
                  key={item.title}
                  style={{
                    border: `1px solid ${item.warning ? '#FCD34D' : 'var(--gray-200)'}`,
                    background: item.warning ? '#FFFBEB' : 'var(--gray-50)',
                    borderRadius: 'var(--radius-sm)', padding: '11px 13px',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 850, color: item.warning ? '#92400E' : 'var(--green-dark)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-800)', lineHeight: 1.35 }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.35, marginTop: 3 }}>{item.detail}</div>
                </div>
              ))}
            </div>

            {alerts.length > 0 && (
              <div style={{
                border: '1px solid #f4b66d', background: '#fff7ed', color: '#7c2d12',
                borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 6,
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
                  border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px', display: 'flex', justifyContent: 'space-between',
                  gap: 14, alignItems: 'flex-start',
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
                    border: '1px solid var(--gray-200)', background: 'white', borderRadius: 8,
                    color: 'var(--green-dark)', fontSize: 12, fontWeight: 700,
                    padding: '7px 10px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  Editar
                </button>
              </div>
            ))}

            <label style={{
              border: `2px solid ${acceptedConsent ? 'var(--green)' : 'var(--gray-200)'}`,
              background: acceptedConsent ? 'var(--green-light)' : 'white',
              borderRadius: 'var(--radius-sm)', padding: '12px 14px',
              display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
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
        ) : q.type === 'lab_entry' ? (
          <LabEntryQuestion goTo={goTo} onSkip={skipLabEntry} />
        ) : q.type === 'anthropometrics' ? (
          <AnthropometricsQuestion answers={answers} onChange={(val) => persistAnswers(prev => ({ ...prev, [q.key]: val }))} />
        ) : q.type === 'field_group' ? (
          <FieldGroupQuestion q={q} answers={answers} onChange={(val) => persistAnswers(prev => ({ ...prev, [q.key]: val }))} />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto', paddingRight: 2 }}>
              {q.options.filter(opt => {
                if (q.noneValue && opt.value === q.noneValue) return false
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
                    className={`option-card ${selected ? 'is-selected' : ''}`}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}
                  >
                    <span style={{
                      width: 22, height: 22,
                      borderRadius: q.type === 'single' ? '50%' : 5,
                      border: `2px solid ${selected ? 'var(--green)' : 'var(--gray-200)'}`,
                      background: selected ? 'var(--green)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1, color: 'white', fontSize: 13, fontWeight: 700,
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
              <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8, textAlign: 'center', lineHeight: 1.35 }}>
                {q.noneValue
                  ? 'Si no aplica, deja todo sin marcar y continúa.'
                  : q.max ? `Puedes seleccionar hasta ${q.max}.` : 'Puedes seleccionar varias opciones.'}
              </p>
            )}
          </>
        )}
      </main>

      {q?.type !== 'lab_entry' && (
        <div className="surface-soft" style={{ display: 'flex', gap: 12, padding: 12 }}>
          <button className="btn-secondary" onClick={back} style={{ opacity: step === 0 ? 0.3 : 1 }}>← Atrás</button>
          <button className="btn-primary" onClick={next} style={{ flex: 2 }}>
            {isSummary ? 'Enviar encuesta →' : step === questions.length - 1 ? 'Revisar respuestas →' : q?.type === 'multi' && q.noneValue && (!answers[q.key] || answers[q.key].length === 0) ? 'Omitir →' : 'Siguiente →'}
          </button>
        </div>
      )}
    </div>
  )
}
