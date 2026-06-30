export const FALLBACK = [
  { code: 'DEFICIT_VIT_D', emoji: '☀️', nombre: 'Déficit de Vitamina D', nivel: 'Alta prob.',  probabilidad: 0.82, drivers: [] },
  { code: 'BAJA_INMUNIDAD', emoji: '🛡️', nombre: 'Baja Inmunidad',        nivel: 'Media prob.', probabilidad: 0.55, drivers: [] },
  { code: 'SALUDABLE',     emoji: '✅', nombre: 'Base saludable',         nivel: 'Confirmado',  probabilidad: 0.28, drivers: [] },
]

export const IMPACT_COLORS = {
  alto:  { bg: '#FEF2F2', text: '#DC2626' },
  medio: { bg: '#FFFBEB', text: '#D97706' },
  bajo:  { bg: '#F0FDF4', text: '#16A34A' },
}

export const ASSOCIATED_SIGNALS = {
  DEFICIT_VIT_D: ['cansancio persistente', 'molestias musculares', 'poca exposición solar'],
  DEFICIT_B12: ['fatiga', 'niebla mental', 'dieta vegetariana o vegana'],
  DEFICIT_HIERRO: ['cansancio', 'bajo rendimiento', 'uñas frágiles o caída de cabello'],
  DEFICIT_FOLATO: ['fatiga', 'alimentación poco variada', 'bajo consumo de verduras o menestras'],
  DEFICIT_CALCIO: ['baja ingesta de lácteos o fortificados', 'salud ósea como prioridad', 'poca vitamina D'],
  DEFICIT_MAGNESIO: ['calambres', 'recuperación lenta', 'sueño o estrés alterado'],
  DEFICIT_ZINC: ['uñas quebradizas', 'piel seca', 'baja variedad dietaria'],
  RIESGO_VITAMINA_C_BAJA: ['pocas frutas y verduras', 'fatiga', 'resfríos frecuentes'],
  RIESGO_OMEGA3_BAJO: ['poco pescado o mariscos', 'objetivo cognitivo', 'inflamación o recuperación como contexto'],
  RIESGO_PROTEINA_INSUFICIENTE: ['fatiga', 'recuperación lenta', 'baja proteína diaria estimada'],
  RIESGO_SALUD_OSEA: ['poca exposición solar', 'baja ingesta de calcio', 'edad o salud ósea como prioridad'],
  RIESGO_CABELLO_PIEL_UNAS: ['caída de cabello', 'piel seca', 'uñas quebradizas'],
  BAJA_INMUNIDAD: ['resfríos frecuentes', 'bajo consumo de frutas y verduras', 'estrés o sueño irregular'],
  ESTRES_SUENO: ['despertares nocturnos', 'irritabilidad', 'cansancio durante el día'],
  RENDIMIENTO_DEPORTIVO: ['recuperación lenta', 'calambres', 'entrenamiento frecuente'],
  SALUD_VISUAL: ['muchas horas de pantalla', 'bajo consumo de frutas y verduras', 'vista cansada como contexto'],
  SALUD_DIGESTIVA: ['molestia digestiva', 'alimentación poco variada'],
  FATIGA_NUTRICIONAL: ['fatiga frecuente', 'baja proteína estimada', 'brechas dietarias'],
  HIDRATACION_ELECTROLITOS: ['sudor intenso', 'calambres', 'baja agua diaria estimada'],
  SALUD_CARDIOVASCULAR_CONTEXTUAL: ['poco pescado', 'edad o lípidos como contexto', 'hábitos cardiovasculares'],
  SALUD_COGNITIVA: ['niebla mental', 'sueño irregular', 'objetivo de concentración'],
}

export function associatedSignalsFor(condition) {
  const code = condition?.code
  if (code && ASSOCIATED_SIGNALS[code]) return ASSOCIATED_SIGNALS[code]
  const text = `${code ?? ''} ${condition?.nombre ?? ''}`.toUpperCase()
  const match = Object.entries(ASSOCIATED_SIGNALS).find(([key]) => text.includes(key))
  return match?.[1] ?? []
}

export function condStyle(prob) {
  if (prob >= 0.65) return { bg: '#FFF7ED', border: '#FB923C', barC: '#FB923C' }
  if (prob >= 0.40) return { bg: '#FFFBEB', border: '#F59E0B', barC: '#F59E0B' }
  return { bg: 'var(--green-light)', border: 'var(--green)', barC: 'var(--green)' }
}

export function formatEvidence(value) {
  const labels = {
    observed_lab: 'Laboratorio observado',
    medical_safety: 'Seguridad médica',
    self_reported: 'Encuesta y síntomas',
    declared_diet: 'Dieta declarada',
    self_reported_symptoms: 'Síntomas',
    restrictions: 'Restricciones',
    profile_context: 'Perfil',
    survey_context: 'Encuesta',
    derived_soft_signal: 'Señal derivada',
    lab_only: 'Laboratorio',
    diet_or_lab: 'Dieta o laboratorio',
    lab_or_diet: 'Laboratorio o dieta',
    survey_wellness: 'Encuesta',
    safety_only: 'Seguridad',
    unknown: 'Contexto',
  }
  return labels[value] ?? capitalizeLabel(value)
}

export function probabilityLabel(probability = 0) {
  if (probability >= 0.65) return 'Prioridad alta'
  if (probability >= 0.40) return 'Prioridad media'
  return 'Contexto'
}

export function hasObservedLabEvidence(condition) {
  const evidence = String(condition?.evidence_group ?? '').toLowerCase()
  if (['observed_lab', 'lab_only', 'lab_or_diet'].includes(evidence)) return true
  return (condition?.drivers ?? []).some(driver => {
    const group = String(driver?.evidence_group ?? driver?.source ?? '').toLowerCase()
    return group.includes('lab') || group.includes('laboratorio')
  })
}

export function conditionDisplayTitle(condition, tone = 'risk') {
  const code = condition?.code
  const labEvidence = hasObservedLabEvidence(condition)

  if (tone === 'wellness') {
    const wellnessTitles = {
      BAJA_INMUNIDAD: 'Soporte inmune a revisar',
      ESTRES_SUENO: 'Sueño y estrés como prioridad',
      RENDIMIENTO_DEPORTIVO: 'Recuperación y rendimiento',
      RIESGO_CABELLO_PIEL_UNAS: 'Cabello, piel y uñas',
      SALUD_VISUAL: 'Salud visual como contexto',
      SALUD_DIGESTIVA: 'Digestión como contexto',
      FATIGA_NUTRICIONAL: 'Energía y alimentación',
      HIDRATACION_ELECTROLITOS: 'Hidratación y electrolitos',
      SALUD_CARDIOVASCULAR_CONTEXTUAL: 'Hábitos cardiovasculares',
      SALUD_COGNITIVA: 'Enfoque mental como contexto',
    }
    return wellnessTitles[code] ?? condition?.nombre ?? 'Prioridad de bienestar'
  }

  if (labEvidence) {
    const labTitles = {
      DEFICIT_VIT_D: 'Vitamina D baja observada',
      DEFICIT_B12: 'B12 baja observada',
      DEFICIT_HIERRO: 'Hierro bajo observado',
      DEFICIT_FOLATO: 'Folato bajo observado',
      DEFICIT_CALCIO: 'Calcio bajo observado',
      DEFICIT_MAGNESIO: 'Magnesio bajo observado',
      DEFICIT_ZINC: 'Zinc bajo observado',
      RIESGO_VITAMINA_C_BAJA: 'Vitamina C baja observada',
    }
    return labTitles[code] ?? condition?.nombre ?? 'Señal de laboratorio'
  }

  const surveyTitles = {
    DEFICIT_VIT_D: 'Posible baja de vitamina D',
    DEFICIT_B12: 'Posible brecha de B12',
    DEFICIT_HIERRO: 'Posible brecha de hierro',
    DEFICIT_FOLATO: 'Posible brecha de folato',
    DEFICIT_CALCIO: 'Baja ingesta estimada de calcio',
    DEFICIT_MAGNESIO: 'Posible brecha de magnesio',
    DEFICIT_ZINC: 'Posible brecha de zinc',
    RIESGO_VITAMINA_C_BAJA: 'Baja ingesta estimada de vitamina C',
    RIESGO_OMEGA3_BAJO: 'Baja ingesta estimada de omega 3',
    RIESGO_PROTEINA_INSUFICIENTE: 'Proteína posiblemente insuficiente',
    RIESGO_SALUD_OSEA: 'Salud ósea a revisar',
  }
  return surveyTitles[code] ?? condition?.nombre ?? 'Prioridad nutricional'
}

export function confidenceText(value = '') {
  return capitalizeLabel(value || 'orientativa')
}

export function explanationText(condition, tone = 'risk') {
  if (condition?.explanation) return condition.explanation
  if (tone === 'wellness') {
    return 'Prioridad de bienestar estimada por encuesta. Sirve para ordenar el resultado, no para diagnosticar.'
  }
  if (hasObservedLabEvidence(condition)) {
    return 'Señal estimada con datos de laboratorio cuando están disponibles. Debe interpretarse junto con un profesional.'
  }
  return 'Estimación orientativa basada en dieta, síntomas o hábitos declarados. Puede tener varias causas y no confirma una deficiencia.'
}

export function formatDriverLabel(value = '') {
  const normalized = String(value).trim().toLowerCase().replaceAll(' ', '_')
  const labels = {
    benchmark_diet_calcium_status: 'Bajo consumo estimado de calcio',
    benchmark_diet_folate_status: 'Bajo consumo estimado de folato',
    benchmark_diet_protein_status: 'Bajo consumo estimado de proteína',
    benchmark_diet_vitamin_c_status: 'Bajo consumo estimado de vitamina C',
    benchmark_diet_omega3_status: 'Bajo consumo estimado de omega 3',
    benchmark_diet_b12_status: 'Bajo consumo estimado de B12',
    benchmark_diet_zinc_status: 'Bajo consumo estimado de zinc',
    benchmark_diet_magnesium_status: 'Bajo consumo estimado de magnesio',
    benchmark_lab_vitamin_c_status: 'Vitamina C baja en laboratorio',
    self_reported: 'Encuesta y síntomas',
    dieta_deficiente: 'Alimentación poco variada',
    fatiga_general: 'Fatiga frecuente',
    dolor_muscular: 'Dolor muscular frecuente',
    dolor_articular: 'Dolor articular',
    niebla_mental: 'Niebla mental',
    problemas_sueno: 'Sueño irregular',
    caida_cabello: 'Caída de cabello',
    piel_seca: 'Piel seca',
    unas_quebradizas: 'Uñas quebradizas',
    enfermedad_frecuente: 'Resfríos o infecciones frecuentes',
    calambres: 'Calambres',
    estres_alto: 'Estrés alto',
    fruit_veg_servings_day: 'Pocas frutas o verduras',
    fish_servings_week: 'Poco pescado o mariscos',
    dairy_servings_day: 'Bajo consumo de lácteos o fortificados',
    legume_servings_week: 'Bajo consumo de menestras',
    meat_servings_week: 'Bajo consumo de carnes o vísceras',
    protein_g_day_estimate: 'Proteína diaria estimada baja',
    water_intake_l_day: 'Baja ingesta de agua',
    heavy_sweat_days_week: 'Sudor intenso frecuente',
    screen_hours_day: 'Muchas horas de pantalla',
    digestive_discomfort: 'Molestia digestiva',
    irritabilidad: 'Estrés o irritabilidad',
    meta_energia: 'Objetivo de energía',
    meta_inmunidad: 'Objetivo de inmunidad',
    meta_cognitivo: 'Objetivo de concentración o energía',
    meta_rendimiento: 'Objetivo de rendimiento físico',
    meta_salud_osea: 'Objetivo de salud ósea',
    meta_belleza: 'Objetivo de cabello, piel y uñas',
    meta_visual: 'Objetivo de salud visual',
    meta_digestiva: 'Objetivo de digestión',
    meta_hidratacion: 'Objetivo de hidratación',
    meta_cardiovascular: 'Objetivo cardiovascular',
    nivel_actividad: 'Actividad física declarada',
    vitamin_c_diet_signal: 'Señal dietaria de vitamina C',
    protein_insufficient_signal: 'Señal de proteína insuficiente',
    hair_skin_nails_cluster: 'Señales de cabello, piel o uñas',
    visual_strain_signal: 'Señal de cansancio visual',
    digestive_support_signal: 'Señal digestiva',
    hydration_electrolyte_signal: 'Señal de hidratación y electrolitos',
    fatigue_nutrition_signal: 'Señal de fatiga nutricional',
    cardiovascular_context_signal: 'Señal cardiovascular contextual',
    cognitive_context_signal: 'Señal cognitiva contextual',
  }
  return labels[normalized] || capitalizeLabel(String(value).replaceAll('_', ' '))
}

export function capitalizeLabel(value = '') {
  const text = String(value || '').replaceAll('_', ' ').trim()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function driverPriority(driver) {
  const impact = driver?.impact
  if (impact === 'alto') return 3
  if (impact === 'medio') return 2
  return 1
}
