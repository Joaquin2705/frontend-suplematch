import { useEffect, useState } from 'react'
import { postRecommendation } from '../api/suplematch'

const MOCK_RESULT = {
  recommendation_id: 'rec_mock',
  packs_ranked: [],
  conditions: ['DEFICIT_VIT_D', 'BAJA_INMUNIDAD'],
  recomendaciones: [
    { icon: '☀️', nombre: 'Vitamina D3', dosis: '1000 UI / día', razon: 'Por déficit detectado',  precio: 16 },
    { icon: '⚡', nombre: 'Zinc',        dosis: '15 mg / día',   razon: 'Refuerza inmunidad',      precio: 12 },
    { icon: '🍊', nombre: 'Vitamina C',  dosis: '500 mg / día',  razon: 'Potencia el zinc',        precio: 8  },
  ],
  condiciones: [
    { nombre: 'Déficit de Vitamina D', nivel: 'Alta prob.',  probabilidad: 0.82, emoji: '😌' },
    { nombre: 'Baja Inmunidad',        nivel: 'Media prob.', probabilidad: 0.55, emoji: '🛡️' },
    { nombre: 'Base saludable',        nivel: 'Confirmado',  probabilidad: 0.28, emoji: '✅' },
  ],
}

async function callBackend(userData) {
  const result = await postRecommendation(userData)
  return normalizeResult(result)
}

function normalizeResult(result) {
  const conditions = result.conditions ?? []
  const conditionsDisplay = result.conditions_display ?? []
  const recommendations = result.recommendations ?? []
  const packsRanked = result.packs_ranked ?? []

  return {
    ...result,
    packs_ranked: packsRanked.map(pack => ({
      ...pack,
      selected_products: normalizeProducts(pack.selected_products ?? []),
    })),
    condiciones: (conditionsDisplay.length ? conditionsDisplay : conditions.map(condition => ({ code: condition }))).map((condition, index) => ({
      nombre: condition.display_name ?? formatCondition(condition.code),
      nivel: condition.level ?? (index === 0 ? 'Detectado' : 'Relacionado'),
      probabilidad: condition.probability ?? (index === 0 ? 0.82 : 0.55),
      emoji: iconToEmoji(condition.icon_key, index),
    })),
    recomendaciones: recommendations.map((item, index) => ({
      component_id: item.component_id,
      nombre: item.display_name ?? item.name,
      razon: item.reason ?? item.condition_display ?? 'Recomendado para tu perfil',
      dosis: item.dosage_hint ?? item.type_display ?? 'Complementario',
      products: normalizeProducts(item.products ?? []),
      precio: bestProductPrice(item.products) ?? [16, 12, 8, 18, 22][index % 5],
      icon: iconToEmoji(item.icon_key, index),
    })),
  }
}

function normalizeProducts(products) {
  return products
    .filter(product => product?.url && product?.price != null)
    .map(product => ({
      pharmacy: product.pharmacy,
      commercial_name: product.commercial_name,
      formal_name: product.formal_name,
      registro_sanitario: product.registro_sanitario,
      digemid_producto: product.digemid_producto,
      component_id: product.component_id,
      ingredient: product.ingredient,
      amount: product.amount,
      unit: product.unit,
      amount_mg: product.amount_mg,
      component_match_score: product.component_match_score,
      price: Number(product.price),
      currency: product.currency ?? 'PEN',
      availability: product.availability,
      url: product.url,
      sku: product.sku,
      brand: product.brand,
      regulatory_status: product.regulatory_status,
    }))
}

function bestProductPrice(products = []) {
  const prices = products
    .map(product => Number(product?.price))
    .filter(price => Number.isFinite(price))

  return prices.length ? Math.min(...prices) : null
}

function iconToEmoji(iconKey, fallbackIndex = 0) {
  const icons = {
    activity: '😌',
    check: '✅',
    sun: '☀️',
    bone: '🦴',
    zap: '⚡',
    citrus: '🍊',
    moon: '🌙',
    waves: '🌊',
    pill: '💊',
  }

  return icons[iconKey] ?? ['☀️', '⚡', '🍊', '💊', '🌿'][fallbackIndex % 5]
}

function formatCondition(value) {
  if (!value) return 'Perfil evaluado'
  return value
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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
