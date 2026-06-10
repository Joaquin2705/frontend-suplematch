import { useState } from 'react'
import { changePassword, forgotPassword, login, register, resetPassword } from '../api/suplematch'

export default function Acceso({ goTo, showToast, authToken, setAuthToken, setAuthUser }) {
  const initialResetToken = new URLSearchParams(window.location.search).get('reset_token') || ''
  const [mode, setMode] = useState(initialResetToken ? 'reset' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetToken, setResetToken] = useState(initialResetToken)
  const [tokenAutoFilled, setTokenAutoFilled] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (mode === 'forgot') {
      if (!email.trim()) {
        showToast('Ingresa tu correo')
        return
      }
      setSending(true)
      try {
        const result = await forgotPassword({ email })
        if (result.reset_token) {
          setResetToken(result.reset_token)
          setTokenAutoFilled(true)
        }
        showToast(result.reset_token ? 'Listo, define tu nueva contraseña' : result.message)
        setMode('reset')
      } catch (error) {
        showToast(error.message)
      } finally {
        setSending(false)
      }
      return
    }

    if (mode === 'reset') {
      if (!resetToken.trim() || newPassword.length < 8) {
        showToast('Ingresa token y nueva contraseña')
        return
      }
      setSending(true)
      try {
        await resetPassword({ token: resetToken, new_password: newPassword })
        showToast('Contraseña actualizada')
        setMode('login')
        setPassword('')
        setNewPassword('')
        setResetToken('')
      } catch (error) {
        showToast(error.message)
      } finally {
        setSending(false)
      }
      return
    }

    if (mode === 'change') {
      if (!authToken) {
        showToast('Inicia sesión para cambiar contraseña')
        return
      }
      setSending(true)
      try {
        await changePassword({ current_password: password, new_password: newPassword }, authToken)
        localStorage.removeItem('suplematch_token')
        localStorage.removeItem('suplematch_refresh_token')
        localStorage.removeItem('suplematch_user')
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

    setSending(true)
    try {
      const result = mode === 'login'
        ? await login({ email, password })
        : await register({ email, password, display_name: displayName || null })
      localStorage.setItem('suplematch_token', result.access_token)
      localStorage.setItem('suplematch_refresh_token', result.refresh_token)
      localStorage.setItem('suplematch_user', JSON.stringify(result.user))
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
    <div className="screen" style={{ background: 'white', gap: 18 }}>
      <button onClick={() => goTo('landing')} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 20, alignSelf: 'flex-start', cursor: 'pointer' }}>←</button>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Cuenta SupleMatch
        </div>
        <h1 style={{ fontSize: 25, color: 'var(--gray-800)', lineHeight: 1.2 }}>
          {titleForMode(mode)}
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          ['login', 'Ingresar'],
          ['register', 'Crear cuenta'],
          ['forgot', 'Recuperar'],
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

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'register' && (
          <input
            value={displayName}
            onChange={event => setDisplayName(event.target.value)}
            placeholder="Nombre visible"
            style={inputStyle}
          />
        )}
        {['login', 'register', 'forgot'].includes(mode) && (
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
        {mode === 'reset' && !tokenAutoFilled && (
          <textarea
            value={resetToken}
            onChange={event => setResetToken(event.target.value)}
            placeholder="Token de recuperación"
            style={{ ...inputStyle, minHeight: 82, resize: 'vertical' }}
          />
        )}
        {mode === 'reset' && tokenAutoFilled && (
          <div style={{ fontSize: 13, color: 'var(--green-dark)', background: 'var(--green-light)', borderRadius: 10, padding: '12px 14px' }}>
            Token recibido. Solo ingresa tu nueva contraseña.
          </div>
        )}
        {['reset', 'change'].includes(mode) && (
          <input
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            placeholder="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            style={inputStyle}
          />
        )}
        {['register', 'reset', 'change'].includes(mode) && (
          <div style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4 }}>
            La contraseña debe tener mínimo 8 caracteres, letras y números. Evita claves comunes.
          </div>
        )}
        <button className="btn-primary" disabled={sending}>
          {sending ? 'Procesando...' : buttonForMode(mode)}
        </button>
      </form>
    </div>
  )
}

function titleForMode(mode) {
  if (mode === 'register') return 'Crea una cuenta para historial y perfil'
  if (mode === 'forgot') return 'Recupera acceso a tu cuenta'
  if (mode === 'reset') return 'Define una nueva contraseña'
  if (mode === 'change') return 'Cambia tu contraseña'
  return 'Ingresa para guardar tu perfil'
}

function buttonForMode(mode) {
  if (mode === 'register') return 'Crear cuenta'
  if (mode === 'forgot') return 'Solicitar recuperación'
  if (mode === 'reset') return 'Actualizar contraseña'
  if (mode === 'change') return 'Cambiar contraseña'
  return 'Ingresar'
}

const inputStyle = {
  border: '1.5px solid var(--gray-200)',
  borderRadius: 12,
  padding: '14px 15px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
}
