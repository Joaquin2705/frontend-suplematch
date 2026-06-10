import { useEffect, useState } from 'react'
import {
  analyzeLabText,
  deleteAllLabReports,
  deleteLabReport,
  exportLabReports,
  getLabReports,
  uploadLabReport,
} from '../api/suplematch'

const SAMPLE_TEXT = `Vitamina D 25-OH: 14 ng/mL
Ferritina: 18 ng/mL
Hemoglobina: 11.2 g/dL
Creatinina: 0.9 mg/dL`

export default function Examenes({ goTo, showToast, authToken }) {
  const [rawText, setRawText] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(Boolean(authToken))

  useEffect(() => {
    if (!authToken) return
    let cancelled = false
    async function loadHistory() {
      try {
        const data = await getLabReports(authToken)
        if (!cancelled) setHistory(data)
      } catch (error) {
        showToast(error.message)
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }
    loadHistory()
    return () => { cancelled = true }
  }, [authToken, showToast])

  async function submitText() {
    if (!accepted) {
      showToast('Acepta el consentimiento de datos de salud')
      return
    }
    if (rawText.trim().length < 10) {
      showToast('Pega resultados o usa el ejemplo')
      return
    }
    setLoading(true)
    try {
      const data = await analyzeLabText({
        consent_health_data: true,
        raw_text: rawText,
        source_type: 'text',
        persist: Boolean(authToken),
      }, authToken)
      setResult(data)
      if (authToken) setHistory(await getLabReports(authToken))
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function submitFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!accepted) {
      showToast('Acepta el consentimiento antes de subir archivo')
      event.target.value = ''
      return
    }
    if (!isAllowedFile(file)) {
      showToast('Formato no soportado. Usa PDF, imagen, TXT o CSV')
      event.target.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('El archivo supera 8 MB')
      event.target.value = ''
      return
    }
    setLoading(true)
    try {
      const data = await uploadLabReport(file, {
        consentHealthData: true,
        persist: Boolean(authToken),
      }, authToken)
      setResult(data)
      if (authToken) setHistory(await getLabReports(authToken))
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  function applyForRecommendation(source = result) {
    const biomarkers = (source?.biomarkers ?? [])
      .filter(item => item?.code && Number.isFinite(Number(item.value)) && item.unit)
      .map(item => ({
        code: item.code,
        value: Number(item.value),
        unit: item.unit,
        reference_low: item.reference_low ?? null,
        reference_high: item.reference_high ?? null,
      }))
    if (!biomarkers.length) {
      showToast('No hay biomarcadores válidos para usar')
      return
    }
    localStorage.setItem('suplematch_lab_results', JSON.stringify(biomarkers))
    showToast('Resultados agregados a la próxima recomendación')
    goTo('encuesta')
  }

  async function exportHistory() {
    if (!authToken) {
      showToast('Inicia sesión para exportar')
      return
    }
    try {
      const data = await exportLabReports(authToken)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `suplematch-examenes-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      showToast(error.message)
    }
  }

  async function removeReport(reportId) {
    try {
      await deleteLabReport(reportId, authToken)
      setHistory(prev => prev.filter(item => item.id !== reportId))
      showToast('Reporte eliminado')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function removeAllReports() {
    try {
      await deleteAllLabReports(authToken)
      setHistory([])
      showToast('Datos de salud eliminados')
    } catch (error) {
      showToast(error.message)
    }
  }

  return (
    <div className="screen" style={{ background: 'var(--gray-50)', gap: 16 }}>
      <button onClick={() => goTo('landing')} style={backStyle}>←</button>
      <div>
        <div style={eyebrowStyle}>Exámenes</div>
        <h1 style={titleStyle}>Analizar biomarcadores</h1>
        <p style={bodyStyle}>
          Carga texto, PDF o imagen de resultados. SupleMatch extrae valores compatibles y los usa solo como orientación, no diagnóstico.
        </p>
      </div>

      <label style={consentStyle}>
        <input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} />
        <span>Acepto procesar datos sensibles de salud y entiendo que debo confirmar unidades/rangos con un profesional.</span>
      </label>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Pegar resultados</div>
        <textarea
          value={rawText}
          onChange={event => setRawText(event.target.value)}
          placeholder="Ej: Vitamina D 25-OH: 18 ng/mL"
          style={textareaStyle}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="btn-secondary" type="button" onClick={() => setRawText(SAMPLE_TEXT)}>Usar ejemplo</button>
          <button className="btn-primary" type="button" disabled={loading} onClick={submitText}>
            {loading ? 'Analizando...' : 'Analizar'}
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Subir archivo OCR</div>
        <p style={{ ...bodyStyle, fontSize: 12, marginBottom: 12 }}>
          Soporta texto, PDF e imágenes. Si la imagen no es legible, ingresa los valores manualmente.
        </p>
        <input type="file" accept=".txt,.csv,.pdf,image/*" onChange={submitFile} style={{ fontSize: 13, width: '100%' }} />
      </div>

      {result && <LabResult result={result} />}

      {result && (
        <button className="btn-primary" type="button" onClick={() => applyForRecommendation(result)}>
          Usar estos resultados en mi recomendación
        </button>
      )}

      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <div style={sectionTitleStyle}>Historial visual</div>
          {authToken && <button className="btn-secondary" type="button" onClick={exportHistory} style={{ padding: '8px 10px', fontSize: 12 }}>Exportar</button>}
        </div>
        {!authToken && <p style={bodyStyle}>Inicia sesión para guardar, exportar o eliminar resultados de exámenes.</p>}
        {authToken && historyLoading && <p style={bodyStyle}>Cargando historial...</p>}
        {authToken && !historyLoading && history.length === 0 && <p style={bodyStyle}>No tienes exámenes guardados.</p>}
        {history.map(report => (
          <HistoryCard key={report.id} report={report} onUse={() => applyForRecommendation(report)} onDelete={() => removeReport(report.id)} />
        ))}
        {authToken && history.length > 0 && (
          <button className="btn-secondary" type="button" onClick={removeAllReports} style={{ marginTop: 10, color: '#B91C1C' }}>
            Eliminar todos mis datos de salud
          </button>
        )}
      </section>
    </div>
  )
}

function isAllowedFile(file) {
  const name = file.name.toLowerCase()
  return ['.txt', '.csv', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.tiff'].some(ext => name.endsWith(ext)) || file.type.startsWith('image/')
}

function LabResult({ result }) {
  return (
    <div style={{ ...cardStyle, borderLeft: `4px solid ${result.commercial_recommendations_blocked ? 'var(--amber)' : 'var(--green)'}` }}>
      <div style={sectionTitleStyle}>
        {result.commercial_recommendations_blocked ? 'Revisión profesional requerida' : 'Resultado analizado'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 10 }}>
        Safety: <strong>{result.safety_level}</strong> · Biomarcadores: {result.biomarkers?.length ?? 0}
      </div>

      {result.warnings?.map(warning => (
        <div key={warning} style={warningStyle}>{warning}</div>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {result.biomarkers?.map(item => (
          <div key={item.code} style={biomarkerStyle}>
            <div>
              <strong>{item.display_name}</strong>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                Ref: {item.reference_low ?? 'N/D'} - {item.reference_high ?? 'N/D'} {item.unit}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, color: item.severity === 'normal' ? 'var(--gray-800)' : 'var(--amber)' }}>
                {item.value} {item.unit}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{item.status}</div>
            </div>
          </div>
        ))}
      </div>

      {result.supplement_signals?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={sectionTitleStyle}>Señales para conversar</div>
          {result.supplement_signals.map(signal => (
            <div key={`${signal.biomarker_code}-${signal.supplement}`} style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.45, marginTop: 6 }}>
              <strong>{signal.supplement}</strong> · {signal.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryCard({ report, onUse, onDelete }) {
  return (
    <div style={{ border: '1px solid var(--gray-200)', borderRadius: 10, padding: 11, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-800)' }}>
            {new Date(report.created_at).toLocaleDateString()} · {report.source_type}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 3 }}>
            {report.biomarker_count} biomarcadores · {report.safety_level}
          </div>
        </div>
        <span style={{
          fontSize: 10,
          fontWeight: 800,
          color: report.commercial_recommendations_blocked ? '#B91C1C' : 'var(--green-dark)',
          background: report.commercial_recommendations_blocked ? '#FEF2F2' : 'var(--green-light)',
          borderRadius: 99,
          padding: '3px 7px',
          whiteSpace: 'nowrap',
        }}>
          {report.commercial_recommendations_blocked ? 'Bloquea compra' : 'Usable'}
        </span>
      </div>
      {report.biomarkers?.slice(0, 4).map(item => (
        <div key={`${report.id}-${item.code}`} style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 7 }}>
          <strong>{item.display_name}</strong>: {item.value} {item.unit} · {item.status}
        </div>
      ))}
      {report.warnings?.slice(0, 2).map(warning => <div key={warning} style={warningStyle}>{warning}</div>)}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        <button className="btn-secondary" type="button" onClick={onUse}>Reutilizar</button>
        <button className="btn-secondary" type="button" onClick={onDelete} style={{ color: '#B91C1C' }}>Eliminar</button>
      </div>
    </div>
  )
}

const backStyle = { background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 20, alignSelf: 'flex-start', cursor: 'pointer' }
const eyebrowStyle = { fontSize: 12, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }
const titleStyle = { fontSize: 25, color: 'var(--gray-800)', lineHeight: 1.2, marginBottom: 8 }
const bodyStyle = { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.45 }
const cardStyle = { background: 'white', borderRadius: 'var(--radius-sm)', padding: 15, boxShadow: 'var(--shadow)' }
const sectionTitleStyle = { fontSize: 13, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 8 }
const consentStyle = { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.45, color: 'var(--gray-600)', background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: 12 }
const textareaStyle = { width: '100%', minHeight: 120, border: '1px solid var(--gray-200)', borderRadius: 10, padding: 12, resize: 'vertical', fontFamily: 'inherit', fontSize: 13, marginBottom: 10 }
const warningStyle = { background: 'var(--amber-light)', color: '#78350F', borderRadius: 8, padding: 9, fontSize: 12, lineHeight: 1.35, marginBottom: 6 }
const biomarkerStyle = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', border: '1px solid var(--gray-200)', borderRadius: 10, padding: 10 }
