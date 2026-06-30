import { useEffect, useState } from 'react'
import { getUserPersonal, updateUserPersonal, deleteUserPersonal } from '../api/suplematch'
import { useAuth } from '../context/AuthContext'

const COUNTRY_LABELS = {
  PE: 'Perú', CO: 'Colombia', AR: 'Argentina',
  CL: 'Chile', MX: 'México', ES: 'España',
}

const EMPTY = {
  first_name: '', last_name: '', phone: '',
  country: 'PE', city: '', district: '',
  date_of_birth: '', document_type: 'DNI', document_number: '',
}

export default function Perfil({ goTo, showToast }) {
  const { authToken, authUser } = useAuth()
  const [data,          setData]          = useState(null)
  const [form,          setForm]          = useState(EMPTY)
  const [editing,       setEditing]       = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [loading,       setLoading]       = useState(Boolean(authToken))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,      setDeleting]      = useState(false)

  useEffect(() => {
    if (!authToken) return
    let cancelled = false
    async function load() {
      try {
        const result = await getUserPersonal(authToken)
        if (!cancelled) { setData(result); syncForm(result) }
      } catch (err) {
        const is404 = err?.message?.includes('404') || err?.message?.toLowerCase().includes('not found')
        if (!is404 && !cancelled) showToast('Error al cargar datos personales')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [authToken, showToast])

  function syncForm(source) {
    setForm({
      first_name:      source.first_name      ?? '',
      last_name:       source.last_name        ?? '',
      phone:           source.phone            ?? '',
      country:         source.country          ?? 'PE',
      city:            source.city             ?? '',
      district:        source.district         ?? '',
      date_of_birth:   source.date_of_birth    ?? '',
      document_type:   source.document_type    ?? 'DNI',
      document_number: source.document_number  ?? '',
    })
  }

  function patch(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function startEdit() {
    if (data) syncForm(data)
    setEditing(true)
  }

  async function save() {
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== '')
    )
    setSaving(true)
    try {
      const result = await updateUserPersonal(payload, authToken)
      setData(result)
      setEditing(false)
      showToast('Datos actualizados')
    } catch (error) {
      showToast(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function doDelete() {
    setDeleting(true)
    try {
      await deleteUserPersonal(authToken)
      setData(null)
      setForm(EMPTY)
      setConfirmDelete(false)
      setEditing(false)
      showToast('Datos personales eliminados')
    } catch (error) {
      showToast(error.message)
    } finally {
      setDeleting(false)
    }
  }

  if (!authToken) {
    return (
      <div className="screen" style={{ background: 'white', gap: 18 }}>
        <button onClick={() => goTo('landing')} style={backSt}>←</button>
        <h1 style={titleSt}>Mi perfil</h1>
        <p style={bodySt}>Inicia sesión para ver tu perfil.</p>
        <button className="btn-primary" onClick={() => goTo('acceso')}>Ingresar</button>
      </div>
    )
  }

  return (
    <div className="screen" style={{ background: 'var(--gray-50)', gap: 0 }}>

      {confirmDelete && (
        <div style={overlayWrap}>
          <div style={overlayBox}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 8 }}>
              Eliminar datos personales
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5, marginBottom: 20 }}>
              Borra nombre, teléfono, ciudad y documento. Tu cuenta e historial de recomendaciones no se ven afectados.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancelar</button>
              <button
                disabled={deleting}
                onClick={doDelete}
                style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => goTo('landing')} style={{ ...backSt, marginBottom: 16 }}>←</button>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Cuenta
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-800)' }}>Mi perfil</div>
      </div>

      {/* Account badge */}
      <div style={{ ...cardSt, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
          Cuenta
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)' }}>{authUser?.email}</div>
        {authUser?.roles?.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 3 }}>{authUser.roles.join(', ')}</div>
        )}
      </div>

      {loading ? (
        <p style={bodySt}>Cargando...</p>
      ) : editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto', paddingRight: 2 }}>
          <div style={cardSt}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-700)', marginBottom: 14 }}>
              Datos personales
            </div>
            {[
              { key: 'first_name',      label: 'Nombre',                  placeholder: 'Ana',            type: 'text' },
              { key: 'last_name',       label: 'Apellido',                placeholder: 'López',           type: 'text' },
              { key: 'phone',           label: 'Teléfono',                placeholder: '+51 999 999 999', type: 'tel'  },
              { key: 'city',            label: 'Ciudad',                  placeholder: 'Lima',            type: 'text' },
              { key: 'district',        label: 'Distrito (opcional)',     placeholder: 'Miraflores',      type: 'text' },
              { key: 'date_of_birth',   label: 'Fecha de nacimiento',    placeholder: '',                 type: 'date' },
              { key: 'document_number', label: 'Nº documento (opcional)', placeholder: '12345678',        type: 'text' },
            ].map(f => (
              <label key={f.key} style={fieldLabelSt}>
                {f.label}
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => patch(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={inputSt}
                />
              </label>
            ))}
            <label style={fieldLabelSt}>
              País
              <select value={form.country} onChange={e => patch('country', e.target.value)} style={inputSt}>
                <option value="PE">Perú</option>
                <option value="CO">Colombia</option>
                <option value="AR">Argentina</option>
                <option value="CL">Chile</option>
                <option value="MX">México</option>
                <option value="ES">España</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>
            <label style={{ ...fieldLabelSt, marginBottom: 0 }}>
              Tipo de documento
              <select value={form.document_type} onChange={e => patch('document_type', e.target.value)} style={inputSt}>
                {['DNI', 'CE', 'Pasaporte', 'RUC'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
            <button className="btn-primary" disabled={saving} onClick={save}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto', paddingRight: 2 }}>
          <div style={cardSt}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-700)', marginBottom: 14 }}>
              Datos personales
            </div>
            {data ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Nombre',     [data.first_name, data.last_name].filter(Boolean).join(' ')],
                  ['Teléfono',   data.phone],
                  ['País',       COUNTRY_LABELS[data.country] ?? data.country],
                  ['Ciudad',     data.city],
                  ['Distrito',   data.district],
                  ['Nacimiento', data.date_of_birth],
                  ['Documento',  data.document_type && data.document_number ? `${data.document_type} ${data.document_number}` : null],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 700, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, color: 'var(--gray-800)', textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 0 }}>
                No hay datos personales guardados aún.
              </p>
            )}
          </div>

          <button className="btn-primary" onClick={startEdit}>
            {data ? 'Editar datos' : 'Agregar datos personales'}
          </button>

          {data && (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ background: 'none', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', color: '#B91C1C', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '10px 16px' }}
            >
              Eliminar datos personales
            </button>
          )}

          <p style={{ fontSize: 11, color: 'var(--gray-400)', lineHeight: 1.4, textAlign: 'center', padding: '0 8px', marginTop: 4 }}>
            Estos datos están separados de tus recomendaciones. Eliminarlos no borra tu historial.
          </p>
        </div>
      )}
    </div>
  )
}

const backSt       = { background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 20, alignSelf: 'flex-start', cursor: 'pointer' }
const titleSt      = { fontSize: 25, color: 'var(--gray-800)', lineHeight: 1.2 }
const bodySt       = { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.45 }
const cardSt       = { background: 'white', borderRadius: 'var(--radius-sm)', padding: 16, boxShadow: 'var(--shadow)' }
const fieldLabelSt = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--gray-600)', fontWeight: 700, marginBottom: 12 }
const inputSt      = { width: '100%', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: '11px 13px', fontSize: 14, color: 'var(--gray-800)', background: 'white', outline: 'none', minHeight: 44 }
const overlayWrap  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }
const overlayBox   = { background: 'white', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }
