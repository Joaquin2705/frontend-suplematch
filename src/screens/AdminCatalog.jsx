import { useCallback, useEffect, useState } from 'react'
import {
  getAdminProducts,
  getCatalogCandidates,
  getCatalogQuality,
  promoteCatalogCandidate,
  updateAdminProduct,
  updateCatalogCandidate,
} from '../api/suplematch'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 8

export default function AdminCatalog({ goTo, showToast }) {
  const { authToken, authUser } = useAuth()
  const [products, setProducts] = useState([])
  const [quality, setQuality] = useState(null)
  const [candidates, setCandidates] = useState(null)
  const [status, setStatus] = useState('')
  const [candidateStatus, setCandidateStatus] = useState('')
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
      const [productsData, qualityData, candidatesData] = await Promise.all([
        getAdminProducts(authToken, status),
        getCatalogQuality(authToken),
        getCatalogCandidates(authToken, candidateStatus),
      ])
      setProducts(productsData)
      setQuality(qualityData)
      setCandidates(candidatesData)
      setPage(0)
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
    }
  }, [authToken, canAdmin, candidateStatus, showToast, status])

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

  async function updateCandidate(candidate, nextStatus) {
    try {
      await updateCatalogCandidate(candidate.candidate_id, { status: nextStatus, reason }, authToken)
      showToast('Candidato actualizado')
      await load()
    } catch (error) {
      showToast(error.message)
    }
  }

  async function promoteCandidate(candidate) {
    try {
      await promoteCatalogCandidate(candidate.candidate_id, { reason }, authToken)
      showToast('Candidato promovido al catálogo')
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
        <select value={status} onChange={event => { setStatus(event.target.value); setPage(0) }} style={inputStyle}>
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="blocked">Bloqueados</option>
          <option value="preferred">Preferidos</option>
        </select>
        <button className="btn-secondary" onClick={load}>Recargar</button>
      </div>
      <select value={candidateStatus} onChange={event => setCandidateStatus(event.target.value)} style={inputStyle}>
        <option value="">Candidatos: todos los estados</option>
        <option value="candidate_needs_rs">Falta RS</option>
        <option value="approved_verified">Promovibles</option>
        <option value="candidate_name_match">Match por nombre</option>
        <option value="approved_inferred">Inferidos</option>
        <option value="rejected_no_rs">Rechazados sin RS</option>
        <option value="rejected_non_oral">Rechazados no orales</option>
        <option value="manual_rejected">Rechazados manuales</option>
        <option value="promoted">Promovidos</option>
      </select>
      <input value={reason} onChange={event => setReason(event.target.value)} placeholder="Motivo de auditoría" style={inputStyle} />

      {quality && (
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--gray-800)', marginBottom: 8 }}>Calidad de catálogo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <Quality label="Activos" value={quality.active_products} />
            <Quality label="RS" value={`${Math.round((quality.traceability_rate || 0) * 100)}%`} />
            <Quality label="Etiquetas" value={`${Math.round((quality.verified_label_rate || 0) * 100)}%`} />
            <Quality label="Flags verif." value={quality.products_with_verified_restriction_flags} />
            <Quality label="Conf. alta" value={quality.products_with_high_commercial_confidence ?? 0} />
            <Quality label="Conf. baja" value={quality.products_with_low_commercial_confidence ?? 0} />
            <Quality label="RS por nombre" value={quality.products_with_digemid_name_match ?? 0} />
            <Quality label="RS por OCR" value={quality.products_with_image_ocr_rs ?? 0} />
          </div>
          <TopList title="Rechazos por razón" items={quality.rejected_by_reason} />
          <TopList title="Farmacias con más rechazos" items={quality.rejected_by_pharmacy} />
          <ComponentDemand title="Sin producto validado" items={quality.components_missing_product} />
          <ComponentDemand title="Cobertura débil" items={quality.components_weak_product} />
          {quality.warnings?.map(warning => (
            <div key={warning} style={{ fontSize: 11, color: '#92400E', background: 'var(--amber-light)', borderRadius: 8, padding: 8, marginTop: 5 }}>{warning}</div>
          ))}
        </div>
      )}

      {candidates && (
        <CandidatePanel
          candidates={candidates}
          onRejectNoRs={candidate => updateCandidate(candidate, 'rejected_no_rs')}
          onReject={candidate => updateCandidate(candidate, 'manual_rejected')}
          onApproveReview={candidate => updateCandidate(candidate, 'approved_for_review')}
          onPromote={promoteCandidate}
        />
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
            {product.product_component_count > 1 ? <Badge warn>multicomponente</Badge> : <Badge>unitario</Badge>}
            {product.restriction_flags_verified?.length > 0 && <Badge>flags verificados</Badge>}
            {product.restriction_flags_inferred?.length > 0 && <Badge warn>flags inferidos</Badge>}
            {product.commercial_quality_flags?.has_traceable_components && <Badge>componentes trazables</Badge>}
            {product.commercial_quality_flags?.has_high_commercial_confidence && <Badge>confianza alta</Badge>}
            {!product.commercial_quality_flags?.has_high_commercial_confidence && !product.commercial_quality_flags?.has_medium_commercial_confidence && <Badge warn>confianza baja</Badge>}
            {product.commercial_quality_flags?.contains_fish_or_shellfish && <Badge danger>pescado/mariscos</Badge>}
            {product.commercial_quality_flags?.may_contain_gelatin && <Badge warn>gelatina posible</Badge>}
            {product.commercial_quality_flags?.may_contain_dairy && <Badge danger>lácteos posible</Badge>}
            {product.commercial_quality_flags?.may_contain_soy && <Badge danger>soya posible</Badge>}
            {product.label_verification_source && <Badge>{product.label_verification_source}</Badge>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 8 }}>
            <MiniMetric label="Componentes" value={product.product_component_count ?? 1} />
            <MiniMetric label="Trazabilidad" value={product.component_traceable || 'N/D'} />
            <MiniMetric label="Confianza" value={product.commercial_confidence_level || 'N/D'} />
            <MiniMetric label="Score" value={product.commercial_confidence_score ? `${Math.round(Number(product.commercial_confidence_score) * 100)}%` : 'N/D'} />
          </div>
          {product.commercial_confidence_reasons && (
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 8, lineHeight: 1.35 }}>
              {product.commercial_confidence_reasons}
            </div>
          )}
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

function CandidatePanel({ candidates, onRejectNoRs, onReject, onApproveReview, onPromote }) {
  const rows = candidates.candidates ?? []
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--gray-800)' }}>Candidatos de rotación</div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.35 }}>
            Productos encontrados por scraping dirigido que requieren revisión antes de entrar al catálogo.
          </div>
        </div>
        <Badge>{candidates.total ?? 0}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 8 }}>
        {Object.entries(candidates.status_counts ?? {}).slice(0, 6).map(([status, count]) => (
          <MiniMetric key={status} label={statusLabel(status)} value={count} />
        ))}
      </div>

      {candidates.recommended_actions?.slice(0, 3).map(action => (
        <div key={action} style={{ fontSize: 11, color: '#075985', background: '#E0F2FE', borderRadius: 8, padding: 8, marginBottom: 6 }}>
          {action}
        </div>
      ))}

      {!rows.length && (
        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>No hay candidatos para este filtro.</div>
      )}

      {rows.slice(0, 5).map(candidate => (
        <div key={candidate.candidate_id} style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 10, marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {candidate.commercial_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.35 }}>
                {candidate.component_name} · {candidate.pharmacy} · RS {candidate.registro_sanitario || 'pendiente'} · S/ {Number(candidate.price || 0).toFixed(2)}
              </div>
            </div>
            <Badge warn={!candidate.promotable}>{statusLabel(candidate.catalog_status)}</Badge>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
            {candidate.confidence_notes?.slice(0, 3).map(note => <Badge key={note} warn={note.includes('Falta')}>{note}</Badge>)}
          </div>

          {candidate.action_reason && (
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 7 }}>
              Última revisión: {candidate.action_reason}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
            <button type="button" onClick={() => onRejectNoRs(candidate)} style={{ ...actionStyle, background: '#FEF2F2', color: '#B91C1C' }}>Sin RS</button>
            <button type="button" onClick={() => onReject(candidate)} style={{ ...actionStyle, background: 'var(--gray-100)', color: 'var(--gray-700)' }}>Rechazar</button>
            <button type="button" onClick={() => onApproveReview(candidate)} style={actionStyle}>Revisado</button>
            <button
              type="button"
              onClick={() => onPromote(candidate)}
              disabled={!candidate.promotable}
              style={{ ...actionStyle, opacity: candidate.promotable ? 1 : 0.45 }}
            >
              Promover
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function statusLabel(status) {
  const labels = {
    approved_verified: 'verificado',
    approved_inferred: 'inferido',
    candidate_needs_rs: 'falta RS',
    candidate_name_match: 'match nombre',
    rejected_no_rs: 'sin RS',
    rejected_non_oral: 'no oral',
    manual_rejected: 'rechazado',
    approved_for_review: 'revisado',
    promoted: 'promovido',
  }
  return labels[status] || status
}

function MiniMetric({ label, value }) {
  return (
    <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 7 }}>
      <div style={{ fontSize: 9, color: 'var(--gray-400)', fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--gray-700)', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}

function TopList({ title, items }) {
  const rows = Object.entries(items ?? {}).slice(0, 4)
  if (!rows.length) return null
  return (
    <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 8, marginTop: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--gray-700)', marginBottom: 5 }}>{title}</div>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11, color: 'var(--gray-500)', marginBottom: 3 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          <strong style={{ color: 'var(--gray-700)' }}>{value}</strong>
        </div>
      ))}
    </div>
  )
}

function ComponentDemand({ title, items }) {
  const rows = (items ?? []).slice(0, 4)
  if (!rows.length) return null
  return (
    <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 8, marginTop: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--gray-700)', marginBottom: 5 }}>{title}</div>
      {rows.map(item => (
        <div key={`${title}-${item.component_id}`} style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 5, lineHeight: 1.35 }}>
          <strong style={{ color: 'var(--gray-700)' }}>{item.component_name}</strong>
          {' · '}
          {item.safe_rotation_products}/{4} productos · {item.next_action}
        </div>
      ))}
    </div>
  )
}

function Badge({ children, warn = false, danger = false }) {
  const color = danger ? '#B91C1C' : warn ? '#92400E' : 'var(--green-dark)'
  const bg = danger ? '#FEF2F2' : warn ? 'var(--amber-light)' : 'var(--green-light)'
  return <span style={{ fontSize: 10, color, background: bg, borderRadius: 99, padding: '3px 7px', fontWeight: 800 }}>{children}</span>
}

const backStyle = { background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 20, alignSelf: 'flex-start', cursor: 'pointer' }
const titleStyle = { fontSize: 25, color: 'var(--gray-800)', lineHeight: 1.2 }
const bodyStyle = { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.45 }
const cardStyle = { background: 'white', borderRadius: 'var(--radius-sm)', padding: 14, boxShadow: 'var(--shadow)' }
const actionStyle = { border: 'none', borderRadius: 9, background: 'var(--green-light)', color: 'var(--green-dark)', padding: 9, fontSize: 12, fontWeight: 800, cursor: 'pointer' }
const inputStyle = { border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '10px 12px', fontSize: 13, background: 'white', minWidth: 0 }
