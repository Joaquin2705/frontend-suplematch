import { useCallback, useEffect, useState } from 'react'
import { createSafetyRule, getSafetyRules, updateSafetyRule } from '../api/suplematch'

const EMPTY_RULE = {
  name: '',
  ingredient_pattern: '',
  restriction_code: '',
  safety_condition_code: '',
  action: 'warn',
  severity: 'medium',
  message: '',
  active: true,
  source: 'admin',
}

export default function AdminSafetyRules({ goTo, showToast, authToken, authUser }) {
  const [rules, setRules] = useState([])
  const [form, setForm] = useState(EMPTY_RULE)
  const [loading, setLoading] = useState(Boolean(authToken))
  const [search, setSearch] = useState('')
  const [confirmToggle, setConfirmToggle] = useState(null)
  const roles = new Set(authUser?.roles ?? [])
  const canAdmin = roles.has('admin')

  const load = useCallback(async () => {
    if (!authToken || !canAdmin) return
    try {
      setRules(await getSafetyRules(authToken))
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
    }
  }, [authToken, canAdmin, showToast])

  useEffect(() => {
    const timer = setTimeout(() => {
      load()
    }, 0)
    return () => clearTimeout(timer)
  }, [load])

  async function submit(event) {
    event.preventDefault()
    try {
      await createSafetyRule({
        ...form,
        restriction_code: form.restriction_code || null,
        safety_condition_code: form.safety_condition_code || null,
      }, authToken)
      showToast('Regla guardada')
      setForm(EMPTY_RULE)
      await load()
    } catch (error) {
      showToast(error.message)
    }
  }

  async function toggle(rule) {
    try {
      await updateSafetyRule(rule.id, { active: !rule.active }, authToken)
      await load()
    } catch (error) {
      showToast(error.message)
    }
  }

  const q = search.trim().toLowerCase()
  const filteredRules = q
    ? rules.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.ingredient_pattern?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
      )
    : rules

  if (!authToken || !canAdmin) {
    return (
      <div className="screen" style={{ background: 'white', gap: 18 }}>
        <button onClick={() => goTo('landing')} style={backStyle}>←</button>
        <h1 style={titleStyle}>Acceso restringido</h1>
        <p style={bodyStyle}>{!authToken ? 'Ingresa como admin.' : 'Tu usuario no tiene rol admin.'}</p>
      </div>
    )
  }

  return (
    <div className="screen" style={{ background: 'var(--gray-50)', gap: 14 }}>
      <button onClick={() => goTo('landing')} style={backStyle}>←</button>
      <div>
        <div style={eyebrowStyle}>Safety</div>
        <h1 style={titleStyle}>Reglas de ingredientes</h1>
      </div>

      <form onSubmit={submit} style={cardStyle}>
        <div style={sectionTitleStyle}>Nueva regla</div>
        <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Nombre" style={inputStyle} />
        <input value={form.ingredient_pattern} onChange={event => setForm({ ...form, ingredient_pattern: event.target.value })} placeholder="Patrón ingrediente/regex" style={inputStyle} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input value={form.restriction_code} onChange={event => setForm({ ...form, restriction_code: event.target.value })} placeholder="Restricción" style={inputStyle} />
          <input value={form.safety_condition_code} onChange={event => setForm({ ...form, safety_condition_code: event.target.value })} placeholder="Condición safety" style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <select value={form.action} onChange={event => setForm({ ...form, action: event.target.value })} style={inputStyle}>
            <option value="warn">warn</option>
            <option value="penalize">penalize</option>
            <option value="block">block</option>
          </select>
          <select value={form.severity} onChange={event => setForm({ ...form, severity: event.target.value })} style={inputStyle}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
        <textarea value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} placeholder="Mensaje visible para usuario/admin" style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
        <button className="btn-primary">Guardar regla</button>
      </form>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre, patrón o mensaje..."
        style={inputStyle}
      />

      {loading && <p style={bodyStyle}>Cargando reglas...</p>}
      {!loading && rules.length > 0 && filteredRules.length === 0 && <p style={bodyStyle}>Sin resultados para "{search}".</p>}
      {confirmToggle && (
        <ConfirmToggle
          rule={confirmToggle}
          onConfirm={() => { const r = confirmToggle; setConfirmToggle(null); toggle(r) }}
          onCancel={() => setConfirmToggle(null)}
        />
      )}

      {filteredRules.map(rule => (
        <div key={rule.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--gray-800)' }}>{rule.name}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 3 }}>{rule.action} · {rule.severity} · {rule.active ? 'activa' : 'inactiva'}</div>
            </div>
            <button type="button" className="btn-secondary" onClick={() => rule.active ? setConfirmToggle(rule) : toggle(rule)} style={{ padding: '7px 10px', fontSize: 12 }}>
              {rule.active ? 'Desactivar' : 'Activar'}
            </button>
          </div>
          <p style={{ ...bodyStyle, fontSize: 12, marginTop: 8 }}>{rule.message}</p>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 7, wordBreak: 'break-word' }}>
            Patrón: {rule.ingredient_pattern}
          </div>
        </div>
      ))}
    </div>
  )
}

function ConfirmToggle({ rule, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--gray-800)', marginBottom: 10 }}>¿Desactivar regla?</div>
        <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}><strong>{rule.name}</strong></p>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 18 }}>{rule.message}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button type="button" onClick={onCancel} style={{ border: 'none', borderRadius: 9, background: 'var(--gray-100)', color: 'var(--gray-700)', padding: 9, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>
          <button type="button" onClick={onConfirm} style={{ border: 'none', borderRadius: 9, background: '#FEF2F2', color: '#B91C1C', padding: 9, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Desactivar</button>
        </div>
      </div>
    </div>
  )
}

const backStyle = { background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 20, alignSelf: 'flex-start', cursor: 'pointer' }
const eyebrowStyle = { fontSize: 12, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }
const titleStyle = { fontSize: 25, color: 'var(--gray-800)', lineHeight: 1.2 }
const bodyStyle = { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.45 }
const sectionTitleStyle = { fontSize: 13, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 8 }
const cardStyle = { background: 'white', borderRadius: 'var(--radius-sm)', padding: 14, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 9 }
const inputStyle = { border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '10px 12px', fontSize: 13, background: 'white', minWidth: 0, fontFamily: 'inherit' }
