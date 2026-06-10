import { useCallback, useEffect, useState } from 'react'
import { getOpsHealth, getPrometheusMetrics } from '../api/suplematch'

function parsePrometheus(text) {
  const scalars = {}
  const routes = []
  for (const line of (text || '').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue
    const rm = line.match(/suplematch_http_requests_by_route_total\{method="([^"]+)",path="([^"]+)",status="([^"]+)"\}\s+([\d.]+)/)
    if (rm) {
      routes.push({ method: rm[1], path: rm[2], status: parseInt(rm[3]), count: parseFloat(rm[4]) })
      continue
    }
    const sm = line.match(/^(suplematch_\w+)\s+([\d.e+-]+)$/)
    if (sm) scalars[sm[1]] = parseFloat(sm[2])
  }
  routes.sort((a, b) => b.count - a.count)
  return { scalars, routes }
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

export default function AdminOps({ goTo, showToast, authToken, authUser }) {
  const [ops, setOps] = useState(null)
  const [metrics, setMetrics] = useState('')
  const [loading, setLoading] = useState(Boolean(authToken))
  const [rawOpen, setRawOpen] = useState(false)
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
      setOps(opsData)
      setMetrics(metricsText)
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

      {topRoutes.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Rutas más usadas</div>
          <BarChart items={topRoutes} />
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
