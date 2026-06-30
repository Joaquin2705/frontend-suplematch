import { useState } from 'react'
import { postFeedback } from '../api/suplematch'
import { useAuth } from '../context/AuthContext'

const OPCIONES = [
  { emoji: '👍', title: 'Sí, tienen sentido',     sub: 'Me identifico con los resultados', rating: 5 },
  { emoji: '🤔', title: 'Algunas sí, otras no',   sub: 'Hay partes que no me aplican',     rating: 3 },
  { emoji: '👎', title: 'No me identifico',        sub: 'El análisis no fue acertado',      rating: 1 },
]

const SUPLEMENTOS_FALLBACK = ['Vitamina D3', 'Zinc', 'Vitamina C']

export default function Feedback({ goTo, showToast, apiResult }) {
  const { authToken } = useAuth()
  const suplementos = (apiResult?.recomendaciones ?? apiResult?.recommendations)?.map(r => r.nombre).filter(Boolean) ?? SUPLEMENTOS_FALLBACK
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
    const fallbackComponentIds = (apiResult?.recomendaciones ?? apiResult?.recommendations)
      ?.map(item => item.component_id)
      .filter(Boolean) ?? []
    const selectedProducts = pack?.selected_products ?? []
    const selectedProductIds = selectedProducts.map(product => product.product_id).filter(Boolean)

    setSending(true)
    try {
      await postFeedback({
        recommendation_id: apiResult?.recommendation_id ?? 'rec_frontend_demo',
        pack_id: pack?.pack_id,
        component_ids: pack?.component_ids ?? fallbackComponentIds,
        selected_product_ids: selectedProductIds,
        chosen_product_id: selectedProductIds[0] ?? null,
        product_context: {
          selected_products: selectedProducts.map(product => ({
            product_id: product.product_id ?? null,
            component_id: product.component_id ?? null,
            commercial_name: product.commercial_name ?? null,
            pharmacy: product.pharmacy ?? null,
            commercial_score: product.commercial_score ?? product.product_score ?? null,
            selection_reasons: product.selection_reasons ?? [],
          })),
        },
        rating: OPCIONES[selected].rating,
        conditions: apiResult?.conditions ?? [],
        comment: checked.length ? `No aplica: ${checked.join(', ')}` : null,
      }, authToken)
      showToast('¡Gracias! Tu feedback mejoró SupleMatch')
      setTimeout(() => goTo('landing'), 2500)
    } catch (error) {
      showToast(error.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="screen app-shell">
      <header className="surface" style={{ gap: 12 }}>
        <button onClick={() => goTo('recomendaciones')} className="back-link" type="button">← Volver</button>
        <div>
          <div className="app-kicker">Feedback</div>
          <h1 className="app-title">¿Qué tan útil fue tu recomendación?</h1>
          <p className="app-subtitle">
            Tu respuesta ayuda a ajustar futuras recomendaciones y productos. No cambia tus resultados actuales.
          </p>
        </div>
      </header>

      <section className="surface">
        <div className="section-title">Tu percepción</div>
        <p className="section-copy" style={{ margin: '4px 0 12px' }}>
          Elige la opción que más se acerque a tu experiencia con el análisis.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {OPCIONES.map((o, i) => (
          <button key={i} onClick={() => setSelected(i)} className={`option-card ${selected === i ? 'is-selected' : ''}`}>
            <span style={{ fontSize: 24, marginRight: 12 }}>{o.emoji}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-800)' }}>{o.title}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{o.sub}</div>
            </div>
          </button>
        ))}
        </div>
      </section>

      <section className="surface-soft" style={{ padding: 15 }}>
        <div className="section-title">Ajuste opcional</div>
        <p className="section-copy" style={{ margin: '4px 0 12px' }}>
          Marca suplementos que no sentiste relacionados contigo.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {suplementos.map(s => {
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
      </section>

      <div className="surface" style={{ textAlign: 'center' }}>
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
