import { useRef } from 'react'
import {
  SUPPLEMENT_DOSE_FIELDS, SCALE_PRESETS,
  fieldLabelStyle, exactInputStyle, warningStyle,
  initialAnthropometrics, labResultCount,
} from './EncuestaUtils'

export function PriceRangeQuestion({ q, answers, onChange }) {
  const stored = answers[q.key] || {}
  const rangeMin = q.min ?? 0
  const rangeMax = q.max ?? 500
  const step = q.step ?? 10

  const currentMin = stored.min ?? rangeMin
  const currentMax = stored.max ?? rangeMax
  const packSize = stored.packSize ?? 3
  const hasPreference = stored.min != null || stored.max != null

  const trackRef = useRef(null)
  const draggingRef = useRef(null)

  const pct = (val) => ((val - rangeMin) / (rangeMax - rangeMin)) * 100

  function snapToStep(raw) {
    return Math.round(raw / step) * step
  }

  function valueFromPointer(clientX) {
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return snapToStep(rangeMin + ratio * (rangeMax - rangeMin))
  }

  function handlePointerDown(e) {
    const val = valueFromPointer(e.clientX)
    const distMin = Math.abs(val - currentMin)
    const distMax = Math.abs(val - currentMax)
    draggingRef.current = distMin <= distMax ? 'min' : 'max'
    e.currentTarget.setPointerCapture(e.pointerId)
    applyDrag(val)
  }

  function handlePointerMove(e) {
    if (!draggingRef.current) return
    applyDrag(valueFromPointer(e.clientX))
  }

  function handlePointerUp() {
    draggingRef.current = null
  }

  function applyDrag(val) {
    if (draggingRef.current === 'min') {
      onChange({ min: Math.min(val, currentMax - step), max: currentMax, packSize })
    } else {
      onChange({ min: currentMin, max: Math.max(val, currentMin + step), packSize })
    }
  }

  const thumbStyle = {
    position: 'absolute',
    top: '50%',
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: hasPreference ? 'var(--green)' : 'var(--gray-400)',
    border: '3px solid white',
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 2,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, paddingTop: 8 }}>
      <div style={{
        background: hasPreference ? 'var(--green-light)' : 'var(--gray-50)',
        border: `2px solid ${hasPreference ? 'var(--green)' : 'var(--gray-200)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '16px 20px',
        textAlign: 'center',
      }}>
        {hasPreference ? (
          <>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--green-dark)' }}>
              S/ {currentMin} – S/ {currentMax}
            </span>
            <p style={{ fontSize: 12, color: 'var(--gray-600)', margin: '4px 0 0 0' }}>
              rango mensual en soles
            </p>
          </>
        ) : (
          <span style={{ fontSize: 15, color: 'var(--gray-400)' }}>Sin preferencia de precio</span>
        )}
      </div>

      <div style={{ padding: '0 12px' }}>
        <div
          ref={trackRef}
          style={{ position: 'relative', height: 40, cursor: 'pointer', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            left: 0, right: 0, height: 6, background: 'var(--gray-200)', borderRadius: 3,
          }} />
          <div style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            left: `${pct(currentMin)}%`, right: `${100 - pct(currentMax)}%`,
            height: 6, background: hasPreference ? 'var(--green)' : 'var(--gray-300)',
            borderRadius: 3, transition: 'background 0.2s',
          }} />
          <div style={{ ...thumbStyle, left: `${pct(currentMin)}%` }} />
          <div style={{ ...thumbStyle, left: `${pct(currentMax)}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
          <span>S/ {rangeMin}</span>
          <span>S/ {rangeMax}</span>
        </div>
      </div>

      {hasPreference && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[3, 5].map(size => (
              <button
                key={size}
                type="button"
                onClick={() => onChange({ min: currentMin, max: currentMax, packSize: size })}
                style={{
                  border: `2px solid ${packSize === size ? 'var(--green)' : 'var(--gray-200)'}`,
                  background: packSize === size ? 'var(--green-light)' : 'white',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  color: packSize === size ? 'var(--green-dark)' : 'var(--gray-600)',
                  fontSize: 13,
                  fontWeight: 850,
                  cursor: 'pointer',
                }}
              >
                Top {size}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange({})}
            style={{
              background: 'none', border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-sm)', padding: '8px 16px',
              fontSize: 12, color: 'var(--gray-500)', cursor: 'pointer', alignSelf: 'center',
            }}
          >
            Quitar preferencia de precio
          </button>
        </>
      )}
    </div>
  )
}

export function FieldGroupQuestion({ q, answers, onChange }) {
  const stored = answers[q.key] || {}
  const selectedSupplements = Array.isArray(answers.suplementos_actuales) ? answers.suplementos_actuales : []

  function patch(fieldKey, value) {
    const next = { ...stored, [fieldKey]: value }
    if (fieldKey === 'suplementos_dosis_conocida' && !value) {
      delete next.suplementos_dosis_actual
    }
    if (fieldKey === 'no_meat' && value) {
      next.red_meat_servings_week = 0
      next.poultry_servings_week = 0
    }
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto', paddingRight: 2 }}>
      {q.fields.map(field => {
        const value = stored[field.key]

        if (field.type === 'current_supplement_doses') {
          if (!stored.suplementos_dosis_conocida || selectedSupplements.length === 0) return null
          const doses = value && typeof value === 'object' ? value : {}

          function patchDose(supplement, amount) {
            const config = SUPPLEMENT_DOSE_FIELDS[supplement]
            const nextDoses = { ...doses }
            if (amount === '') {
              delete nextDoses[supplement]
            } else {
              nextDoses[supplement] = { amount, unit: config?.unit ?? 'porción/día' }
            }
            patch(field.key, nextDoses)
          }

          return (
            <div key={field.key} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: 12, background: 'var(--gray-50)' }}>
              <div style={{ fontSize: 12, color: 'var(--gray-700)', fontWeight: 850, marginBottom: 4 }}>
                Dosis diaria aproximada
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.35, marginBottom: 10 }}>
                Usa lo que dice la etiqueta. Si no estás seguro de un suplemento, deja ese campo vacío.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {selectedSupplements.map(supplement => {
                  const config = SUPPLEMENT_DOSE_FIELDS[supplement] ?? { label: supplement, unit: 'porción/día', min: 0, max: 10000, step: 1, placeholder: 'Ej: 1' }
                  const dose = doses[supplement]?.amount ?? ''
                  return (
                    <label key={supplement} style={{ ...fieldLabelStyle, gap: 5 }}>
                      {config.label}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                        <input
                          value={dose}
                          onChange={event => patchDose(supplement, event.target.value)}
                          placeholder={config.placeholder}
                          type="number"
                          min={config.min}
                          max={config.max}
                          step={config.step ?? 1}
                          inputMode="decimal"
                          style={{ ...exactInputStyle, minHeight: 42, padding: '10px 12px' }}
                        />
                        <span style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {config.unit}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        }

        if (field.type === 'checkbox') {
          return (
            <label
              key={field.key}
              style={{
                border: `2px solid ${value ? 'var(--green)' : 'var(--gray-200)'}`,
                background: value ? 'var(--green-light)' : 'white',
                borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={event => patch(field.key, event.target.checked)}
                style={{ accentColor: 'var(--green)', flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 700 }}>{field.label}</span>
            </label>
          )
        }

        if (field.type === 'select') {
          return (
            <label key={field.key} style={fieldLabelStyle}>
              {field.label}
              <select
                value={value ?? ''}
                onChange={event => patch(field.key, event.target.value || '')}
                style={exactInputStyle}
              >
                <option value="">Sin responder</option>
                {field.options.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          )
        }

        if (field.type === 'multi_select') {
          const selected = Array.isArray(value) ? value : []
          return (
            <div key={field.key} style={fieldLabelStyle}>
              {field.label}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {field.options.map(option => {
                  const active = selected.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => patch(field.key, active ? selected.filter(item => item !== option.value) : [...selected, option.value])}
                      style={{
                        border: `2px solid ${active ? 'var(--green)' : 'var(--gray-200)'}`,
                        background: active ? 'var(--green-light)' : 'white',
                        borderRadius: 'var(--radius-sm)', padding: '10px 8px',
                        color: active ? 'var(--green-dark)' : 'var(--gray-700)',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      }}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        }

        if (field.type === 'scale5') {
          return (
            <Scale5Field
              key={field.key}
              field={field}
              value={value}
              onChange={(nextValue) => patch(field.key, nextValue)}
            />
          )
        }

        return (
          <label key={field.key} style={fieldLabelStyle}>
            {field.label}
            <div style={{ display: 'grid', gridTemplateColumns: field.suffix ? '1fr auto' : '1fr', gap: 8, alignItems: 'center' }}>
              <input
                value={value ?? ''}
                onChange={event => patch(field.key, event.target.value)}
                placeholder={field.placeholder}
                type="number"
                min={field.min}
                max={field.max}
                step={field.step ?? 1}
                inputMode="decimal"
                style={exactInputStyle}
              />
              {field.suffix && (
                <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {field.suffix}
                </span>
              )}
            </div>
          </label>
        )
      })}
      <div style={{ ...warningStyle, background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
        Los campos vacíos quedan como dato faltante. No se interpretan como consumo cero.
      </div>
    </div>
  )
}

export function Scale5Field({ field, value, onChange }) {
  const options = SCALE_PRESETS[field.scale] ?? SCALE_PRESETS.weekly_food
  const selected = options.find(option => Number(option.value) === Number(value))

  return (
    <div style={fieldLabelStyle}>
      {field.label}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7 }}>
        {options.map(option => {
          const active = Number(value) === Number(option.value)
          return (
            <button
              key={option.point}
              type="button"
              onClick={() => onChange(option.value)}
              aria-label={`${field.label}: ${option.point} de 5, ${option.label}`}
              style={{
                minHeight: 48,
                border: `2px solid ${active ? 'var(--green)' : 'var(--gray-200)'}`,
                background: active ? 'var(--green-light)' : 'white',
                color: active ? 'var(--green-dark)' : 'var(--gray-700)',
                borderRadius: 12, fontSize: 15, fontWeight: 950, cursor: 'pointer',
              }}
            >
              {option.point}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10, color: 'var(--gray-400)', fontWeight: 800 }}>
        <span>1 bajo</span>
        <span>5 alto</span>
      </div>
      <div style={{ fontSize: 12, color: selected ? 'var(--green-dark)' : 'var(--gray-500)', fontWeight: 800, lineHeight: 1.35 }}>
        {selected ? `${selected.label} · estimado ${selected.hint}` : 'Selecciona 1 a 5 según tu semana típica.'}
      </div>
    </div>
  )
}

export function AnthropometricsQuestion({ answers, onChange }) {
  const stored = answers.antropometria || initialAnthropometrics()

  function patch(next) {
    onChange({ ...stored, ...next })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
      <label style={fieldLabelStyle}>
        Edad
        <input
          value={stored.age_years ?? ''}
          onChange={event => patch({ age_years: event.target.value })}
          placeholder="Ej: 25"
          type="number"
          min="1"
          max="120"
          inputMode="numeric"
          style={exactInputStyle}
        />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr', gap: 10 }}>
        <label style={fieldLabelStyle}>
          Peso
          <input
            value={stored.weight_value ?? ''}
            onChange={event => patch({ weight_value: event.target.value })}
            placeholder="Ej: 70"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            style={exactInputStyle}
          />
        </label>
        <label style={fieldLabelStyle}>
          Unidad
          <select value={stored.weight_unit || 'kg'} onChange={event => patch({ weight_unit: event.target.value })} style={exactInputStyle}>
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: stored.height_unit === 'ft_in' ? '1fr 1fr 0.9fr' : '1fr 0.9fr', gap: 10 }}>
        {stored.height_unit === 'ft_in' ? (
          <>
            <label style={fieldLabelStyle}>
              Pies
              <input
                value={stored.height_feet ?? ''}
                onChange={event => patch({ height_feet: event.target.value })}
                placeholder="Ej: 5"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                style={exactInputStyle}
              />
            </label>
            <label style={fieldLabelStyle}>
              Pulgadas
              <input
                value={stored.height_inches ?? ''}
                onChange={event => patch({ height_inches: event.target.value })}
                placeholder="Ej: 8"
                type="number"
                min="0"
                max="11.99"
                step="0.1"
                inputMode="decimal"
                style={exactInputStyle}
              />
            </label>
          </>
        ) : (
          <label style={fieldLabelStyle}>
            Talla
            <input
              value={stored.height_value ?? ''}
              onChange={event => patch({ height_value: event.target.value })}
              placeholder="Ej: 170"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              style={exactInputStyle}
            />
          </label>
        )}
        <label style={fieldLabelStyle}>
          Unidad
          <select value={stored.height_unit || 'cm'} onChange={event => patch({ height_unit: event.target.value })} style={exactInputStyle}>
            <option value="cm">cm</option>
            <option value="ft_in">ft + in</option>
          </select>
        </label>
      </div>
      <div style={{ ...warningStyle, background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
        Estos datos se usan solo para ajustar el perfil de recomendación y las alertas de seguridad.
      </div>
    </div>
  )
}

export function ColorLegend() {
  const items = [
    ['Verde', 'Disponible o usable', 'var(--green-light)', 'var(--green-dark)'],
    ['Amarillo', 'Revisar precaución', '#FFFBEB', '#92400E'],
    ['Rojo', 'No comprar sin revisión', '#FEF2F2', '#B91C1C'],
  ]
  return (
    <details style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', background: 'var(--gray-50)' }}>
      <summary style={{ fontSize: 12, color: 'var(--gray-700)', fontWeight: 850, cursor: 'pointer' }}>
        Leyenda de colores y filtros
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 9 }}>
        {items.map(([label, detail, bg, color]) => (
          <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--gray-600)' }}>
            <span style={{ width: 12, height: 12, borderRadius: 99, background: bg, border: `1px solid ${color}`, flexShrink: 0 }} />
            <strong style={{ color }}>{label}:</strong>
            <span>{detail}</span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.35 }}>
          "Bloqueado" significa que SupleMatch no muestra compra directa por seguridad. "Penalizado" significa que el producto baja en ranking por precio, trazabilidad, restricciones o menor ajuste.
        </div>
      </div>
    </details>
  )
}

export function LabEntryQuestion({ goTo, onSkip }) {
  const count = labResultCount()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
      <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: 14, background: count ? 'var(--green-light)' : 'var(--gray-50)' }}>
        <div style={{ fontSize: 13, color: count ? 'var(--green-dark)' : 'var(--gray-800)', fontWeight: 900 }}>
          {count ? 'Examen agregado' : 'Opcional, pero mejora precisión'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.45, marginTop: 5 }}>
          {count
            ? `Ya tienes ${count} valor${count !== 1 ? 'es' : ''} de laboratorio guardado${count !== 1 ? 's' : ''} para esta recomendación.`
            : 'Puedes subir PDF o foto, revisar los valores detectados y volver a la encuesta. Si no tienes examen, continúa normalmente.'}
        </div>
      </div>
      <button type="button" className="btn-primary" onClick={() => goTo('examenes')}>
        Subir o revisar examen
      </button>
      <button type="button" className="btn-secondary" onClick={onSkip}>
        Continuar sin examen
      </button>
      <div style={{ ...warningStyle, background: 'white', color: 'var(--gray-600)' }}>
        Los exámenes se usan como apoyo. No reemplazan diagnóstico ni revisión profesional.
      </div>
    </div>
  )
}
