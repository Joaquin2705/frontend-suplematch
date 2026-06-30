export const FALLBACK = [
  { icon: '☀️', nombre: 'Vitamina D3', razon: 'Por déficit detectado', dosis: '1000 UI / día', precio: null, products: [] },
  { icon: '⚡', nombre: 'Zinc',        razon: 'Refuerza inmunidad',     dosis: '15 mg / día',   precio: null, products: [] },
  { icon: '🍊', nombre: 'Vitamina C',  razon: 'Potencia el zinc',       dosis: '500 mg / día',  precio: null, products: [] },
]

export const COMPONENT_SUPPORT_COPY = [
  {
    match: ['vitamina d'],
    supports: ['salud ósea', 'función muscular', 'baja exposición solar'],
    watch: ['cansancio', 'molestias musculares', 'poca exposición solar'],
  },
  {
    match: ['vitamina b12', 'b12'],
    supports: ['energía', 'sistema nervioso', 'dietas vegetarianas o veganas'],
    watch: ['fatiga', 'niebla mental', 'baja ingesta animal'],
  },
  {
    match: ['hierro'],
    supports: ['energía', 'transporte de oxígeno', 'rendimiento diario'],
    watch: ['cansancio', 'bajo rendimiento', 'uñas frágiles'],
  },
  {
    match: ['ácido fólico', 'acido folico', 'folato'],
    supports: ['metabolismo celular', 'dieta con verduras/menestras', 'soporte nutricional'],
    watch: ['fatiga', 'baja variedad dietaria', 'bajo consumo de verduras'],
  },
  {
    match: ['vitamina c'],
    supports: ['antioxidantes', 'soporte inmune', 'bajo consumo de frutas y verduras'],
    watch: ['pocas frutas y verduras', 'resfríos frecuentes', 'fatiga'],
  },
  {
    match: ['omega', 'epa', 'dha'],
    supports: ['ingesta baja de pescado', 'perfil cognitivo', 'balance de grasas saludables'],
    watch: ['poco pescado', 'objetivo de enfoque', 'recuperación como contexto'],
  },
  {
    match: ['proteína', 'proteina', 'whey'],
    supports: ['masa muscular', 'saciedad', 'recuperación física'],
    watch: ['fatiga', 'recuperación lenta', 'baja proteína estimada'],
  },
  {
    match: ['magnesio'],
    supports: ['función muscular', 'calambres', 'descanso como contexto'],
    watch: ['calambres', 'estrés o sueño irregular', 'recuperación lenta'],
  },
  {
    match: ['zinc'],
    supports: ['piel, cabello y uñas', 'soporte inmune', 'brechas dietarias'],
    watch: ['uñas quebradizas', 'piel seca', 'resfríos frecuentes'],
  },
  {
    match: ['calcio'],
    supports: ['salud ósea', 'baja ingesta de lácteos o fortificados', 'perfil de edad'],
    watch: ['baja ingesta de calcio', 'poca vitamina D', 'salud ósea como objetivo'],
  },
  {
    match: ['creatina'],
    supports: ['rendimiento físico', 'fuerza', 'recuperación deportiva'],
    watch: ['entrenamiento frecuente', 'recuperación lenta', 'objetivo de rendimiento'],
  },
  {
    match: ['luteína', 'luteina', 'zeaxantina'],
    supports: ['salud visual contextual', 'uso de pantallas', 'carotenoides dietarios'],
    watch: ['muchas horas de pantalla', 'pocas frutas y verduras', 'vista cansada como contexto'],
  },
  {
    match: ['probiótico', 'probiotico', 'bacillus', 'bifidobacterium'],
    supports: ['bienestar digestivo', 'microbiota como contexto', 'alimentación poco variada'],
    watch: ['molestia digestiva', 'alimentación poco variada'],
  },
  {
    match: ['sodio', 'potasio'],
    supports: ['electrolitos', 'sudor intenso', 'calambres como contexto'],
    watch: ['sudor frecuente', 'calambres', 'baja agua diaria estimada'],
  },
]

export function formatPrice(value) {
  const price = Number(value)
  if (!Number.isFinite(price)) return 'Ver precio'
  return `S/ ${price.toFixed(2)}`
}

export function verificationLabel(product) {
  if (!product) return null
  if (product.commercial_quality_flags?.has_valid_registration && product.commercial_quality_flags?.has_traceable_components) return 'Producto trazable'
  const rs = product.registro_sanitario && product.registro_sanitario !== 'N/D'
  const traceable = product.regulatory_status && product.regulatory_status !== 'N/D'
  if (rs && traceable) return 'RS y componente trazables'
  if (rs) return 'RS informado'
  if (traceable) return 'Componente inferido'
  return 'Trazabilidad limitada'
}

export function productBlocked(product) {
  return product?.commercial_decision === 'blocked' || product?.product_safety_blocked === true
}

export function commercialScoreLabel(product) {
  const score = Number(product?.commercial_score ?? product?.product_score)
  if (!Number.isFinite(score)) return null
  return `Score comercial ${Math.round(score * 100)}`
}

export function productBadges(product) {
  const flags = product?.commercial_quality_flags ?? {}
  const badges = []
  if (flags.is_unit_component || product?.component_match_type === 'unit_component') badges.push(['Unitario', 'var(--green-dark)', 'var(--green-light)'])
  if (flags.is_multicomponent || product?.component_match_type === 'multi_component') badges.push(['Multicomponente', '#92400E', 'var(--amber-light)'])
  if (flags.has_valid_registration) badges.push(['RS trazable', 'var(--green-dark)', 'var(--green-light)'])
  if (flags.has_verified_label_flags) badges.push(['Etiqueta verificada', '#1D4ED8', '#DBEAFE'])
  if (flags.has_inferred_label_flags) badges.push(['Restricciones inferidas', '#92400E', 'var(--amber-light)'])
  if (flags.contains_fish_or_shellfish) badges.push(['Pescado/mariscos', '#B91C1C', '#FEF2F2'])
  if (flags.may_contain_gelatin) badges.push(['Gelatina posible', '#92400E', 'var(--amber-light)'])
  if (flags.may_contain_dairy) badges.push(['Lácteos posible', '#B91C1C', '#FEF2F2'])
  if (flags.may_contain_soy) badges.push(['Soya posible', '#B91C1C', '#FEF2F2'])
  return badges.slice(0, 4)
}

export function productDescription(rec, product) {
  const pieces = []
  if (product?.formal_name && product.formal_name !== product.commercial_name) pieces.push(product.formal_name)
  if (product?.ingredient) pieces.push(`Ingrediente principal: ${product.ingredient}`)
  if (product?.amount || product?.unit) pieces.push(`Contenido declarado: ${[product.amount, product.unit].filter(Boolean).join(' ')}`)
  if (rec?.condicion_display) pieces.push(`Relacionado con ${naturalConditionText(rec.condicion_display)}.`)
  return pieces.filter(Boolean).slice(0, 4)
}

export function isProductUserSafe(product) {
  const name = String(product?.commercial_name || '').toLowerCase()
  const ingredient = String(product?.ingredient || '').toLowerCase()
  const nonSupplementHints = ['esparadrapo', 'apósito', 'vendaje', 'crema', 'shampoo', 'champú', 'gel tópico']
  if (nonSupplementHints.some(hint => name.includes(hint))) return false
  if (product?.commercial_decision === 'blocked' || product?.product_safety_blocked) return false
  if (!product?.commercial_quality_flags?.has_traceable_components && !product?.component_traceable && !ingredient) return false
  return true
}

export function availableStoresFor(rec, currentProduct) {
  const byStore = new Map()
  const candidates = (rec?.products ?? []).filter(product => isProductUserSafe(product))
  for (const product of candidates) {
    const key = `${product.pharmacy}-${product.url || product.commercial_name}`
    if (!byStore.has(key)) byStore.set(key, product)
  }
  if (currentProduct) {
    const key = `${currentProduct.pharmacy}-${currentProduct.url || currentProduct.commercial_name}`
    byStore.set(key, currentProduct)
  }
  return [...byStore.values()]
    .sort((a, b) => Number(a.price ?? 999999) - Number(b.price ?? 999999))
    .slice(0, 4)
}

export function stageInfo(rec) {
  const stage = rec?.model2_stage
  if (stage === 'evidence_validated') return { label: 'Respaldo alto', detail: 'La sugerencia coincide con evidencia y reglas internas.', color: 'var(--green-dark)', bg: 'var(--green-light)' }
  if (stage === 'graph_support') return { label: 'Respaldo funcional', detail: 'El grafo encontró relación útil con tu perfil.', color: '#1D4ED8', bg: '#DBEAFE' }
  if (stage === 'artifact_seed_fallback') return { label: 'Respaldo limitado', detail: 'Se muestra como orientación cuando falta más información.', color: '#92400E', bg: 'var(--amber-light)' }
  return { label: 'Orientativo', detail: 'Basado en reglas generales del perfil.', color: 'var(--gray-600)', bg: 'var(--gray-100)' }
}

export function evidenceInfo(rec) {
  const strength = String(rec?.evidence_strength ?? '').toLowerCase()
  if (['high', 'strong', 'strong_with_lab'].includes(strength)) return 'alto'
  if (['moderate', 'low_moderate'].includes(strength)) return 'medio'
  if (strength === 'contextual') return 'contextual'
  if (strength === 'supportive_graph') return 'funcional'
  return 'limitado'
}

export function componentRole(rec) {
  if (rec?.recommendation_role === 'safety_context') return 'Solo referencia'
  if (rec?.recommendation_role?.includes('primary')) return 'Nutriente principal'
  if (rec?.model2_stage === 'graph_support') return 'Apoyo complementario'
  return 'Nutriente sugerido'
}

export function naturalConditionText(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  const replacements = {
    'déficit de vitamina d': 'posible baja de vitamina D',
    'deficit de vitamina d': 'posible baja de vitamina D',
    'déficit de b12': 'posible brecha de B12',
    'deficit de b12': 'posible brecha de B12',
    'déficit de hierro': 'posible brecha de hierro',
    'deficit de hierro': 'posible brecha de hierro',
    'déficit de folato': 'posible brecha de folato',
    'deficit de folato': 'posible brecha de folato',
    'déficit de calcio': 'baja ingesta estimada de calcio',
    'deficit de calcio': 'baja ingesta estimada de calcio',
    'déficit de magnesio': 'posible brecha de magnesio',
    'deficit de magnesio': 'posible brecha de magnesio',
    'déficit de zinc': 'posible brecha de zinc',
    'deficit de zinc': 'posible brecha de zinc',
    'riesgo de vitamina c baja': 'baja ingesta estimada de vitamina C',
    'riesgo de omega 3 bajo': 'baja ingesta estimada de omega 3',
    'riesgo de proteína insuficiente': 'proteína posiblemente insuficiente',
    'riesgo de proteina insuficiente': 'proteína posiblemente insuficiente',
    'baja inmunidad': 'soporte inmune a revisar',
    'estrés y sueño': 'sueño y estrés como prioridad',
    'estres y sueño': 'sueño y estrés como prioridad',
    'rendimiento deportivo': 'recuperación y rendimiento',
  }
  return replacements[normalized] ?? value
}

export function naturalReason(rec) {
  const condition = naturalConditionText(rec?.condicion_display || rec?.condition || '')
  const raw = String(rec?.razon || '').trim()
  if (!raw) {
    return condition
      ? `Aparece por señales compatibles con ${condition}.`
      : 'Aparece por las señales nutricionales y de bienestar de tu perfil.'
  }
  if (/relacionado con/i.test(raw)) {
    return condition
      ? `Aparece por señales compatibles con ${condition}.`
      : 'Aparece por señales compatibles con tu perfil.'
  }
  if (/déficit|deficit|riesgo/i.test(raw)) {
    return raw
      .replace(/déficit de/gi, 'posible brecha de')
      .replace(/deficit de/gi, 'posible brecha de')
      .replace(/riesgo de/gi, 'señales de')
  }
  return raw
}

export function recommendationInsights(rec) {
  const haystack = `${rec?.nombre ?? ''} ${rec?.condicion_display ?? ''} ${rec?.razon ?? ''}`.toLowerCase()
  const found = COMPONENT_SUPPORT_COPY.find(item => item.match.some(token => haystack.includes(token)))
  if (found) return found

  return {
    supports: ['brecha detectada en tu perfil', 'prioridad nutricional', 'selección de producto trazable'],
    watch: ['señales reportadas en encuesta', 'hábitos declarados', 'datos faltantes o contexto dietario'],
  }
}

export function recommendationPriority(rec) {
  let score = 0
  if (rec?.recommendation_role?.includes('primary')) score += 50
  if (rec?.commercial_eligible !== false && rec?.products?.length > 0) score += 20
  if (rec?.model2_stage === 'evidence_validated') score += 15
  if (rec?.model2_stage === 'graph_support') score += 5
  if (rec?.commercial_recommendation_blocked) score -= 10
  if (rec?.recommendation_role === 'safety_context') score -= 20
  const evidence = String(rec?.evidence_strength || '').toLowerCase()
  if (['high', 'strong', 'strong_with_lab'].includes(evidence)) score += 12
  if (['moderate', 'low_moderate'].includes(evidence)) score += 6
  return score
}

export function humanizeToken(value = '') {
  const labels = {
    calculos_renales_recurrentes: 'cálculos renales recurrentes',
    enfermedad_renal: 'enfermedad renal',
    enfermedad_hepatica: 'enfermedad hepática',
    anticoagulantes: 'anticoagulantes',
    alergia_pescado: 'alergia a pescado',
    alergia_mariscos: 'alergia a mariscos',
    alergia_pescado_mariscos: 'alergia a pescado o mariscos',
    embarazo: 'embarazo',
    lactancia: 'lactancia',
    embarazo_lactancia: 'embarazo o lactancia',
    menor_edad: 'menor de edad',
    deficit_b12_no_evaluado: 'B12 no evaluada',
    trastornos_sangrado: 'trastornos de sangrado',
    ansiedad: 'ansiedad',
    insomnio: 'insomnio',
    hipertension: 'hipertensión',
    arritmia: 'arritmia',
    sedantes: 'sedantes',
    alcohol: 'alcohol',
    convulsiones: 'convulsiones',
    hiperpotasemia: 'potasio alto',
    ieca_ara2_espironolactona: 'medicación de potasio/presión',
    wilson: 'enfermedad de Wilson',
    neuropatia: 'neuropatía',
    tiroides: 'tiroides',
  }
  return labels[value] || String(value).replaceAll('_', ' ')
}

export function isDirectRecommendation(rec) {
  if (!rec) return false
  if (rec.recommendation_role === 'safety_context') return false
  const condition = String(rec.condicion_display ?? rec.condition ?? '').toLowerCase()
  if (condition.includes('soporte funcional')) return false
  if (rec.model2_stage === 'graph_support') return false
  if (rec.recommendation_role?.includes('primary')) return true
  if (rec.model2_stage === 'evidence_validated') return true
  return ['high', 'strong', 'strong_with_lab', 'moderate'].includes(String(rec.evidence_strength ?? '').toLowerCase())
}
