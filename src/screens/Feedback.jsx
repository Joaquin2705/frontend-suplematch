import { useState } from 'react'
import { postFeedback } from '../api/suplematch'

const OPCIONES = [
  { emoji: '👍', title: 'Sí, tienen sentido',     sub: 'Me identifico con los resultados', rating: 5 },
  { emoji: '🤔', title: 'Algunas sí, otras no',   sub: 'Hay partes que no me aplican',     rating: 3 },
  { emoji: '👎', title: 'No me identifico',        sub: 'El análisis no fue acertado',      rating: 1 },
]

const SUPLEMENTOS = ['Vitamina D3', 'Zinc', 'Vitamina C']

export default function Feedback({ goTo, showToast, apiResult }) {
  const [selected, setSelected]   = useState(null)
  const [checked,  setChecked]    = useState([])
  const [sending,  setSending]    = useState(false)

  function toggleCheck(s) {
    setChecked(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function submit() {
    if (selected === null) {
      showToast('Selecciona una opción')
      return
    }

    const pack = apiResult?.packs_ranked?.[0]
    const fallbackComponentIds = apiResult?.recomendaciones
      ?.map(item => item.component_id)
      .filter(Boolean) ?? []

    setSending(true)
    try {
      await postFeedback({
        recommendation_id: apiResult?.recommendation_id ?? 'rec_frontend_demo',
        pack_id: pack?.pack_id,
        component_ids: pack?.component_ids ?? fallbackComponentIds,
        rating: OPCIONES[selected].rating,
        conditions: apiResult?.conditions ?? [],
        comment: checked.length ? `No aplica: ${checked.join(', ')}` : null,
      })
      showToast('¡Gracias! Tu feedback mejoró SupleMatch')
      setTimeout(() => goTo('landing'), 2500)
    } catch (error) {
      showToast(error.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="screen" style={{ background: 'white', gap: 0, justifyContent: 'space-between' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-800)', lineHeight: 1.3 }}>
          ¿Estas recomendaciones tienen sentido para ti?
        </div>
        <div style={{ fontSize: 14, color: 'var(--gray-400)', marginTop: 8 }}>
          Tu respuesta mejora SupleMatch para todos
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
        {OPCIONES.map((o, i) => (
          <button key={i} onClick={() => setSelected(i)} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '18px 20px',
            border: `2px solid ${selected === i ? 'var(--green)' : 'var(--gray-200)'}`,
            borderRadius: 'var(--radius)',
            background: selected === i ? 'var(--green-light)' : 'white',
            cursor: 'pointer', textAlign: 'left', width: '100%',
            transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: 28 }}>{o.emoji}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-800)' }}>{o.title}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{o.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Optional */}
      <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-400)', marginBottom: 12 }}>
          ¿Cuál no aplica? (opcional)
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {SUPLEMENTOS.map(s => {
            const on = checked.includes(s)
            return (
              <div key={s} onClick={() => toggleCheck(s)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px',
                border: `1.5px solid ${on ? 'var(--green)' : 'var(--gray-200)'}`,
                borderRadius: 99, cursor: 'pointer', fontSize: 13,
                color: on ? 'var(--green-dark)' : 'var(--gray-600)',
                background: on ? 'var(--green-light)' : 'white',
                fontWeight: on ? 600 : 400, transition: 'all 0.2s'
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: `2px solid ${on ? 'var(--green)' : 'var(--gray-200)'}`,
                  background: on ? 'var(--green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'white', flexShrink: 0
                }}>{on ? '✓' : ''}</div>
                {s}
              </div>
            )
          })}
        </div>
      </div>

      {/* Submit */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button className="btn-primary" onClick={submit} disabled={sending} style={{ marginBottom: 12 }}>
          {sending ? 'Enviando...' : 'Enviar comentario ✓'}
        </button>
        <button onClick={() => goTo('landing')} style={{
          background: 'none', border: 'none', color: 'var(--gray-400)',
          fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 4
        }}>Omitir</button>
      </div>
    </div>
  )
}
