import { useCallback, useEffect, useState } from 'react'
import { getPendingReviews, moderateReview } from '../api/suplematch'

export default function AdminReviews({ goTo, showToast, authToken, authUser }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(Boolean(authToken))
  const [search, setSearch] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const roles = new Set(authUser?.roles ?? [])
  const canModerate = roles.has('admin') || roles.has('moderator')

  const load = useCallback(async () => {
    if (!authToken || !canModerate) return
    try {
      setReviews(await getPendingReviews(authToken))
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
    }
  }, [authToken, canModerate, showToast])

  useEffect(() => {
    const timer = setTimeout(() => {
      load()
    }, 0)
    return () => clearTimeout(timer)
  }, [load])

  async function update(reviewId, status) {
    try {
      await moderateReview(reviewId, status, authToken)
      setReviews(prev => prev.filter(review => review.id !== reviewId))
      showToast(status === 'published' ? 'Review publicada' : 'Review rechazada')
    } catch (error) {
      showToast(error.message)
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? reviews.filter(r =>
        r.product_name?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q) ||
        r.component_name?.toLowerCase().includes(q)
      )
    : reviews

  if (!authToken) {
    return (
      <div className="screen" style={{ background: 'white', gap: 18 }}>
        <button onClick={() => goTo('landing')} style={backStyle}>←</button>
        <h1 style={titleStyle}>Acceso requerido</h1>
        <p style={bodyStyle}>Ingresa con un usuario moderator o admin para revisar reseñas.</p>
        <button className="btn-primary" onClick={() => goTo('acceso')}>Ingresar</button>
      </div>
    )
  }

  if (!canModerate) {
    return (
      <div className="screen" style={{ background: 'white', gap: 18 }}>
        <button onClick={() => goTo('landing')} style={backStyle}>←</button>
        <h1 style={titleStyle}>Sin permisos de moderación</h1>
        <p style={bodyStyle}>Tu usuario no tiene rol moderator o admin.</p>
      </div>
    )
  }

  return (
    <div className="screen" style={{ background: 'var(--gray-50)', gap: 16 }}>
      <button onClick={() => goTo('landing')} style={backStyle}>←</button>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Moderación
        </div>
        <h1 style={titleStyle}>Reviews pendientes</h1>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por producto, componente o comentario..."
        style={{ border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '10px 12px', fontSize: 13, background: 'white' }}
      />

      {loading && <p style={bodyStyle}>Cargando reviews...</p>}
      {!loading && reviews.length === 0 && <p style={bodyStyle}>No hay reviews pendientes.</p>}
      {!loading && reviews.length > 0 && filtered.length === 0 && <p style={bodyStyle}>Sin resultados para "{search}".</p>}

      {filtered.map(review => (
        <div key={review.id} style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 4 }}>
            {review.product_name || 'Producto'} · {review.pharmacy || 'Farmacia'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>
            Rating {review.rating}/5 · {review.component_name || 'Componente no especificado'}
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.4, marginBottom: 10 }}>
            {review.comment || 'Sin comentario'}
          </p>
          {review.spam_flags?.length > 0 && (
            <div style={{ fontSize: 11, color: '#B91C1C', fontWeight: 700, marginBottom: 10 }}>
              Flags: {review.spam_flags.join(', ')}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" onClick={() => setConfirmAction({ review, status: 'published' })} style={actionStyle}>Publicar</button>
            <button type="button" onClick={() => setConfirmAction({ review, status: 'rejected' })} style={{ ...actionStyle, color: '#B91C1C', background: '#FEF2F2' }}>Rechazar</button>
          </div>
        </div>
      ))}

      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--gray-800)', marginBottom: 10 }}>
              {confirmAction.status === 'published' ? '¿Publicar review?' : '¿Rechazar review?'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
              <strong>{confirmAction.review.product_name}</strong>
            </p>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 18, lineHeight: 1.4 }}>
              {confirmAction.review.comment || 'Sin comentario'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button type="button" onClick={() => setConfirmAction(null)} style={{ ...actionStyle, background: 'var(--gray-100)', color: 'var(--gray-700)' }}>Cancelar</button>
              <button
                type="button"
                onClick={() => { const a = confirmAction; setConfirmAction(null); update(a.review.id, a.status) }}
                style={confirmAction.status === 'published' ? actionStyle : { ...actionStyle, color: '#B91C1C', background: '#FEF2F2' }}
              >
                {confirmAction.status === 'published' ? 'Publicar' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const backStyle = { background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 20, alignSelf: 'flex-start', cursor: 'pointer' }
const titleStyle = { fontSize: 25, color: 'var(--gray-800)', lineHeight: 1.2 }
const bodyStyle = { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.45 }
const cardStyle = { background: 'white', borderRadius: 'var(--radius-sm)', padding: 15, boxShadow: 'var(--shadow)' }
const actionStyle = { border: 'none', borderRadius: 10, background: 'var(--green-light)', color: 'var(--green-dark)', padding: 10, fontWeight: 800, cursor: 'pointer' }
