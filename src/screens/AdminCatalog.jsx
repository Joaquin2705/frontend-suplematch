import { useCallback, useEffect, useState } from 'react'
import { getAdminProducts, getCatalogQuality, updateAdminProduct } from '../api/suplematch'

const PAGE_SIZE = 8

export default function AdminCatalog({ goTo, showToast, authToken, authUser }) {
  const [products, setProducts] = useState([])
  const [quality, setQuality] = useState(null)
  const [status, setStatus] = useState('')
  const [reason, setReason] = useState('Revisión de catálogo')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(Boolean(authToken))
  const [confirmBlock, setConfirmBlock] = useState(null)
  const roles = new Set(authUser?.roles ?? [])
  const canAdmin = roles.has('admin')

  const load = useCallback(async () => {
    if (!authToken || !canAdmin) return
    try {
      const [productsData, qualityData] = await Promise.all([
        getAdminProducts(authToken, status),
        getCatalogQuality(authToken),
      ])
      setProducts(productsData)
      setQuality(qualityData)
      setPage(0)
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
    }
  }, [authToken, canAdmin, showToast, status])

  useEffect(() => {
    const timer = setTimeout(() => load(), 0)
    return () => clearTimeout(timer)
  }, [load])

  async function update(product, nextStatus) {
    const payload = nextStatus === 'preferred'
      ? { status: 'active', preferred: true, blocked: false, reason }
      : { status: nextStatus, blocked: nextStatus === 'blocked', preferred: false, reason }
    try {
      await updateAdminProduct(product.id, payload, authToken)
      showToast('Producto actualizado')
      await load()
    } catch (error) {
      showToast(error.message)
    }
  }

  if (!authToken) {
    return (
      <div className="screen" style={{ background: 'white', gap: 18 }}>
        <button onClick={() => goTo('landing')} style={backStyle}>←</button>
        <h1 style={titleStyle}>Acceso requerido</h1>
        <p style={bodyStyle}>Ingresa con un usuario admin para administrar catálogo.</p>
        <button className="btn-primary" onClick={() => goTo('acceso')}>Ingresar</button>
      </div>
    )
  }

  if (!canAdmin) {
    return (
      <div className="screen" style={{ background: 'white', gap: 18 }}>
        <button onClick={() => goTo('landing')} style={backStyle}>←</button>
        <h1 style={titleStyle}>Sin permisos de catálogo</h1>
        <p style={bodyStyle}>Tu usuario no tiene rol admin.</p>
      </div>
    )
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? products.filter(p =>
        p.commercial_name?.toLowerCase().includes(q) ||
        p.pharmacy?.toLowerCase().includes(q) ||
        p.registro_sanitario?.toLowerCase().includes(q)
      )
    : products

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="screen" style={{ background: 'var(--gray-50)', gap: 14 }}>
      <button onClick={() => goTo('landing')} style={backStyle}>←</button>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Catálogo
        </div>
        <h1 style={titleStyle}>Administrar productos</h1>
      </div>

      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(0) }}
        placeholder="Buscar por nombre, farmacia o RS..."
        style={inputStyle}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <select value={status} onChange={event => setStatus(event.target.value)} style={inputStyle}>
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="blocked">Bloqueados</option>
          <option value="preferred">Preferidos</option>
        </select>
        <button className="btn-secondary" onClick={load}>Recargar</button>
      </div>
      <input value={reason} onChange={event => setReason(event.target.value)} placeholder="Motivo de auditoría" style={inputStyle} />

      {quality && (
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--gray-800)', marginBottom: 8 }}>Calidad de catálogo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <Quality label="Activos" value={quality.active_products} />
            <Quality label="RS" value={`${Math.round((quality.traceability_rate || 0) * 100)}%`} />
            <Quality label="Etiquetas" value={`${Math.round((quality.verified_label_rate || 0) * 100)}%`} />
            <Quality label="Flags verif." value={quality.products_with_verified_restriction_flags} />
          </div>
          {quality.warnings?.map(warning => (
            <div key={warning} style={{ fontSize: 11, color: '#92400E', background: 'var(--amber-light)', borderRadius: 8, padding: 8, marginTop: 5 }}>{warning}</div>
          ))}
        </div>
      )}

      {loading && <p style={bodyStyle}>Cargando productos...</p>}
      {!loading && filtered.length === 0 && <p style={bodyStyle}>No hay productos para este filtro.</p>}

      {!loading && filtered.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
          {filtered.length} producto{filtered.length !== 1 ? 's' : ''}{q ? ` para "${search}"` : ''}
        </div>
      )}

      {paginated.map(product => (
        <div key={product.id} style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 4 }}>
            {product.commercial_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.35, marginBottom: 8 }}>
            {product.pharmacy} · {product.commercial_status}{product.preferred ? ' · preferido' : ''}{product.blocked ? ' · bloqueado' : ''} · RS {product.registro_sanitario || 'N/D'} · S/ {Number(product.price || 0).toFixed(2)}
          </div>
          {product.override_reason && (
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 8 }}>
              Motivo: {product.override_reason}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 9 }}>
            <Badge>{product.verification_status}</Badge>
            {product.restriction_flags_verified?.length > 0 && <Badge>flags verificados</Badge>}
            {product.label_verification_source && <Badge>{product.label_verification_source}</Badge>}
          </div>
          {product.verification_warnings?.slice(0, 2).map(warning => (
            <div key={warning} style={{ fontSize: 11, color: '#92400E', background: 'var(--amber-light)', borderRadius: 8, padding: 7, marginBottom: 6 }}>{warning}</div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
            <button type="button" onClick={() => update(product, 'active')} style={actionStyle}>Activar</button>
            <button type="button" onClick={() => update(product, 'preferred')} style={actionStyle}>Preferir</button>
            <button type="button" onClick={() => setConfirmBlock(product)} style={{ ...actionStyle, color: '#B91C1C', background: '#FEF2F2' }}>Bloquear</button>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ ...actionStyle, opacity: page === 0 ? 0.4 : 1 }}
          >
            ←
          </button>
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{page + 1} / {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            style={{ ...actionStyle, opacity: page === totalPages - 1 ? 0.4 : 1 }}
          >
            →
          </button>
        </div>
      )}

      {confirmBlock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--gray-800)', marginBottom: 10 }}>¿Bloquear producto?</div>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
              <strong>{confirmBlock.commercial_name}</strong>
            </p>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 18 }}>
              Motivo: {reason || '—'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button type="button" onClick={() => setConfirmBlock(null)} style={{ ...actionStyle, background: 'var(--gray-100)', color: 'var(--gray-700)' }}>Cancelar</button>
              <button
                type="button"
                onClick={() => { setConfirmBlock(null); update(confirmBlock, 'blocked') }}
                style={{ ...actionStyle, background: '#FEF2F2', color: '#B91C1C' }}
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Quality({ label, value }) {
  return (
    <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 9, padding: 9 }}>
      <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 16, color: 'var(--gray-800)', fontWeight: 900 }}>{value}</div>
    </div>
  )
}

function Badge({ children }) {
  return <span style={{ fontSize: 10, color: 'var(--green-dark)', background: 'var(--green-light)', borderRadius: 99, padding: '3px 7px', fontWeight: 800 }}>{children}</span>
}

const backStyle = { background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 20, alignSelf: 'flex-start', cursor: 'pointer' }
const titleStyle = { fontSize: 25, color: 'var(--gray-800)', lineHeight: 1.2 }
const bodyStyle = { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.45 }
const cardStyle = { background: 'white', borderRadius: 'var(--radius-sm)', padding: 14, boxShadow: 'var(--shadow)' }
const actionStyle = { border: 'none', borderRadius: 9, background: 'var(--green-light)', color: 'var(--green-dark)', padding: 9, fontSize: 12, fontWeight: 800, cursor: 'pointer' }
const inputStyle = { border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '10px 12px', fontSize: 13, background: 'white', minWidth: 0 }
