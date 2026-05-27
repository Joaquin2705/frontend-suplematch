import { useEffect, useState } from 'react'

const MOCK_RESULT = {
  condiciones: [
    { nombre: 'Déficit de Vitamina D', nivel: 'Alta prob.',  probabilidad: 0.82, emoji: '😌' },
    { nombre: 'Baja Inmunidad',        nivel: 'Media prob.', probabilidad: 0.55, emoji: '🛡️' },
    { nombre: 'Base saludable',        nivel: 'Confirmado',  probabilidad: 0.28, emoji: '✅' },
  ],
  recomendaciones: [
    { nombre: 'Vitamina D3', dosis: '1000 UI / día', razon: 'Por déficit detectado',  precio: 16, icon: '☀️' },
    { nombre: 'Zinc',        dosis: '15 mg / día',   razon: 'Refuerza inmunidad',      precio: 12, icon: '⚡' },
    { nombre: 'Vitamina C',  dosis: '500 mg / día',  razon: 'Potencia el zinc',        precio: 8,  icon: '🍊' },
  ],
}

async function callBackend(userData) {
  const res = await fetch('/api/analizar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })
  if (!res.ok) throw new Error('Backend error')
  return res.json()
}

const STEPS = [
  'Hábitos procesados',
  'Síntomas evaluados',
  'Detectando condiciones...',
]

export default function Loading({ goTo, userData, setApiResult }) {
  const [doneCount, setDoneCount] = useState(2)

  useEffect(() => {
    let cancelled = false

    async function run() {
      let result
      try {
        result = await callBackend(userData)
      } catch {
        result = MOCK_RESULT
      }

      if (cancelled) return
      setDoneCount(3)
      setTimeout(() => {
        if (!cancelled) {
          setApiResult(result)
          goTo('condiciones')
        }
      }, 600)
    }

    const t = setTimeout(run, 1200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [goTo, userData, setApiResult])

  return (
    <div className="screen" style={{ background: 'white', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        border: '4px solid var(--gray-200)',
        borderTopColor: 'var(--green)',
        animation: 'spin 1s linear infinite'
      }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 32 }}>
          Analizando tu perfil...
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {STEPS.map((label, i) => {
            const done = i < doneCount
            const isLast = i === STEPS.length - 1
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{done ? '✅' : '⏳'}</span>
                <span style={{ fontSize: 15, color: done ? 'var(--green)' : 'var(--gray-400)', fontWeight: done ? 500 : 400 }}>
                  {done && isLast ? 'Condiciones detectadas' : label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
