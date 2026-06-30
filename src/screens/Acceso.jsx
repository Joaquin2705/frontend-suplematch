import { useState } from 'react'
import { changePassword, login, register } from '../api/suplematch'
import { saveSession, clearSession } from '../api/authStorage'
import { useAuth } from '../context/AuthContext'

export default function Acceso({ goTo, showToast }) {
  const { authToken, setAuthToken, setAuthUser } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [weightValue, setWeightValue] = useState('')
  const [weightUnit, setWeightUnit] = useState('kg')
  const [heightValue, setHeightValue] = useState('')
  const [heightUnit, setHeightUnit] = useState('cm')
  const [heightFeet, setHeightFeet] = useState('')
  const [heightInches, setHeightInches] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (mode === 'change') {
      if (!authToken) {
        showToast('Inicia sesión para cambiar contraseña')
        return
      }
      setSending(true)
      try {
        await changePassword({ current_password: password, new_password: newPassword }, authToken)
        clearSession()
        setAuthToken(null)
        setAuthUser(null)
        showToast('Contraseña actualizada. Inicia sesión de nuevo')
        setPassword('')
        setNewPassword('')
        setMode('login')
      } catch (error) {
        showToast(error.message)
      } finally {
        setSending(false)
      }
      return
    }

    if (!email.trim() || password.length < 8) {
      showToast('Ingresa email y contraseña de 8+ caracteres')
      return
    }
    if (mode === 'register') {
      const parsedAge = Number(age)
      const parsedWeight = Number(weightValue)
      const heightCm = registrationHeightCm({ heightValue, heightUnit, heightFeet, heightInches })
      if (!firstName.trim() || !lastName.trim()) {
        showToast('Ingresa nombres y apellidos')
        return
      }
      if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        showToast('Ingresa una edad válida')
        return
      }
      if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
        showToast('Ingresa un peso válido')
        return
      }
      if (!heightCm || heightCm < 40 || heightCm > 260) {
        showToast('Ingresa una estatura válida')
        return
      }
    }

    setSending(true)
    try {
      const heightCm = registrationHeightCm({ heightValue, heightUnit, heightFeet, heightInches })
      const result = mode === 'login'
        ? await login({ email, password })
        : await register({
          email,
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          age: Number(age),
          weight_value: Number(weightValue),
          weight_unit: weightUnit,
          height_value: Number(heightCm.toFixed(2)),
          height_unit: 'cm',
        })
      saveSession(result)
      setAuthToken(result.access_token)
      setAuthUser(result.user)
      showToast('Sesión iniciada')
      goTo('landing')
    } catch (error) {
      showToast(error.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="screen app-shell">
      <button onClick={() => goTo('landing')} className="back-link" type="button">← Volver</button>
      <header className="surface">
        <div className="app-kicker">Cuenta SupleMatch</div>
        <h1 className="app-title" style={{ marginTop: 6 }}>
          {titleForMode(mode)}
        </h1>
        <p className="app-subtitle" style={{ marginTop: 8 }}>
          Guarda tu historial, reutiliza exámenes y mejora futuras recomendaciones sin repetir todo desde cero.
        </p>
      </header>

      <div className="surface-soft" style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          ['login', 'Ingresar'],
          ['register', 'Crear cuenta'],
          ...(authToken ? [['change', 'Cambiar clave']] : []),
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            style={{
              border: `1.5px solid ${mode === value ? 'var(--green)' : 'var(--gray-200)'}`,
              background: mode === value ? 'var(--green-light)' : 'white',
              color: mode === value ? 'var(--green-dark)' : 'var(--gray-600)',
              borderRadius: 10,
              padding: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <form className="surface" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'register' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                value={firstName}
                onChange={event => setFirstName(event.target.value)}
                placeholder="Nombres"
                autoComplete="given-name"
                style={inputStyle}
              />
              <input
                value={lastName}
                onChange={event => setLastName(event.target.value)}
                placeholder="Apellidos"
                autoComplete="family-name"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 0.8fr', gap: 8 }}>
              <input
                value={age}
                onChange={event => setAge(event.target.value)}
                placeholder="Edad"
                type="number"
                min="1"
                max="120"
                inputMode="numeric"
                style={inputStyle}
              />
              <input
                value={weightValue}
                onChange={event => setWeightValue(event.target.value)}
                placeholder="Peso"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                style={inputStyle}
              />
              <select value={weightUnit} onChange={event => setWeightUnit(event.target.value)} style={inputStyle} aria-label="Unidad de peso">
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: heightUnit === 'ft_in' ? '1fr 1fr 0.9fr' : '1fr 0.9fr', gap: 8 }}>
              {heightUnit === 'ft_in' ? (
                <>
                  <input
                    value={heightFeet}
                    onChange={event => setHeightFeet(event.target.value)}
                    placeholder="Pies"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    style={inputStyle}
                  />
                  <input
                    value={heightInches}
                    onChange={event => setHeightInches(event.target.value)}
                    placeholder="Pulgadas"
                    type="number"
                    min="0"
                    max="11.99"
                    step="0.1"
                    inputMode="decimal"
                    style={inputStyle}
                  />
                </>
              ) : (
                <input
                  value={heightValue}
                  onChange={event => setHeightValue(event.target.value)}
                  placeholder="Estatura"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  style={inputStyle}
                />
              )}
              <select value={heightUnit} onChange={event => setHeightUnit(event.target.value)} style={inputStyle} aria-label="Unidad de estatura">
                <option value="cm">cm</option>
                <option value="ft_in">ft + in</option>
              </select>
            </div>
          </>
        )}
        {['login', 'register'].includes(mode) && (
          <input
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
            style={inputStyle}
          />
        )}
        {['login', 'register', 'change'].includes(mode) && (
          <input
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder={mode === 'change' ? 'Contraseña actual' : 'Contraseña'}
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={inputStyle}
          />
        )}
        {mode === 'change' && (
          <input
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            placeholder="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            style={inputStyle}
          />
        )}
        {['register', 'change'].includes(mode) && (
          <div style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4 }}>
            La contraseña debe tener mínimo 8 caracteres, letras y números. Evita claves comunes.
          </div>
        )}
        <button className="btn-primary" disabled={sending}>
          {sending ? 'Procesando...' : buttonForMode(mode)}
        </button>
      </form>

      <section className="routine-card">
        <div className="section-title">Por qué crear cuenta</div>
        <div className="routine-row">
          <span className="routine-icon">1</span>
          <div>
            <strong>Historial de recomendaciones</strong>
            <small>Compara resultados y feedback a lo largo del tiempo.</small>
          </div>
        </div>
        <div className="routine-row">
          <span className="routine-icon">2</span>
          <div>
            <strong>Exámenes reutilizables</strong>
            <small>Usa biomarcadores confirmados en nuevas evaluaciones.</small>
          </div>
        </div>
        <div className="routine-row">
          <span className="routine-icon">3</span>
          <div>
            <strong>Mayor personalización</strong>
            <small>El sistema conserva contexto sin convertirlo en diagnóstico médico.</small>
          </div>
        </div>
      </section>
    </div>
  )
}

function titleForMode(mode) {
  if (mode === 'register') return 'Crea una cuenta para historial y perfil'
  if (mode === 'change') return 'Cambia tu contraseña'
  return 'Ingresa para guardar tu perfil'
}

function buttonForMode(mode) {
  if (mode === 'register') return 'Crear cuenta'
  if (mode === 'change') return 'Cambiar contraseña'
  return 'Ingresar'
}

function registrationHeightCm({ heightValue, heightUnit, heightFeet, heightInches }) {
  if (heightUnit === 'ft_in') {
    const feet = Number(heightFeet)
    const inches = Number(heightInches || 0)
    if (!Number.isFinite(feet) || feet <= 0 || !Number.isFinite(inches) || inches < 0) return null
    return feet * 30.48 + inches * 2.54
  }

  const cm = Number(heightValue)
  if (!Number.isFinite(cm) || cm <= 0) return null
  return cm
}

const inputStyle = {
  border: '1.5px solid var(--gray-200)',
  borderRadius: 12,
  padding: '14px 15px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
}
