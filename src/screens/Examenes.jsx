import { useEffect, useState } from 'react'
import {
  analyzeManualLabs,
  analyzeLabText,
  deleteAllLabReports,
  deleteHealthData,
  deleteLabReport,
  exportHealthData,
  exportLabReports,
  getLabReports,
  uploadLabReport,
} from '../api/suplematch'
import { useAuth } from '../context/AuthContext'
import useAsyncAction from '../hooks/useAsyncAction'

const SAMPLE_TEXT = `Vitamina D 25-OH: 14 ng/mL
Ferritina: 18 ng/mL
Hemoglobina: 11.2 g/dL
Creatinina: 0.9 mg/dL`

export default function Examenes({ goTo, showToast }) {
  const { authToken } = useAuth()
  const { run, loading } = useAsyncAction(showToast)
  const [rawText, setRawText] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [result, setResult] = useState(null)
  const [reviewItems, setReviewItems] = useState([])
  const [reviewDirty, setReviewDirty] = useState(false)
  const [documentPreview, setDocumentPreview] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(Boolean(authToken))
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (!authToken) {
      const timer = setTimeout(() => setHistoryLoading(false), 0)
      return () => clearTimeout(timer)
    }
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

  useEffect(() => {
    return () => {
      if (documentPreview?.url) URL.revokeObjectURL(documentPreview.url)
    }
  }, [documentPreview])

  async function submitText() {
    if (!accepted) { showToast('Acepta el consentimiento de datos de salud'); return }
    if (rawText.trim().length < 10) { showToast('Pega resultados o usa el ejemplo'); return }
    const data = await run(async () => {
      const res = await analyzeLabText({
        consent_health_data: true,
        raw_text: rawText,
        source_type: 'text',
        persist: Boolean(authToken),
      }, authToken)
      if (authToken) setHistory(await getLabReports(authToken))
      return res
    })
    if (!data) return
    setResult(data)
    setReviewItems(toEditableBiomarkers(data.biomarkers))
    setDocumentPreview(null)
    setReviewDirty(false)
  }

  async function submitFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!accepted) { showToast('Acepta el consentimiento antes de subir archivo'); event.target.value = ''; return }
    if (!isAllowedFile(file)) { showToast('Formato no soportado. Usa PDF, imagen, TXT o CSV'); event.target.value = ''; return }
    if (file.size > 8 * 1024 * 1024) { showToast('El archivo supera 8 MB'); event.target.value = ''; return }
    if (documentPreview?.url) URL.revokeObjectURL(documentPreview.url)
    setDocumentPreview({
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : ''),
    })
    const data = await run(async () => {
      const res = await uploadLabReport(file, { consentHealthData: true, persist: Boolean(authToken) }, authToken)
      if (authToken) setHistory(await getLabReports(authToken))
      return res
    })
    event.target.value = ''
    if (!data) return
    setResult(data)
    setReviewItems(toEditableBiomarkers(data.biomarkers))
    setReviewDirty(false)
  }

  async function recalculateCorrections() {
    if (!accepted) { showToast('Acepta el consentimiento de datos de salud'); return }
    const biomarkers = validBiomarkersFromReview(reviewItems)
    if (!biomarkers.length) { showToast('No hay biomarcadores válidos para recalcular'); return }
    const data = await run(() => analyzeManualLabs({
      consent_health_data: true,
      biomarkers,
      source_note: 'Corrección manual de OCR',
      persist: false,
    }, authToken))
    if (!data) return
    setResult({ ...data, extracted_text_preview: result?.extracted_text_preview, ocr_engine: result?.ocr_engine || data.ocr_engine })
    setReviewItems(toEditableBiomarkers(data.biomarkers))
    setReviewDirty(false)
    showToast('Seguridad recalculada con tus correcciones')
  }

  function applyForRecommendation(source = result, editableItems = null) {
    if (editableItems && reviewDirty) {
      showToast('Recalcula seguridad con tus correcciones antes de usar estos resultados')
      return
    }
    const biomarkers = editableItems
      ? validBiomarkersFromReview(editableItems)
      : (source?.biomarkers ?? [])
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
    if (!authToken) { showToast('Inicia sesión para exportar'); return }
    await run(async () => {
      const data = await exportLabReports(authToken)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `suplematch-examenes-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    })
  }

  async function removeReport(reportId) {
    await run(async () => {
      await deleteLabReport(reportId, authToken)
      setHistory(prev => prev.filter(item => item.id !== reportId))
      showToast('Reporte eliminado')
    })
  }

  function removeAllReports() {
    setConfirmDelete('reports')
  }

  async function doRemoveAllReports() {
    setConfirmDelete(null)
    await run(async () => {
      await deleteAllLabReports(authToken)
      setHistory([])
      showToast('Datos de salud eliminados')
    })
  }

  async function exportAllHealthData() {
    if (!authToken) { showToast('Inicia sesión para exportar'); return }
    await run(async () => {
      const data = await exportHealthData(authToken)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `suplematch-datos-salud-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    })
  }

  function removeAllHealthData() {
    if (!authToken) { showToast('Inicia sesión para eliminar datos'); return }
    setConfirmDelete('health')
  }

  async function doRemoveAllHealthData() {
    setConfirmDelete(null)
    await run(async () => {
      const data = await deleteHealthData(authToken)
      setHistory([])
      showToast(data.message || 'Datos de salud eliminados')
    })
  }

  return (
    <div className="screen app-shell">
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 8 }}>
              {confirmDelete === 'reports' ? 'Eliminar exámenes' : 'Eliminar datos de salud'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5, marginBottom: 20 }}>
              {confirmDelete === 'reports'
                ? 'Se borrarán todos los reportes de exámenes guardados. Esta acción no se puede deshacer.'
                : 'Se borrarán exámenes, perfil nutricional y snapshots de recomendaciones. Esta acción no se puede deshacer.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button
                onClick={confirmDelete === 'reports' ? doRemoveAllReports : doRemoveAllHealthData}
                style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="surface" style={{ gap: 14 }}>
        <button onClick={() => goTo('landing')} className="back-link" type="button">← Volver</button>
        <div>
          <div className="app-kicker">Labs opcionales</div>
          <h1 className="app-title">Agrega exámenes si los tienes</h1>
          <p className="app-subtitle">
            SupleMatch puede leer texto, PDF o foto para usar biomarcadores como apoyo. Siempre podrás revisar y corregir lo detectado.
          </p>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="flow-step-card is-active">
            <div className="flow-step-label">Paso 1</div>
            <div>
              <div className="flow-step-title">Sube o pega resultados</div>
              <div className="flow-step-copy">También puedes continuar sin examen.</div>
            </div>
          </div>
          <div className="flow-step-card">
            <div className="flow-step-label">Paso 2</div>
            <div>
              <div className="flow-step-title">Verifica valores</div>
              <div className="flow-step-copy">Confirma número, unidad y rango antes de recomendar.</div>
            </div>
          </div>
        </div>
      </header>

      <label style={consentStyle}>
        <input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} />
        <span>Acepto procesar datos sensibles de salud y entiendo que debo confirmar unidades/rangos con un profesional.</span>
      </label>

      <div className="surface">
        <div className="section-title">Pegar resultados</div>
        <p className="section-copy" style={{ margin: '4px 0 12px' }}>
          Útil si tienes el resultado copiado desde PDF, correo o portal del laboratorio.
        </p>
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

      <div className="surface">
        <div className="section-title">Subir archivo OCR</div>
        <p className="section-copy" style={{ margin: '4px 0 12px' }}>
          Soporta texto, PDF e imágenes. Si la imagen no es legible, ingresa los valores manualmente.
        </p>
        <input type="file" accept=".txt,.csv,.pdf,image/*" onChange={submitFile} style={{ fontSize: 13, width: '100%' }} />
      </div>

      {result && (
        <LabResult
          result={result}
          reviewItems={reviewItems}
          setReviewItems={setReviewItems}
          reviewDirty={reviewDirty}
          setReviewDirty={setReviewDirty}
          documentPreview={documentPreview}
          onRecalculate={recalculateCorrections}
          loading={loading}
        />
      )}

      {result && (
        <button className="btn-primary" type="button" onClick={() => applyForRecommendation(result, reviewItems)}>
          Confirmar y usar en mi recomendación
        </button>
      )}

      <section className="surface">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <div className="section-title">Historial visual</div>
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

      {authToken && (
        <section className="surface-soft" style={{ padding: 15 }}>
          <div className="section-title">Datos sensibles consolidados</div>
          <p className="section-copy" style={{ marginTop: 4 }}>
            Incluye perfil nutricional guardado, resultados de laboratorio y snapshots de encuesta usados para recomendaciones.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="btn-secondary" type="button" onClick={exportAllHealthData}>Exportar todo</button>
            <button className="btn-secondary" type="button" onClick={removeAllHealthData} style={{ color: '#B91C1C' }}>Eliminar salud</button>
          </div>
        </section>
      )}
    </div>
  )
}

function isAllowedFile(file) {
  const name = file.name.toLowerCase()
  return ['.txt', '.csv', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.tiff'].some(ext => name.endsWith(ext)) || file.type.startsWith('image/')
}

function toEditableBiomarkers(items = []) {
  return items.map(item => ({
    code: item.code || '',
    display_name: item.display_name || item.code || '',
    value: item.value ?? '',
    unit: item.unit || '',
    reference_low: item.reference_low ?? '',
    reference_high: item.reference_high ?? '',
    status: item.status || '',
    severity: item.severity || 'normal',
    confidence: item.confidence ?? 1,
  }))
}

function validBiomarkersFromReview(items = []) {
  return items
    .filter(item => item?.code && Number.isFinite(Number(item.value)) && Number(item.value) > 0 && item.unit)
    .map(item => ({
      code: item.code,
      value: Number(item.value),
      unit: item.unit,
      reference_low: item.reference_low === '' || item.reference_low == null ? null : Number(item.reference_low),
      reference_high: item.reference_high === '' || item.reference_high == null ? null : Number(item.reference_high),
    }))
    .filter(item =>
      (item.reference_low == null || Number.isFinite(item.reference_low)) &&
      (item.reference_high == null || Number.isFinite(item.reference_high)) &&
      (item.reference_low == null || item.reference_high == null || item.reference_low < item.reference_high)
    )
}

function LabResult({ result, reviewItems, setReviewItems, reviewDirty, setReviewDirty, documentPreview, onRecalculate, loading }) {
  const confidence = averageConfidence(reviewItems)
  const confidenceInfo = confidenceBand(confidence)
  const abnormalCount = reviewItems.filter(item => ['low', 'high', 'critical_low', 'critical_high', 'abnormal'].includes(String(item.status || '').toLowerCase())).length

  function updateItem(index, patch) {
    setReviewDirty(true)
    setReviewItems(prev => prev.map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  function removeItem(index) {
    setReviewDirty(true)
    setReviewItems(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div style={{ ...cardStyle, borderLeft: `4px solid ${result.commercial_recommendations_blocked ? 'var(--amber)' : 'var(--green)'}` }}>
      {documentPreview && <DocumentPreview documentPreview={documentPreview} />}
      <div style={sectionTitleStyle}>
        {result.commercial_recommendations_blocked ? 'Revisión profesional requerida' : 'Resultado analizado'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <ResultBadge label="Valores encontrados" value={result.biomarkers?.length ?? 0} />
        <ResultBadge label="Confianza OCR" value={confidenceInfo.label} tone={confidenceInfo.tone} />
        <ResultBadge label="Fuera de rango" value={abnormalCount} tone={abnormalCount ? 'amber' : 'green'} />
        <ResultBadge label="Compra directa" value={result.commercial_recommendations_blocked ? 'Bloqueada' : 'Permitida'} tone={result.commercial_recommendations_blocked ? 'amber' : 'green'} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 10, lineHeight: 1.4 }}>
        Revisa cada valor antes de usarlo. Si la confianza es baja, corrige el número, unidad o rango de referencia y recalcula.
      </div>

      {result.warnings?.map(warning => (
        <div key={warning} style={warningStyle}>{warning}</div>
      ))}

      {result.extracted_text_preview && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 800, cursor: 'pointer' }}>Texto detectado</summary>
          <pre style={previewStyle}>{result.extracted_text_preview}</pre>
        </details>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {reviewItems.length === 0 && (
          <div style={warningStyle}>
            No se detectaron biomarcadores compatibles. Ingresa los valores manualmente o sube una imagen más legible.
          </div>
        )}
        {reviewItems.map((item, index) => (
          <div key={`${item.code}-${index}`} style={editableBiomarkerStyle}>
            <div>
              <strong>{item.display_name}</strong>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                Confianza: {Math.round(Number(item.confidence || 0) * 100)}% · {statusLabel(item.status)}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr', gap: 8 }}>
              <input value={item.value} onChange={e => updateItem(index, { value: e.target.value })} inputMode="decimal" aria-label={`Valor ${item.display_name}`} style={miniInputStyle} />
              <input value={item.unit} onChange={e => updateItem(index, { unit: e.target.value })} aria-label={`Unidad ${item.display_name}`} style={miniInputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
              <input value={item.reference_low} onChange={e => updateItem(index, { reference_low: e.target.value })} inputMode="decimal" placeholder="Ref min" aria-label={`Referencia mínima ${item.display_name}`} style={miniInputStyle} />
              <input value={item.reference_high} onChange={e => updateItem(index, { reference_high: e.target.value })} inputMode="decimal" placeholder="Ref max" aria-label={`Referencia máxima ${item.display_name}`} style={miniInputStyle} />
              <button type="button" onClick={() => removeItem(index)} style={removeStyle}>Quitar</button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-secondary" type="button" onClick={onRecalculate} disabled={loading || reviewItems.length === 0} style={{ marginTop: 12 }}>
        {loading ? 'Recalculando...' : 'Recalcular seguridad con correcciones'}
      </button>
      {reviewDirty && (
        <div style={{ ...warningStyle, marginTop: 8 }}>
          Hay correcciones sin recalcular. Recalcula antes de usar estos resultados en recomendaciones.
        </div>
      )}

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

function DocumentPreview({ documentPreview }) {
  const isPdf = documentPreview.type === 'application/pdf' || documentPreview.name.toLowerCase().endsWith('.pdf')
  return (
    <div style={{ border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden', background: 'var(--gray-50)', marginBottom: 12 }}>
      <div style={{ padding: '9px 10px', borderBottom: '1px solid var(--gray-200)', fontSize: 11, color: 'var(--gray-600)', fontWeight: 850 }}>
        Documento original
      </div>
      {isPdf ? (
        <iframe title="Vista previa del examen" src={documentPreview.url} style={{ width: '100%', height: 320, border: 'none', background: 'white' }} />
      ) : (
        <img src={documentPreview.url} alt="Vista previa del examen" style={{ width: '100%', height: 320, objectFit: 'contain', display: 'block' }} />
      )}
    </div>
  )
}

function ResultBadge({ label, value, tone = 'neutral' }) {
  const colors = {
    green: ['var(--green-dark)', 'var(--green-light)'],
    amber: ['#92400E', 'var(--amber-light)'],
    neutral: ['var(--gray-700)', 'var(--gray-100)'],
  }
  const [color, bg] = colors[tone] || colors.neutral
  return (
    <div style={{ background: bg, borderRadius: 9, padding: '8px 9px' }}>
      <div style={{ fontSize: 10, color, fontWeight: 850, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--gray-800)', fontWeight: 900, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function averageConfidence(items = []) {
  const values = items.map(item => Number(item.confidence)).filter(Number.isFinite)
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function confidenceBand(value) {
  if (value >= 0.8) return { label: 'Alta', tone: 'green' }
  if (value >= 0.55) return { label: 'Media', tone: 'amber' }
  return { label: 'Baja', tone: 'amber' }
}

function statusLabel(status) {
  const labels = {
    low: 'bajo',
    high: 'alto',
    normal: 'normal',
    critical_low: 'muy bajo',
    critical_high: 'muy alto',
    abnormal: 'fuera de rango',
  }
  return labels[String(status || '').toLowerCase()] || 'sin estado'
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
            {report.biomarker_count} valores · {report.commercial_recommendations_blocked ? 'compra directa bloqueada' : 'usable para recomendación'}
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
          <strong>{item.display_name}</strong>: {item.value} {item.unit} · {statusLabel(item.status)}
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

const bodyStyle = { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.45 }
const cardStyle = { background: 'white', borderRadius: 'var(--radius-sm)', padding: 15, boxShadow: 'var(--shadow)' }
const sectionTitleStyle = { fontSize: 13, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 8 }
const consentStyle = { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.45, color: 'var(--gray-600)', background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: 12 }
const textareaStyle = { width: '100%', minHeight: 120, border: '1px solid var(--gray-200)', borderRadius: 10, padding: 12, resize: 'vertical', fontFamily: 'inherit', fontSize: 13, marginBottom: 10 }
const warningStyle = { background: 'var(--amber-light)', color: '#78350F', borderRadius: 8, padding: 9, fontSize: 12, lineHeight: 1.35, marginBottom: 6 }
const editableBiomarkerStyle = { display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--gray-200)', borderRadius: 10, padding: 10 }
const miniInputStyle = { minWidth: 0, border: '1px solid var(--gray-200)', borderRadius: 8, padding: '8px 9px', fontSize: 12, background: 'white' }
const removeStyle = { border: 'none', borderRadius: 8, padding: '8px 9px', fontSize: 11, fontWeight: 800, color: '#B91C1C', background: '#FEF2F2', cursor: 'pointer' }
const previewStyle = { whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 10, fontSize: 11, maxHeight: 160, overflow: 'auto', marginTop: 8 }
