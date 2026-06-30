import { useCallback, useEffect, useState } from 'react'
import {
  approveCatalogImport,
  cancelCatalogJob,
  getCatalogJobStatus,
  getOpsHealth,
  getPrometheusMetrics,
  runCatalogJob,
} from '../api/suplematch'
import { useAuth } from '../context/AuthContext'

function parsePrometheus(text) {
  const scalars = {}
  const routes = []
  const domainEvents = []
  for (const line of (text || '').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue
    const rm = line.match(/suplematch_http_requests_by_route_total\{method="([^"]+)",path="([^"]+)",status="([^"]+)"\}\s+([\d.]+)/)
    if (rm) {
      routes.push({ method: rm[1], path: rm[2], status: parseInt(rm[3]), count: parseFloat(rm[4]) })
      continue
    }
    const dm = line.match(/suplematch_domain_events_total\{event="([^"]+)",status="([^"]+)"\}\s+([\d.]+)/)
    if (dm) {
      domainEvents.push({ event: dm[1], status: dm[2], count: parseFloat(dm[3]) })
      continue
    }
    const sm = line.match(/^(suplematch_\w+)\s+([\d.e+-]+)$/)
    if (sm) scalars[sm[1]] = parseFloat(sm[2])
  }
  routes.sort((a, b) => b.count - a.count)
  domainEvents.sort((a, b) => b.count - a.count)
  return { scalars, routes, domainEvents }
}

function fmtUptime(seconds) {
  if (seconds < 60) return `${Math.floor(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

function DonutChart({ value, total, label, color = 'var(--green)' }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(value / total, 1) : 0
  const dash = pct * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <svg width={76} height={76} viewBox="0 0 76 76">
        <circle cx={38} cy={38} r={r} fill="none" stroke="var(--gray-100)" strokeWidth={9} />
        <circle cx={38} cy={38} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 38 38)" />
        <text x={38} y={38} textAnchor="middle" dy="0.35em" fontSize={13} fontWeight="900" fill="var(--gray-800)">
          {total > 0 ? `${Math.round(pct * 100)}%` : value}
        </text>
      </svg>
      <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.5 }}>{label}</div>
    </div>
  )
}

function BarChart({ items }) {
  const peak = Math.max(...items.map(i => i.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(({ label, value, color = 'var(--green)' }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: 'var(--gray-500)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{label}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray-700)' }}>{value}</span>
          </div>
          <div style={{ background: 'var(--gray-100)', borderRadius: 3, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${(value / peak) * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={{ ...cardStyle, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, color: 'var(--gray-800)', fontWeight: 900 }}>{String(value)}</div>
    </div>
  )
}

function Metric({ label, value, good = true }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 18, color: good ? 'var(--green-dark)' : '#B91C1C', fontWeight: 900, marginTop: 6 }}>{String(value)}</div>
    </div>
  )
}

function AccessDenied({ goTo, message }) {
  return (
    <div className="screen" style={{ background: 'white', gap: 18 }}>
      <button onClick={() => goTo('landing')} style={backStyle}>←</button>
      <h1 style={titleStyle}>Acceso restringido</h1>
      <p style={bodyStyle}>{message}</p>
    </div>
  )
}

export default function AdminOps({ goTo, showToast }) {
  const { authToken, authUser } = useAuth()
  const [ops, setOps] = useState(null)
  const [metrics, setMetrics] = useState('')
  const [loading, setLoading] = useState(Boolean(authToken))
  const [rawOpen, setRawOpen] = useState(false)
  const [catalogJob, setCatalogJob] = useState(null)
  const [jobRunning, setJobRunning] = useState(false)
  const roles = new Set(authUser?.roles ?? [])
  const canAdmin = roles.has('admin')
  const parsed = parsePrometheus(metrics)

  const load = useCallback(async () => {
    if (!authToken || !canAdmin) return
    setLoading(true)
    try {
      const [opsData, metricsText] = await Promise.all([
        getOpsHealth(authToken),
        getPrometheusMetrics(authToken),
      ])
      const jobData = await getCatalogJobStatus(authToken)
      setOps(opsData)
      setMetrics(metricsText)
      setCatalogJob(jobData)
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
    }
  }, [authToken, canAdmin, showToast])

  useEffect(() => {
    const timer = setTimeout(() => load(), 0)
    return () => clearTimeout(timer)
  }, [load])

  const triggerCatalogJob = async (mode) => {
    if (!authToken || jobRunning) return
    if (mode !== 'validate_only') {
      const label = mode === 'price_only' ? 'scraping rápido de precios' : 'scraping completo y reconstrucción de catálogo'
      const ok = window.confirm(`Esto inicia ${label} y puede tardar varios minutos. ¿Continuar?`)
      if (!ok) return
    }
    setJobRunning(true)
    try {
      const result = await runCatalogJob({
        mode,
        limit_per_pharmacy: 1000,
        pharmacies: [],
        max_raw_age_hours: 168,
        import_to_postgres: false,
      }, authToken)
      showToast(result.message || 'Job de catálogo solicitado.')
      await load()
    } catch (error) {
      showToast(error.message)
    } finally {
      setJobRunning(false)
    }
  }

  const cancelCurrentJob = async () => {
    if (!authToken) return
    const ok = window.confirm('¿Cancelar el job de catálogo en ejecución?')
    if (!ok) return
    setJobRunning(true)
    try {
      const result = await cancelCatalogJob(authToken, catalogJob?.latest_job?.id)
      showToast(result.message || 'Cancelación solicitada.')
      await load()
    } catch (error) {
      showToast(error.message)
    } finally {
      setJobRunning(false)
    }
  }

  const approveLatestImport = async () => {
    const jobId = catalogJob?.latest_job?.id
    if (!authToken || !jobId) return
    const ok = window.confirm('Esto importará el catálogo aprobado a PostgreSQL y guardará snapshots de precios. ¿Continuar?')
    if (!ok) return
    setJobRunning(true)
    try {
      const result = await approveCatalogImport(jobId, authToken)
      showToast(result.message || 'Importación procesada.')
      await load()
    } catch (error) {
      showToast(error.message)
    } finally {
      setJobRunning(false)
    }
  }

  if (!authToken || !canAdmin) {
    return <AccessDenied goTo={goTo} message={!authToken ? 'Ingresa como admin para ver operación.' : 'Tu usuario no tiene rol admin.'} />
  }

  const topRoutes = parsed.routes.slice(0, 8).map(r => ({
    label: `${r.method} ${r.path} [${r.status}]`,
    value: r.count,
    color: r.status >= 400 ? '#EF4444' : r.status >= 300 ? '#F59E0B' : 'var(--green)',
  }))

  const activeCount = ops?.catalog?.products_active ?? 0
  const rsCount = ops?.catalog?.products_with_registro_sanitario ?? 0
  const pendingReviews = ops?.reviews?.pending ?? 0
  const latestCatalogJob = catalogJob?.latest_job
  const canApproveCatalog = !catalogJob?.running
    && latestCatalogJob?.mode === 'update_prices'
    && latestCatalogJob?.status === 'completed'
    && latestCatalogJob?.result?.catalog_validation?.status === 'passed'

  return (
    <div className="screen" style={{ background: 'var(--gray-50)', gap: 14 }}>
      <button onClick={() => goTo('landing')} style={backStyle}>←</button>
      <div>
        <div style={eyebrowStyle}>Operación</div>
        <h1 style={titleStyle}>Observabilidad</h1>
      </div>
      <button className="btn-secondary" type="button" onClick={load}>Recargar</button>
      {loading && <p style={bodyStyle}>Cargando estado operativo...</p>}

      {ops && (
        <div style={{ ...cardStyle, borderLeft: `4px solid ${ops.status === 'ok' ? 'var(--green)' : 'var(--amber)'}` }}>
          <div style={sectionTitleStyle}>
            Estado general: <span style={{ color: ops.status === 'ok' ? 'var(--green-dark)' : '#92400E' }}>{ops.status}</span>
          </div>
          <div style={gridStyle}>
            {Object.entries(ops.checks ?? {}).map(([key, value]) => (
              <Metric key={key} label={key} value={value ? 'ok' : 'revisar'} good={Boolean(value)} />
            ))}
          </div>
        </div>
      )}

      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <StatCard label="Requests" value={parsed.scalars['suplematch_http_requests_total'] ?? 0} />
          <StatCard
            label="Latencia avg"
            value={parsed.scalars['suplematch_http_request_duration_ms_avg'] != null
              ? `${parsed.scalars['suplematch_http_request_duration_ms_avg'].toFixed(0)}ms`
              : '—'}
          />
          <StatCard
            label="Uptime"
            value={parsed.scalars['suplematch_app_uptime_seconds'] != null
              ? fmtUptime(parsed.scalars['suplematch_app_uptime_seconds'])
              : '—'}
          />
        </div>
      )}

      {ops && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Catálogo y actividad</div>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8, paddingTop: 4, paddingBottom: 12 }}>
            <DonutChart value={activeCount} total={activeCount || 1} label="Activos" color="var(--green)" />
            <DonutChart value={rsCount} total={activeCount || 1} label="Con RS" color="#3B82F6" />
            <DonutChart
              value={pendingReviews}
              total={Math.max(pendingReviews, 1)}
              label="Rev. pend."
              color={pendingReviews > 50 ? '#EF4444' : '#F59E0B'}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Metric label="Recs 7 días" value={ops.recommendations?.last_7d ?? 0} />
            <Metric label="Reglas safety" value={ops.safety?.active_ingredient_rules ?? 0} good={(ops.safety?.active_ingredient_rules ?? 0) > 0} />
            <Metric label="OCR" value={ops.labs?.ocr_engine_available ? ops.labs.ocr_engine : 'no disponible'} good={ops.labs?.ocr_engine_available} />
          </div>
        </div>
      )}

      {ops?.catalog_import && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Última importación</div>
          <p style={bodyStyle}>
            {ops.catalog_import.status} · aceptados {ops.catalog_import.total_accepted} · rechazados {ops.catalog_import.total_rejected}
          </p>
        </div>
      )}

      {ops?.scraping_validation && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Scraping y catálogo semanal</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => triggerCatalogJob('validate_only')}
              disabled={jobRunning || catalogJob?.running}
            >
              Validar snapshot
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => triggerCatalogJob('price_only')}
              disabled={jobRunning || catalogJob?.running}
            >
              Precio rápido
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={() => triggerCatalogJob('update_prices')}
              disabled={jobRunning || catalogJob?.running}
            >
              Reconstruir catálogo
            </button>
            {catalogJob?.running && (
              <button className="btn-secondary" type="button" onClick={cancelCurrentJob} disabled={jobRunning}>
                Cancelar
              </button>
            )}
            {canApproveCatalog && (
              <button className="btn-primary" type="button" onClick={approveLatestImport} disabled={jobRunning}>
                Aprobar importación
              </button>
            )}
          </div>
          {catalogJob?.running && (
            <div style={alertNeutralStyle}>
              Job en ejecución: {catalogJob.state?.mode || 'catálogo'} · PID {catalogJob.state?.pid}
            </div>
          )}
          {!catalogJob?.running && catalogJob?.state?.status && (
            <p style={{ ...bodyStyle, fontSize: 12 }}>
              Último job admin: {catalogJob.state.status} · {catalogJob.state.mode || 'catálogo'}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <Metric label="Estado" value={ops.scraping_validation.status} good={ops.scraping_validation.status === 'passed'} />
            <Metric label="Edad snapshot" value={`${Math.round(ops.scraping_validation.age_hours ?? 0)}h`} good={(ops.scraping_validation.age_hours ?? 999) <= 72} />
            <Metric label="Raw rows" value={ops.scraping_validation.raw_rows ?? 0} />
            <Metric label="Componentes" value={ops.scraping_validation.approved_components ?? 0} />
          </div>
          {ops.scraping_validation.latest_scraped_at && (
            <p style={{ ...bodyStyle, fontSize: 12 }}>Último scrape: {new Date(ops.scraping_validation.latest_scraped_at).toLocaleString()}</p>
          )}
          {ops.scraping_validation.errors?.slice(0, 3).map(error => (
            <div key={error} style={alertStyle}>{error}</div>
          ))}
          {catalogJob?.diff?.summary && (
            <div style={{ marginTop: 10 }}>
              <div style={{ ...sectionTitleStyle, fontSize: 12 }}>Diff de catálogo</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Metric label="Nuevos" value={catalogJob.diff.summary.new_products ?? 0} />
                <Metric label="Removidos" value={catalogJob.diff.summary.removed_products ?? 0} good={(catalogJob.diff.summary.removed_products ?? 0) < 100} />
                <Metric label="Cambios precio" value={catalogJob.diff.summary.price_changes ?? 0} />
                <Metric label="Cambios stock" value={catalogJob.diff.summary.availability_changes ?? 0} />
              </div>
              {catalogJob.diff.samples?.price_changes?.slice(0, 3).map(item => (
                <p key={`${item.pharmacy}-${item.sku}-${item.new_price}`} style={{ ...bodyStyle, fontSize: 12 }}>
                  {item.pharmacy}: {item.commercial_name} · S/ {item.old_price} → S/ {item.new_price}
                </p>
              ))}
            </div>
          )}
          {catalogJob?.jobs?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ ...sectionTitleStyle, fontSize: 12 }}>Últimos jobs</div>
              {catalogJob.jobs.slice(0, 4).map(job => (
                <div key={job.id} style={jobRowStyle}>
                  <span>{job.mode}</span>
                  <strong style={{ color: job.status?.includes('failed') ? '#B91C1C' : 'var(--gray-800)' }}>{job.status}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {ops?.model2_quality && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Calidad Modelo 2</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Metric label="Top 3" value={`${Math.round((ops.model2_quality.top3_accuracy ?? 0) * 100)}%`} good={(ops.model2_quality.top3_accuracy ?? 0) >= 0.8} />
            <Metric label="Bloqueos" value={`${Math.round((ops.model2_quality.block_accuracy ?? 0) * 100)}%`} good={(ops.model2_quality.block_accuracy ?? 0) >= 1} />
            <Metric label="Cobertura comercial" value={`${Math.round((ops.model2_quality.commercial_coverage ?? 0) * 100)}%`} good={(ops.model2_quality.commercial_coverage ?? 0) >= 0.35} />
            <Metric label="Casos" value={ops.model2_quality.cases ?? 0} />
          </div>
        </div>
      )}

      {ops?.commercial_engine_quality && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Motor comercial</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Metric
              label="Estado"
              value={ops.commercial_engine_quality.status}
              good={ops.commercial_engine_quality.status === 'passed'}
            />
            <Metric
              label="Pass rate"
              value={`${Math.round((ops.commercial_engine_quality.pass_rate ?? 0) * 100)}%`}
              good={(ops.commercial_engine_quality.pass_rate ?? 0) >= 1}
            />
            <Metric label="Casos" value={ops.commercial_engine_quality.cases ?? 0} />
            <Metric label="Pasaron" value={ops.commercial_engine_quality.passed ?? 0} />
          </div>
          {ops.commercial_engine_quality.errors?.slice(0, 3).map(error => (
            <div key={error} style={alertStyle}>{error}</div>
          ))}
        </div>
      )}

      {topRoutes.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Rutas más usadas</div>
          <BarChart items={topRoutes} />
        </div>
      )}

      {parsed.domainEvents.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Eventos de negocio</div>
          <BarChart items={parsed.domainEvents.slice(0, 8).map(item => ({
            label: `${item.event} · ${item.status}`,
            value: item.count,
            color: item.status === 'blocked' || item.status === 'medical_review_required' ? '#EF4444' : 'var(--green)',
          }))} />
        </div>
      )}

      {metrics && (
        <div style={cardStyle}>
          <button
            type="button"
            onClick={() => setRawOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: 'var(--gray-500)', padding: 0, textAlign: 'left' }}
          >
            {rawOpen ? '▾' : '▸'} Prometheus raw
          </button>
          {rawOpen && (
            <pre style={preStyle}>{metrics}</pre>
          )}
        </div>
      )}
    </div>
  )
}

const backStyle = { background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 20, alignSelf: 'flex-start', cursor: 'pointer' }
const eyebrowStyle = { fontSize: 12, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }
const titleStyle = { fontSize: 25, color: 'var(--gray-800)', lineHeight: 1.2 }
const bodyStyle = { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.45 }
const sectionTitleStyle = { fontSize: 13, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 8 }
const cardStyle = { background: 'white', borderRadius: 'var(--radius-sm)', padding: 14, boxShadow: 'var(--shadow)' }
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
const preStyle = { whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, lineHeight: 1.4, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 10, padding: 10, maxHeight: 220, overflow: 'auto', marginTop: 8 }
const alertStyle = { fontSize: 11, color: '#B91C1C', background: '#FEF2F2', borderRadius: 8, padding: 8, marginTop: 6 }
const alertNeutralStyle = { fontSize: 11, color: '#075985', background: '#E0F2FE', borderRadius: 8, padding: 8, marginBottom: 8 }
const jobRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: 'var(--gray-600)', padding: '6px 0', borderTop: '1px solid var(--gray-100)' }
