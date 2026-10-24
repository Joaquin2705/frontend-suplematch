import surveyContract from '../data/surveyContract.json'
import { getUser } from '../api/authStorage'

export const SYMPTOM_FIELDS = {
  dolor_muscular: 'dolor_muscular',
  dolor_articular: 'dolor_articular',
  niebla_mental: 'niebla_mental',
  caida_cabello: 'caida_cabello',
  piel_seca: 'piel_seca',
  unas_quebradizas: 'unas_quebradizas',
  calambres: 'calambres',
}

export const SUPPLEMENT_DOSE_FIELDS = {
  vitamina_d: { label: 'Vitamina D', unit: 'UI/día', min: 0, max: 10000, step: 50, placeholder: 'Ej: 1000' },
  calcio: { label: 'Calcio', unit: 'mg/día', min: 0, max: 3000, step: 50, placeholder: 'Ej: 500' },
  magnesio: { label: 'Magnesio', unit: 'mg/día', min: 0, max: 1000, step: 25, placeholder: 'Ej: 200' },
  zinc: { label: 'Zinc', unit: 'mg/día', min: 0, max: 100, step: 1, placeholder: 'Ej: 15' },
  vitamina_c: { label: 'Vitamina C', unit: 'mg/día', min: 0, max: 3000, step: 50, placeholder: 'Ej: 500' },
  hierro: { label: 'Hierro', unit: 'mg/día', min: 0, max: 100, step: 1, placeholder: 'Ej: 18' },
  omega_3: { label: 'Omega 3 EPA+DHA', unit: 'mg/día', min: 0, max: 5000, step: 50, placeholder: 'Ej: 1000' },
  proteina: { label: 'Proteína en polvo', unit: 'g/día', min: 0, max: 200, step: 1, placeholder: 'Ej: 25' },
  multivitaminico: { label: 'Multivitamínico', unit: 'tabletas/día', min: 0, max: 10, step: 0.5, placeholder: 'Ej: 1' },
  vitamina_b12: { label: 'Vitamina B12', unit: 'mcg/día', min: 0, max: 5000, step: 50, placeholder: 'Ej: 250' },
  otro: { label: 'Otro suplemento', unit: 'porción/día', min: 0, max: 20, step: 0.5, placeholder: 'Ej: 1' },
}

// Valores clave que se pueden tipear sin subir el examen (contrato 2026-10-24.1). Se envían como lab_results.
export const KEY_LAB_FIELDS = [
  { key: 'lab_vitamin_d', label: 'Vitamina D 25-OH', lab: { code: 'vitamin_d', unit: 'ng/mL' }, suffix: 'ng/mL', min: 1, max: 200, step: 0.1, placeholder: 'Ej: 24' },
  { key: 'lab_b12', label: 'Vitamina B12', lab: { code: 'b12', unit: 'pg/mL' }, suffix: 'pg/mL', min: 50, max: 3000, step: 1, placeholder: 'Ej: 350' },
  { key: 'lab_ferritin', label: 'Ferritina', lab: { code: 'ferritin', unit: 'ng/mL' }, suffix: 'ng/mL', min: 1, max: 2000, step: 1, placeholder: 'Ej: 40' },
  { key: 'lab_hemoglobin', label: 'Hemoglobina', lab: { code: 'hemoglobin', unit: 'g/dL' }, suffix: 'g/dL', min: 3, max: 25, step: 0.1, placeholder: 'Ej: 13.5' },
  { key: 'lab_glucose', label: 'Glucosa en ayunas', lab: { code: 'glucose', unit: 'mg/dL' }, suffix: 'mg/dL', min: 30, max: 600, step: 1, placeholder: 'Ej: 92' },
]

const FATIGA_PERSISTENTE = ['a_menudo', 'siempre']
const DIETA_VEGETAL = ['vegano', 'vegetariano']
const ageOf = answers => Number(answers.antropometria?.age_years)

// Pasos opcionales que solo se muestran a quien le cambian el resultado (2026-10-24). Mantener alineado con
// rules.conditional_fields del contrato.
export const STEP_GATES = {
  // Protector y piel al sol solo importan si la exposición ya es baja o moderada.
  sol_detalle: answers => ['menos_15min', '15_30min'].includes(answers.exposicion_solar),
  // Pérdidas de hierro: mujeres en edad fértil, o cualquiera con fatiga persistente.
  factores_hierro: answers => (answers.sexo === 'femenino' && ageOf(answers) >= 12 && ageOf(answers) <= 50)
    || FATIGA_PERSISTENTE.includes(answers.fatiga),
  // B12 dietaria: dieta vegetal o 50+ (absorción menor con la edad).
  factores_b12: answers => DIETA_VEGETAL.includes(answers.tipo_dieta) || ageOf(answers) >= 50,
  // Metformina u omeprazol: se pregunta junto a seguridad, si declaró medicación o tiene 50+.
  medicamentos_b12: answers => (answers.condiciones_seguridad || []).some(item => ['diabetes_medicada', 'medicacion_cronica'].includes(item))
    || ageOf(answers) >= 50,
}

export const QUESTIONS = [
  {
    key: 'analisis_ultimo_anio',
    section: 'Exámenes',
    title: '¿Te hiciste un análisis de sangre en el último año?',
    sub: 'Un valor medido pesa más que cualquier pregunta. Si lo tienes a mano, úsalo primero.',
    note: 'Si no tienes análisis, la encuesta sigue igual y te diremos qué exámenes convendría pedir.',
    type: 'single',
    required: true,
    options: [
      { label: 'Sí, y tengo los resultados a mano', value: 'si_a_mano', detail: 'Podrás subir el archivo o tipear 5 valores clave.' },
      { label: 'Sí, pero no los tengo a mano', value: 'si_sin_resultados', detail: 'Puedes agregarlos después desde Exámenes.' },
      { label: 'No me hice análisis', value: 'no', detail: 'Seguimos solo con la encuesta.' },
      { label: 'No recuerdo', value: 'no_se', detail: 'Seguimos solo con la encuesta.' },
    ],
  },
  {
    key: 'labs_intro',
    section: 'Exámenes',
    title: '¿Quieres usar un análisis de sangre?',
    sub: 'Puedes subirlo ahora para que el OCR extraiga valores como hemoglobina, ferritina, B12, vitamina D, glucosa o lípidos. También puedes continuar sin examen.',
    note: 'Si subes un archivo, revisarás y corregirás los valores detectados antes de usarlos.',
    type: 'lab_entry',
    required: false,
    when: answers => answers.analisis_ultimo_anio === 'si_a_mano',
  },
  {
    key: 'valores_clave',
    section: 'Exámenes',
    title: 'Valores clave de tu análisis',
    sub: 'Tipea solo los que aparezcan en tu informe, con la unidad indicada. Si ya subiste el archivo, puedes pasar este paso.',
    note: 'Revisa la unidad: vitamina D en ng/mL (no nmol/L), B12 en pg/mL, hemoglobina en g/dL.',
    type: 'field_group',
    required: false,
    when: answers => answers.analisis_ultimo_anio === 'si_a_mano' && labResultCount() === 0,
    fields: KEY_LAB_FIELDS,
  },
  {
    key: 'antropometria',
    section: 'Perfil',
    title: 'Datos físicos base',
    sub: 'Usamos edad, peso y talla exactos para ajustar señales del modelo. Puedes elegir unidades habituales.',
    note: 'Estos datos se usan internamente para ajustar el perfil; no son un diagnóstico.',
    type: 'anthropometrics',
    required: true,
  },
  {
    key: 'sexo',
    section: 'Perfil',
    title: '¿Qué sexo quieres usar para esta evaluación?',
    sub: 'Se usa solo como señal del modelo. Puedes omitirlo si prefieres.',
    type: 'single',
    required: true,
    options: [
      { label: 'Femenino', value: 'femenino', detail: 'Usar referencia femenina.' },
      { label: 'Masculino', value: 'masculino', detail: 'Usar referencia masculina.' },
    ],
  },
  {
    key: 'tipo_dieta',
    section: 'Alimentación',
    title: '¿Qué patrón de alimentación sigues?',
    sub: 'Ayuda a detectar riesgos como B12, hierro, calcio u omega 3.',
    note: 'Patrón de alimentación = los grupos de alimentos que normalmente incluyes o evitas.',
    type: 'single',
    required: true,
    options: [
      { label: 'Omnívora', value: 'omnivoro', detail: 'Incluye alimentos animales y vegetales.' },
      { label: 'Pescetariana', value: 'pescetariano', detail: 'Incluye pescado, pero poca o ninguna carne.' },
      { label: 'Vegetariana', value: 'vegetariano', detail: 'No incluye carne ni pescado.' },
      { label: 'Vegana', value: 'vegano', detail: 'No incluye alimentos de origen animal.' },
    ],
  },
  // La pregunta de variedad de dieta (key 'dieta') se quitó el 2026-10-24: cambiaba la detección en 3 de 120 casos y el
  // bloque de alimentos la cubre (scripts/clinical/valor_preguntas.py en el backend). El backend la sigue aceptando.
  {
    key: 'alimentacion_medible',
    section: 'Alimentación',
    title: 'Alimentos de una semana típica',
    sub: 'Cuenta porciones, no comidas. Si comes pollo en el almuerzo y en la cena, son 2 al día. Usa "No sé" si no lo tienes claro: no se tomará como cero.',
    note: 'Para estimar la proteína necesitamos todo el bloque. Si dejas uno en "No sé", no la estimamos en vez de suponer cero.',
    type: 'field_group',
    required: false,
    fields: [
      { key: 'poultry_servings_week', label: 'Pollo o pavo', hint: '1 porción = 1 presa o 1 filete', type: 'scale5', scale: 'weekly_food' },
      { key: 'red_meat_servings_week', label: 'Carne roja o vísceras', hint: '1 porción = 1 bistec, 1 porción de hígado o sangrecita', type: 'scale5', scale: 'weekly_food' },
      { key: 'fish_servings_week', label: 'Pescado o mariscos', hint: '1 porción = 1 filete, 1 lata de atún o 1 plato de cebiche', type: 'scale5', scale: 'weekly_food' },
      { key: 'eggs_servings_week', label: 'Huevos', hint: '1 porción = 1 huevo', type: 'scale5', scale: 'weekly_food' },
      { key: 'legume_servings_week', label: 'Menestras', hint: '1 porción = 1 taza cocida de lentejas, frejoles, pallares o garbanzos', type: 'scale5', scale: 'weekly_food' },
      { key: 'dairy_servings_week', label: 'Lácteos', hint: '1 porción = 1 vaso de leche, 1 yogur o 1 tajada de queso', type: 'scale5', scale: 'weekly_food' },
      { key: 'no_meat', label: 'No consumo carnes', type: 'checkbox' },
      { key: 'fruit_veg_servings_day', label: 'Frutas y verduras por día', hint: '1 porción = 1 fruta mediana o 1 taza de verduras', type: 'scale5', scale: 'daily_fruit_veg' },
      { key: 'protein_g_day_estimate', label: 'Proteína diaria solo si la conoces', placeholder: 'Opcional; la app la estima con alimentos', suffix: 'g/día', min: 0, max: 300, step: 1 },
    ],
  },
  {
    key: 'factores_b12',
    section: 'Alimentación',
    title: 'Vitamina B12',
    sub: 'La B12 viene casi solo de alimentos animales o fortificados, y después de los 50 se absorbe peor.',
    type: 'field_group',
    required: false,
    when: STEP_GATES.factores_b12,
    fields: [
      {
        key: 'anios_dieta_vegetal',
        label: '¿Cuánto tiempo llevas con dieta vegetariana o vegana?',
        type: 'select',
        when: answers => ['vegano', 'vegetariano'].includes(answers.tipo_dieta),
        options: [
          { label: 'Menos de 1 año', value: 'menos_1' },
          { label: '1 a 3 años', value: '1_3' },
          { label: 'Más de 3 años', value: 'mas_3' },
        ],
      },
      {
        key: 'alimentos_fortificados_b12',
        label: '¿Consumes a diario leche vegetal, cereales u otros alimentos fortificados con B12?',
        type: 'select',
        options: [
          { label: 'No', value: 'no' },
          { label: 'Sí', value: 'si' },
          { label: 'No estoy seguro', value: 'no_se' },
        ],
      },
    ],
  },
  {
    key: 'exposicion_solar',
    section: 'Hábitos',
    title: '¿Cuánta exposición solar directa tienes al día?',
    sub: 'Cuenta exposición en brazos, piernas o rostro, no solo estar cerca de una ventana.',
    note: 'Sol directo = luz solar sobre la piel, no a través de ventana o solo iluminación ambiental.',
    type: 'single',
    required: true,
    options: [
      { label: 'Menos de 15 minutos', value: 'menos_15min', detail: 'Exposición baja.' },
      { label: '15 a 30 minutos', value: '15_30min', detail: 'Exposición moderada.' },
      { label: '30 a 60 minutos', value: '30_60min', detail: 'Exposición suficiente para muchas personas.' },
      { label: 'Más de 1 hora', value: 'mas_1h', detail: 'Exposición alta.' },
    ],
  },
  {
    key: 'sol_detalle',
    section: 'Hábitos',
    title: 'Detalle de tu exposición al sol',
    sub: 'El protector solar y la ropa reducen cuánta vitamina D produce la piel.',
    type: 'field_group',
    required: false,
    when: STEP_GATES.sol_detalle,
    fields: [
      {
        key: 'protector_solar',
        label: '¿Usas protector solar cuando sales?',
        type: 'select',
        options: [
          { label: 'Nunca o casi nunca', value: 'nunca' },
          { label: 'A veces', value: 'a_veces' },
          { label: 'Siempre', value: 'siempre' },
        ],
      },
      {
        key: 'piel_expuesta',
        label: '¿Qué parte de tu piel suele recibir el sol?',
        type: 'select',
        options: [
          { label: 'Solo cara y manos', value: 'cara_manos' },
          { label: 'Cara, manos y brazos', value: 'brazos' },
          { label: 'Brazos y piernas', value: 'brazos_piernas' },
        ],
      },
    ],
  },
  {
    key: 'frecuencia_ejercicio',
    section: 'Hábitos',
    title: '¿Con qué frecuencia haces actividad física?',
    sub: 'Incluye caminar rápido, gimnasio, deporte o entrenamiento estructurado.',
    type: 'single',
    required: true,
    options: [
      { label: 'Casi nunca', value: 'casi_nunca', detail: 'Menos de una vez por semana.' },
      { label: '1 a 2 veces por semana', value: '1_2_semana', detail: 'Actividad ligera o moderada.' },
      { label: '3 a 4 veces por semana', value: '3_4_semana', detail: 'Actividad regular.' },
      { label: 'Diario o casi diario', value: 'diario', detail: 'Actividad alta o entrenamiento frecuente.' },
    ],
  },
  {
    key: 'entrenamiento_detalle',
    section: 'Hábitos',
    title: 'Detalle de entrenamiento',
    sub: 'Ayuda a diferenciar necesidad de rendimiento, recuperación y prioridad de proteína.',
    when: (answers) => answers.frecuencia_ejercicio && answers.frecuencia_ejercicio !== 'casi_nunca',
    type: 'field_group',
    required: false,
    fields: [
      {
        key: 'training_type',
        label: 'Tipo principal',
        type: 'select',
        options: [
          { label: 'No aplica', value: 'no_aplica' },
          { label: 'Fuerza', value: 'fuerza' },
          { label: 'Cardio', value: 'cardio' },
          { label: 'Mixto', value: 'mixto' },
          { label: 'Movilidad', value: 'movilidad' },
        ],
      },
      {
        key: 'recovery_difficulty',
        label: 'Dificultad para recuperarte',
        type: 'select',
        options: [
          { label: 'No', value: 'no' },
          { label: 'Leve', value: 'leve' },
          { label: 'Moderada', value: 'moderada' },
          { label: 'Alta', value: 'alta' },
        ],
      },
    ],
  },
  {
    key: 'fatiga',
    section: 'Señales',
    title: '¿Con qué frecuencia sientes fatiga durante el día?',
    sub: 'No cuentes cansancio normal después de una mala noche aislada.',
    type: 'single',
    required: true,
    options: [
      { label: 'Casi nunca', value: 'casi_nunca', detail: 'Energía estable la mayoría de días.' },
      { label: 'A veces', value: 'a_veces', detail: 'Aparece algunos días.' },
      { label: 'A menudo', value: 'a_menudo', detail: 'Afecta varias actividades semanales.' },
      { label: 'Siempre', value: 'siempre', detail: 'Presente casi todos los días.' },
    ],
  },
  {
    key: 'fatiga_detalle',
    section: 'Señales',
    title: 'Sobre tu cansancio',
    sub: 'Ayuda a distinguir cansancio por dormir poco o un mal momento de una señal nutricional que persiste.',
    type: 'field_group',
    required: false,
    when: answers => FATIGA_PERSISTENTE.includes(answers.fatiga),
    fields: [
      {
        key: 'fatiga_duracion',
        label: '¿Desde cuándo te sientes así?',
        type: 'select',
        options: [
          { label: 'Menos de 2 semanas', value: 'menos_2_semanas' },
          { label: 'Entre 2 semanas y 3 meses', value: '2_semanas_3_meses' },
          { label: 'Más de 3 meses', value: 'mas_3_meses' },
        ],
      },
      {
        key: 'fatiga_mejora_descanso',
        label: '¿Mejora cuando duermes bien o descansas?',
        type: 'select',
        options: [
          { label: 'Sí, mejora claramente', value: 'si' },
          { label: 'A veces', value: 'a_veces' },
          { label: 'No mejora', value: 'no' },
        ],
      },
      { key: 'fatigue_days_week', label: 'Días con fatiga por semana', placeholder: 'Ej: 4', min: 0, max: 7, step: 1 },
    ],
  },
  {
    key: 'factores_hierro',
    section: 'Señales',
    title: 'Hierro',
    sub: 'Perder sangre es la causa más común de hierro bajo, incluso con buena alimentación.',
    type: 'field_group',
    required: false,
    when: STEP_GATES.factores_hierro,
    fields: [
      {
        key: 'iron_anemia_history',
        label: '¿Te han mencionado anemia, ferritina baja o hierro bajo?',
        type: 'select',
        options: [
          { label: 'No', value: 'no' },
          { label: 'Sí', value: 'si' },
          { label: 'No estoy seguro', value: 'no_se' },
        ],
      },
      {
        key: 'menstruacion_abundante',
        label: '¿Tus menstruaciones son abundantes (cambias protección cada 1-2 horas o duran más de 7 días)?',
        type: 'select',
        when: answers => answers.sexo === 'femenino',
        options: [
          { label: 'No', value: 'no' },
          { label: 'Sí', value: 'si' },
          { label: 'No aplica (no menstrúo)', value: 'no_aplica' },
        ],
      },
      {
        key: 'parto_ultimo_anio',
        label: '¿Tuviste un parto en el último año?',
        type: 'select',
        when: answers => answers.sexo === 'femenino',
        options: [
          { label: 'No', value: 'no' },
          { label: 'Sí', value: 'si' },
        ],
      },
      {
        key: 'dona_sangre',
        label: '¿Donas sangre?',
        type: 'select',
        options: [
          { label: 'No', value: 'no' },
          { label: '1 vez al año', value: '1_al_anio' },
          { label: '2 o más veces al año', value: '2_o_mas_al_anio' },
        ],
      },
    ],
  },
  {
    key: 'horas_sueno',
    section: 'Sueño',
    title: '¿Cuántas horas duermes normalmente?',
    sub: 'Usa tu promedio de una semana típica.',
    type: 'single',
    required: true,
    options: [
      { label: 'Menos de 5 horas', value: 'menos_5h', detail: 'Sueño muy corto.' },
      { label: '5 a 7 horas', value: '5_7h', detail: 'Sueño reducido.' },
      { label: '7 a 9 horas', value: '7_9h', detail: 'Rango habitual recomendado para adultos.' },
      { label: 'Más de 9 horas', value: 'mas_9h', detail: 'Sueño prolongado.' },
    ],
  },
  {
    key: 'sueno_detalle',
    section: 'Sueño',
    title: 'Afinemos señales de sueño',
    sub: 'Estas respuestas se usan como prioridad de bienestar, no como diagnóstico.',
    type: 'field_group',
    required: false,
    fields: [
      {
        key: 'sleep_quality',
        label: 'Calidad del sueño',
        type: 'select',
        options: [
          { label: 'Buena', value: 'buena' },
          { label: 'Regular', value: 'regular' },
          { label: 'Mala', value: 'mala' },
        ],
      },
      {
        key: 'night_wakeups',
        label: 'Despertares nocturnos',
        type: 'select',
        options: [
          { label: 'Nunca o casi nunca', value: 'nunca' },
          { label: '1 a 2 veces', value: '1_2' },
          { label: '3 o más veces', value: '3_o_mas' },
        ],
      },
      {
        key: 'caffeine_after_3pm',
        label: 'Cafeína después de las 3 p.m.',
        type: 'select',
        options: [
          { label: 'No', value: 'no' },
          { label: 'A veces', value: 'a_veces' },
          { label: 'Sí', value: 'si' },
        ],
      },
      { key: 'caffeine_servings_day', label: 'Porciones de cafeína al día', placeholder: 'Café, té, energizante, pre-entreno', min: 0, max: 20, step: 0.5 },
      {
        key: 'caffeine_sources',
        label: 'Fuentes habituales de cafeína',
        type: 'multi_select',
        options: [
          { label: 'Café', value: 'cafe' },
          { label: 'Té o mate', value: 'te' },
          { label: 'Energizantes', value: 'energizante' },
          { label: 'Pre-workout', value: 'preworkout' },
          { label: 'Gaseosa cola', value: 'gaseosa_cola' },
          { label: 'Chocolate/cacao', value: 'chocolate' },
          { label: 'Otra fuente', value: 'otro' },
        ],
      },
    ],
  },
  {
    key: 'frecuencia_enfermedad',
    section: 'Señales',
    title: '¿Con qué frecuencia te enfermas de resfríos o infecciones leves?',
    sub: 'Usa el último año como referencia.',
    type: 'single',
    required: true,
    options: [
      { label: 'Casi nunca', value: 'casi_nunca', detail: 'Rara vez.' },
      { label: '1 a 2 veces al año', value: '1_2_anio', detail: 'Frecuencia baja.' },
      { label: '3 a 4 veces al año', value: '3_4_anio', detail: 'Frecuencia moderada.' },
      { label: 'Muy seguido', value: 'muy_seguido', detail: 'Más de 4 veces al año o recuperación lenta.' },
    ],
  },
  {
    key: 'estres',
    section: 'Señales',
    title: '¿Qué nivel de estrés o irritabilidad tienes últimamente?',
    sub: 'Considera las últimas 2 semanas, no un evento puntual.',
    type: 'single',
    required: true,
    options: [
      { label: 'Bajo', value: 'bajo', detail: 'Manejable la mayoría de días.' },
      { label: 'Moderado', value: 'moderado', detail: 'Presente, pero no domina tu rutina.' },
      { label: 'Alto', value: 'alto', detail: 'Interfiere con sueño, concentración o ánimo.' },
      { label: 'Muy alto', value: 'muy_alto', detail: 'Persistente o difícil de controlar.' },
    ],
  },
  {
    key: 'sintomas',
    section: 'Señales',
    title: '¿Qué señales has notado recientemente?',
    sub: 'Selecciona solo síntomas frecuentes o repetidos. Si no aplica, pasa esta pregunta.',
    note: 'Señales recientes = molestias repetidas en los últimos días o semanas, no un evento aislado.',
    type: 'multi',
    required: true,
    noneValue: 'ninguno',
    options: [
      { label: 'Dolor muscular frecuente', value: 'dolor_muscular', detail: 'Molestias sin causa clara o recuperación lenta.' },
      { label: 'Dolor articular', value: 'dolor_articular', detail: 'Molestias en articulaciones.' },
      { label: 'Niebla mental o baja concentración', value: 'niebla_mental', detail: 'Dificultad para enfocarte.' },
      { label: 'Caída de cabello', value: 'caida_cabello', detail: 'Más de lo habitual.' },
      { label: 'Piel seca', value: 'piel_seca', detail: 'Persistente, no solo por clima.' },
      { label: 'Uñas quebradizas', value: 'unas_quebradizas', detail: 'Se rompen o descaman.' },
      { label: 'Calambres', value: 'calambres', detail: 'Frecuentes o repetidos.' },
    ],
  },
  {
    key: 'contexto_bienestar',
    section: 'Hábitos',
    title: 'Contexto adicional opcional',
    sub: 'Responde solo lo que sepas. Ayuda a interpretar hidratación, fatiga, dolor de cabeza y recuperación.',
    note: 'Estos datos son señales de bienestar; no se interpretan como diagnóstico.',
    type: 'field_group',
    required: false,
    fields: [
      { key: 'screen_hours_day', label: 'Horas de pantalla al día', placeholder: 'Ej: 6', min: 0, max: 24, step: 0.5 },
      { key: 'water_intake_l_day', label: 'Agua aproximada al día', placeholder: 'Ej: 2', suffix: 'L/día', min: 0, max: 10, step: 0.1 },
      { key: 'heavy_sweat_days_week', label: 'Días con sudor intenso por semana', placeholder: 'Ej: 3', min: 0, max: 7, step: 1 },
      { key: 'headache_days_week', label: 'Días con dolor de cabeza por semana', placeholder: 'Ej: 2', min: 0, max: 7, step: 1 },
      { key: 'alcohol_drinks_week', label: 'Tragos estándar por semana', placeholder: 'Ej: 2', min: 0, max: 80, step: 1 },
      {
        key: 'digestive_discomfort',
        label: 'Molestia digestiva reciente',
        type: 'select',
        options: [
          { label: 'No', value: 'nunca' },
          { label: 'Leve', value: 'leve' },
          { label: 'Moderada', value: 'moderado' },
          { label: 'Frecuente', value: 'frecuente' },
          { label: 'Severa', value: 'severo' },
        ],
      },
      // Tabaco y salud autopercibida alimentan solo el modelo real de riesgo de laboratorio (lab_risk_estimates).
      // Aporte medido con NHANES: marginal; por eso van aquí, sin pantalla propia.
      {
        key: 'tabaco',
        label: '¿Fumas?',
        type: 'select',
        options: [
          { label: 'Nunca he fumado', value: 'nunca' },
          { label: 'Fumaba, ya no', value: 'ex' },
          { label: 'Fumo actualmente', value: 'actual' },
        ],
      },
      {
        key: 'salud_autopercibida',
        label: 'En general, ¿cómo dirías que es tu salud?',
        type: 'select',
        options: [
          { label: 'Excelente', value: 'excelente' },
          { label: 'Muy buena', value: 'muy_buena' },
          { label: 'Buena', value: 'buena' },
          { label: 'Regular', value: 'regular' },
          { label: 'Mala', value: 'mala' },
        ],
      },
    ],
  },
  {
    key: 'objetivos',
    section: 'Objetivos',
    title: '¿Qué quieres priorizar?',
    sub: 'Elige hasta 4 objetivos. Solo ordena lo que mostramos primero; no cambia qué riesgos detectamos.',
    type: 'multi',
    max: 4,
    options: [
      { label: 'Energía', value: 'energia', detail: 'Menos cansancio diario.' },
      { label: 'Inmunidad', value: 'inmunidad', detail: 'Soporte ante resfríos frecuentes.' },
      { label: 'Sueño', value: 'suenio', detail: 'Mejor descanso.' },
      { label: 'Rendimiento físico', value: 'rendimiento', detail: 'Entrenamiento o recuperación.' },
      { label: 'Salud ósea', value: 'salud_osea', detail: 'Huesos, calcio o vitamina D.' },
      { label: 'Cabello, piel y uñas', value: 'cabello_piel_unas', detail: 'Señales visibles.' },
      { label: 'Estrés', value: 'estres', detail: 'Relajación y balance.' },
      { label: 'Salud visual', value: 'salud_visual', detail: 'Pantallas, vista o carotenoides.' },
      { label: 'Digestión', value: 'digestion', detail: 'Regularidad y tolerancia digestiva.' },
      { label: 'Hidratación', value: 'hidratacion', detail: 'Sudor, calambres o electrolitos.' },
      { label: 'Cardiovascular', value: 'salud_cardiovascular', detail: 'Contexto de lípidos y hábitos.' },
      { label: 'Enfoque mental', value: 'salud_cognitiva', detail: 'Concentración y claridad.' },
    ],
  },
  {
    key: 'alcohol',
    section: 'Hábitos',
    title: '¿Con qué frecuencia consumes alcohol?',
    sub: 'Ayuda a estimar demanda nutricional y hábitos de recuperación.',
    type: 'single',
    required: true,
    options: [
      { label: 'Nunca', value: 'nunca', detail: 'No consumes alcohol.' },
      { label: 'Raro', value: 'raro', detail: 'Menos de una vez al mes.' },
      { label: 'Ocasional', value: 'ocasional', detail: 'Algunas veces al mes.' },
      { label: 'Frecuente', value: 'frecuente', detail: 'Semanal o más.' },
    ],
  },
  {
    key: 'toma_suplementos',
    section: 'Suplementos',
    title: '¿Actualmente tomas suplementos?',
    sub: 'Esto es obligatorio para evitar duplicar dosis o recomendar algo que ya consumes.',
    type: 'single',
    required: true,
    options: [
      { label: 'No tomo suplementos', value: 'no', detail: 'No consumes suplementos actualmente.' },
      { label: 'Sí tomo suplementos', value: 'si', detail: 'Indicarás cuáles en el siguiente paso.' },
    ],
  },
  {
    key: 'suplementos_actuales',
    section: 'Suplementos',
    title: '¿Cuáles consumes actualmente?',
    sub: 'Selecciona todos los que tomas al menos una vez por semana.',
    type: 'multi',
    required: true,
    when: answers => answers.toma_suplementos === 'si',
    options: [
      { label: 'Vitamina D', value: 'vitamina_d', detail: 'Incluye D3 o colecalciferol.' },
      { label: 'Calcio', value: 'calcio', detail: 'Calcio solo o combinado.' },
      { label: 'Magnesio', value: 'magnesio', detail: 'Citrato, glicinato u otros.' },
      { label: 'Zinc', value: 'zinc', detail: 'Zinc solo o en multivitamínico.' },
      { label: 'Vitamina C', value: 'vitamina_c', detail: 'Ácido ascórbico u otros.' },
      { label: 'Hierro', value: 'hierro', detail: 'Solo si lo usas actualmente.' },
      { label: 'Omega 3', value: 'omega_3', detail: 'EPA/DHA o aceite de pescado.' },
      { label: 'Multivitamínico', value: 'multivitaminico', detail: 'Fórmula con varios nutrientes.' },
      { label: 'Vitamina B12', value: 'vitamina_b12', detail: 'Sola o en complejo B.' },
      { label: 'Proteína', value: 'proteina', detail: 'Whey, vegetal u otra.' },
      { label: 'Otro suplemento', value: 'otro', detail: 'No listado arriba.' },
    ],
  },
  {
    key: 'suplementos_detalle',
    section: 'Suplementos',
    title: 'Detalle de uso actual',
    sub: 'Sirve para reducir riesgo de duplicar dosis. Si conoces la dosis, marca la casilla; no pedimos texto libre por ahora.',
    type: 'field_group',
    required: false,
    when: answers => answers.toma_suplementos === 'si',
    fields: [
      {
        key: 'suplementos_frecuencia',
        label: 'Frecuencia de uso',
        type: 'select',
        options: [
          { label: 'Diario', value: 'diario' },
          { label: 'Varias veces por semana', value: 'varias_semana' },
          { label: 'Ocasional', value: 'ocasional' },
          { label: 'No estoy seguro', value: 'no_se' },
        ],
      },
      {
        key: 'suplementos_dosis_conocida',
        label: 'Conozco la dosis aproximada de lo que tomo',
        type: 'checkbox',
      },
      {
        key: 'suplementos_dosis_actual',
        type: 'current_supplement_doses',
      },
    ],
  },
  {
    key: 'restricciones',
    section: 'Seguridad',
    title: '¿Tienes alergias o restricciones relevantes?',
    sub: 'No diagnostica alergias. Sirve para mostrar advertencias y revisar etiquetas.',
    note: 'Restricción = algo que debes o decides evitar en ingredientes, cápsulas o excipientes.',
    type: 'multi',
    required: true,
    noneValue: 'sin_restricciones',
    options: [
      { label: 'Sin restricciones conocidas', value: 'sin_restricciones', detail: 'No aplicar alertas por excipientes.' },
      { label: 'Alergia a lácteos', value: 'alergia_lacteos', detail: 'Cuidado con suero de leche y excipientes.' },
      { label: 'Alergia a soya', value: 'alergia_soya', detail: 'Revisar excipientes.' },
      { label: 'Alergia a pescado o mariscos', value: 'alergia_pescado_mariscos', detail: 'Revisar omega 3 de origen marino.' },
      { label: 'Evito gelatina', value: 'evita_gelatina', detail: 'Cuidado con cápsulas blandas.' },
      { label: 'Sin gluten', value: 'sin_gluten', detail: 'Verificar declaración del fabricante.' },
    ],
  },
  {
    key: 'condiciones_seguridad',
    section: 'Seguridad',
    title: '¿Alguna condición requiere precaución?',
    sub: 'Si aplica, el resultado incluirá advertencias. No reemplaza evaluación médica.',
    note: 'Precaución = situación donde conviene evitar compra directa y revisar interacciones.',
    type: 'multi',
    required: true,
    noneValue: 'ninguna',
    options: [
      { label: 'Ninguna de estas', value: 'ninguna', detail: 'No declarar condiciones de esta lista.' },
      { label: 'Embarazo o lactancia', value: 'embarazo_lactancia', detail: 'Requiere validación profesional.' },
      { label: 'Enfermedad renal', value: 'enfermedad_renal', detail: 'Cuidado con minerales y dosis.' },
      { label: 'Enfermedad hepática', value: 'enfermedad_hepatica', detail: 'Cuidado con metabolismo y dosis.' },
      { label: 'Problema tiroideo', value: 'problema_tiroideo', detail: 'Cuidado con yodo, algas y fórmulas tiroideas.' },
      { label: 'Uso anticoagulantes', value: 'anticoagulantes', detail: 'Riesgo de interacciones.' },
      { label: 'Medicación crónica', value: 'medicacion_cronica', detail: 'Revisar interacciones.' },
      // Añadidas 2026-10-23: activan reglas de interacción que el backend ya tenía (contrato 2026-10-23.1).
      { label: 'Medicación para la glucosa', value: 'diabetes_medicada', detail: 'Cromo, canela y otros pueden alterar el control glucémico.' },
      { label: 'Hipertensión o arritmias', value: 'hipertension', detail: 'Cafeína, energizantes y preworkouts requieren cautela.' },
      { label: 'Uso de sedantes', value: 'sedantes', detail: 'Melatonina, valeriana o L-teanina pueden sumar somnolencia.' },
      { label: 'Inmunosupresión o enfermedad grave', value: 'inmunosupresion', detail: 'Probióticos y hierbas requieren evaluación médica previa.' },
    ],
  },
  {
    key: 'medicamentos_b12_paso',
    section: 'Seguridad',
    title: 'Medicamentos que afectan la vitamina B12',
    sub: 'Algunos medicamentos de uso diario reducen cuánta B12 absorbes.',
    type: 'field_group',
    required: false,
    when: STEP_GATES.medicamentos_b12,
    fields: [
      {
        key: 'medicamentos_b12',
        label: '¿Tomas alguno de estos de forma habitual?',
        type: 'multi_select',
        options: [
          { label: 'Metformina', value: 'metformina' },
          { label: 'Omeprazol u otro antiácido diario', value: 'antiacidos_ibp' },
        ],
      },
    ],
  },
  {
    key: 'presupuesto',
    section: 'Compra',
    title: '¿Cuánto quieres gastar en suplementos?',
    sub: 'Arrastra los controles para indicar tu rango de precio mensual en soles. El sistema priorizará productos dentro de este rango.',
    type: 'price_range',
    required: false,
    min: 0,
    max: 500,
    step: 10,
  },
]
Object.freeze(QUESTIONS)

export const SCALE_PRESETS = {
  // Porciones por semana. Debe coincidir con rules.food_block.scale_values del contrato (0, 1, 3, 5, 7, 14).
  // La escala anterior terminaba en "5+/sem" (=7): nadie podía declarar 2 porciones diarias y lácteos o
  // proteína salían bajos casi siempre.
  weekly_food: [
    { point: 1, value: 0, short: 'No', label: 'No consumo', hint: '0/sem' },
    { point: 2, value: 1, short: '1/sem', label: '1 vez por semana', hint: '1/sem' },
    { point: 3, value: 3, short: '2-3', label: '2 a 3 por semana', hint: '2-3/sem' },
    { point: 4, value: 5, short: '4-6', label: '4 a 6 por semana', hint: '4-6/sem' },
    { point: 5, value: 7, short: '1/día', label: '1 al día', hint: '7/sem' },
    { point: 6, value: 14, short: '2+/día', label: '2 o más al día', hint: '14+/sem' },
  ],
  daily_fruit_veg: [
    { point: 1, value: 0, short: '0', label: 'Casi nada', hint: '0/día' },
    { point: 2, value: 1, short: '1', label: '1 al día', hint: '1/día' },
    { point: 3, value: 2, short: '2', label: '2 al día', hint: '2/día' },
    { point: 4, value: 3, short: '3', label: '3 al día', hint: '3/día' },
    { point: 5, value: 5, short: '4+', label: '4 o más al día', hint: '4+/día' },
  ],
}

export const fieldLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 12,
  color: 'var(--gray-600)',
  fontWeight: 700,
}

export const exactInputStyle = {
  width: '100%',
  border: '2px solid var(--gray-200)',
  borderRadius: 'var(--radius-sm)',
  padding: '12px 13px',
  fontSize: 15,
  color: 'var(--gray-800)',
  background: 'white',
  outline: 'none',
  minHeight: 46,
}

export const warningStyle = {
  border: '1px solid var(--gray-200)',
  borderRadius: 'var(--radius-sm)',
  padding: '11px 13px',
  fontSize: 12,
  lineHeight: 1.4,
}

function validateQuestionContract() {
  const enums = surveyContract.enums || {}
  const mismatches = []

  for (const question of QUESTIONS) {
    if (question.type === 'price_range') continue
    if (question.type === 'field_group') {
      for (const field of question.fields) {
        const allowedValues = enums[field.key]
        if (!allowedValues || !field.options) continue

        const allowed = new Set(allowedValues)
        for (const option of field.options) {
          if (!allowed.has(option.value)) {
            mismatches.push(`${field.key}.${option.value}`)
          }
        }
      }
      continue
    }

    const allowedValues = enums[question.key]
    if (!allowedValues) continue

    const allowed = new Set(allowedValues)
    for (const option of question.options) {
      if (!allowed.has(option.value)) {
        mismatches.push(`${question.key}.${option.value}`)
      }
    }
  }

  if (mismatches.length > 0) {
    throw new Error(`Contrato de encuesta desalineado: ${mismatches.join(', ')}`)
  }
}

validateQuestionContract()

export function initialAnthropometrics() {
  try {
    const user = getUser() ?? {}
    const profile = user.profile || {}
    return {
      age_years: profile.age_years ?? '',
      weight_value: profile.weight_value ?? '',
      weight_unit: profile.weight_unit || 'kg',
      height_value: profile.height_cm ?? profile.height_value ?? profile.health_goals?.height_cm ?? profile.health_goals?.height_value ?? '',
      height_unit: 'cm',
      height_feet: '',
      height_inches: '',
    }
  } catch {
    return { age_years: '', weight_value: '', weight_unit: 'kg', height_value: '', height_unit: 'cm', height_feet: '', height_inches: '' }
  }
}

export function weightToKg(value, unit = 'kg') {
  if (!Number.isFinite(value) || value <= 0) return null
  const factors = { kg: 1, lb: 0.45359237 }
  return value * (factors[unit] || 1)
}

export function heightToCm(value, unit = 'cm', inchesValue = 0) {
  if (unit === 'ft_in') {
    const feet = Number(value)
    const inches = Number(inchesValue || 0)
    if (!Number.isFinite(feet) || feet <= 0 || !Number.isFinite(inches) || inches < 0 || inches >= 12) return null
    return (feet * 12 + inches) * 2.54
  }
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

export function ageToRange(age) {
  if (age < 18) return 'menos_18'
  if (age <= 30) return '18_30'
  if (age <= 50) return '31_50'
  return 'mas_50'
}

export function weightToRange(weightKg) {
  if (weightKg < 50) return 'menos_50'
  if (weightKg <= 65) return '50_65'
  if (weightKg <= 80) return '66_80'
  return 'mas_80'
}

export function heightToRange(heightCm) {
  if (heightCm < 155) return 'menos_155'
  if (heightCm <= 165) return '155_165'
  if (heightCm <= 175) return '166_175'
  return 'mas_175'
}

export function visibleQuestions(answers) {
  return QUESTIONS.filter(q => !q.when || q.when(answers))
}

export function normalizeMultiSelection(q, current, value) {
  const selected = current.includes(value)
  if (q.noneValue && value === q.noneValue) {
    return selected ? [] : [value]
  }

  let next = selected ? current.filter(item => item !== value) : [...current, value]
  if (q.noneValue) {
    next = next.filter(item => item !== q.noneValue)
  }
  if (q.max && next.length > q.max) {
    return current
  }
  return next
}

export function fieldIsVisible(field, answers) {
  return !field.when || field.when(answers)
}

export function buildPayload(answers) {
  const payload = {}
  const typedLabs = []
  for (const q of QUESTIONS) {
    if (q.when && !q.when(answers)) continue
    const value = answers[q.key]
    if (value === undefined) continue

    if (q.key === 'sintomas') {
      for (const field of Object.values(SYMPTOM_FIELDS)) {
        payload[field] = value.includes(field) ? 'frecuente' : 'nunca'
      }
      continue
    }

    if (q.type === 'anthropometrics') {
      if (value && typeof value === 'object') {
        const age = Number(value.age_years)
        const weightValue = Number(value.weight_value)
        const heightValue = Number(value.height_value)
        const weightUnit = value.weight_unit || 'kg'
        const heightUnit = value.height_unit || 'cm'
        const weightKg = weightToKg(weightValue, weightUnit)
        const heightCm = heightUnit === 'ft_in'
          ? heightToCm(Number(value.height_feet), heightUnit, Number(value.height_inches || 0))
          : heightToCm(heightValue, heightUnit)

        if (Number.isFinite(age)) {
          payload.age_years = age
          payload.edad_rango = ageToRange(age)
        }
        if (weightKg) {
          payload.weight_value = weightValue
          payload.weight_unit = weightUnit
          payload.weight_kg = Number(weightKg.toFixed(4))
          payload.peso_rango = weightToRange(weightKg)
        }
        if (heightCm) {
          payload.height_value = Number(heightCm.toFixed(2))
          payload.height_unit = 'cm'
          payload.height_cm = Number(heightCm.toFixed(2))
          payload.talla_rango = heightToRange(heightCm)
        }
        if (weightKg && heightCm) {
          payload.bmi = Number((weightKg / ((heightCm / 100) ** 2)).toFixed(2))
        }
      }
      continue
    }

    if (q.type === 'price_range') {
      if (value && typeof value === 'object') {
        if (value.min != null) payload.presupuesto_min = value.min
        if (value.max != null) payload.presupuesto_max = value.max
        if ([3, 5].includes(Number(value.packSize))) payload.preferred_pack_size = Number(value.packSize)
      }
      continue
    }

    if (q.type === 'field_group') {
      if (value && typeof value === 'object') {
        for (const field of q.fields) {
          if (!fieldIsVisible(field, answers)) continue
          const fieldValue = value[field.key]
          if (field.lab) {
            const labValue = Number(fieldValue)
            if (fieldValue !== '' && fieldValue != null && Number.isFinite(labValue) && labValue > 0) {
              typedLabs.push({ code: field.lab.code, value: labValue, unit: field.lab.unit })
            }
            continue
          }
          if (field.type === 'current_supplement_doses') {
            if (fieldValue && typeof fieldValue === 'object') {
              const normalizedDoses = {}
              for (const [supplement, dose] of Object.entries(fieldValue)) {
                const amount = Number(dose?.amount)
                if (!Number.isFinite(amount) || amount <= 0) continue
                normalizedDoses[supplement] = {
                  amount,
                  unit: dose?.unit || SUPPLEMENT_DOSE_FIELDS[supplement]?.unit || 'porción/día',
                }
              }
              if (Object.keys(normalizedDoses).length > 0) payload[field.key] = normalizedDoses
            }
            continue
          }
          if (field.type === 'checkbox') {
            if (fieldValue !== undefined) payload[field.key] = Boolean(fieldValue)
            continue
          }
          if (field.type === 'multi_select') {
            if (Array.isArray(fieldValue) && fieldValue.length > 0) payload[field.key] = fieldValue
            continue
          }
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') continue
          if (field.type === 'select') {
            payload[field.key] = fieldValue
            continue
          }
          const numberValue = Number(fieldValue)
          if (Number.isFinite(numberValue)) payload[field.key] = numberValue
        }
      }
      continue
    }

    payload[q.key] = value
  }

  // Garantiza que los campos de síntomas siempre tengan valor aunque la pregunta haya sido omitida
  for (const field of Object.values(SYMPTOM_FIELDS)) {
    if (!(field in payload)) payload[field] = 'nunca'
  }

  if (payload.toma_suplementos === 'no') {
    payload.suplementos_actuales = []
    delete payload.suplementos_frecuencia
    delete payload.suplementos_dosis_conocida
    delete payload.suplementos_dosis_actual
  }
  if (!payload.suplementos_dosis_conocida) {
    delete payload.suplementos_dosis_actual
  }
  let labResults = []
  try {
    const stored = JSON.parse(localStorage.getItem('suplematch_lab_results') || '[]')
    if (Array.isArray(stored)) labResults = stored
  } catch {
    // Ignore invalid localStorage data.
  }
  // Los valores tipeados en "Valores clave" completan lo que vino del examen subido, sin pisarlo.
  const storedCodes = new Set(labResults.map(item => item?.code))
  labResults = [...labResults, ...typedLabs.filter(item => !storedCodes.has(item.code))]
  if (labResults.length > 0) payload.lab_results = labResults.slice(0, 40)
  if (!payload.objetivos) payload.objetivos = []
  return payload
}

export function fieldGroupIsValid(q, answers) {
  const value = answers[q.key]
  if (!value || typeof value !== 'object') return !q.required
  const selectedSupplements = Array.isArray(answers.suplementos_actuales) ? answers.suplementos_actuales : []

  for (const field of q.fields) {
    if (!fieldIsVisible(field, answers)) continue
    const fieldValue = value[field.key]
    if (field.type === 'current_supplement_doses') {
      if (!value.suplementos_dosis_conocida) continue
      if (selectedSupplements.length === 0) continue
      if (!fieldValue || typeof fieldValue !== 'object') return false
      for (const supplement of selectedSupplements) {
        const config = SUPPLEMENT_DOSE_FIELDS[supplement]
        const amount = Number(fieldValue[supplement]?.amount)
        if (!Number.isFinite(amount) || amount <= 0) return false
        if (config?.max != null && amount > config.max) return false
        if (config?.min != null && amount < config.min) return false
      }
      continue
    }
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') continue
    if (field.type === 'checkbox' || field.type === 'select') continue
    if (field.type === 'multi_select') {
      if (fieldValue === undefined || fieldValue === null || fieldValue === '') continue
      if (!Array.isArray(fieldValue)) return false
      continue
    }

    const numberValue = Number(fieldValue)
    if (!Number.isFinite(numberValue)) return false
    if (field.min != null && numberValue < field.min) return false
    if (field.max != null && numberValue > field.max) return false
  }

  if (!q.required) return true
  return q.fields.some(field => {
    const fieldValue = value[field.key]
    return field.type === 'checkbox' ? fieldValue !== undefined : fieldValue !== undefined && fieldValue !== ''
  })
}

export function answerIsValid(q, answers) {
  const value = answers[q.key]
  if (q.type === 'lab_entry') return true
  if (q.type === 'field_group') return fieldGroupIsValid(q, answers)
  if (!q.required) return true
  if (q.type === 'anthropometrics') {
    if (!value || typeof value !== 'object') return false
    const age = Number(value.age_years)
    const weightKg = weightToKg(Number(value.weight_value), value.weight_unit || 'kg')
    const heightCm = value.height_unit === 'ft_in'
      ? heightToCm(Number(value.height_feet), 'ft_in', Number(value.height_inches || 0))
      : heightToCm(Number(value.height_value), value.height_unit || 'cm')
    return Number.isInteger(age)
      && age >= 1
      && age <= 120
      && weightKg >= 2
      && weightKg <= 500
      && heightCm >= 40
      && heightCm <= 260
  }
  if (q.type === 'price_range') return true
  if (q.type === 'single') return value !== undefined
  if (q.noneValue) return true
  return Array.isArray(value) && value.length > 0
}

export function answerLabel(q, answers) {
  const value = answers[q.key]

  if (q.type === 'lab_entry') {
    const count = labResultCount()
    if (count > 0) return `${count} biomarcador${count !== 1 ? 'es' : ''} agregado${count !== 1 ? 's' : ''}`
    return value === 'omitido' ? 'Continuar sin examen' : 'Sin examen agregado'
  }

  if (q.type === 'anthropometrics') {
    if (!value || typeof value !== 'object') return 'Sin responder'
    const age = Number(value.age_years)
    const weightValue = Number(value.weight_value)
    const heightValue = Number(value.height_value)
    const weightUnit = value.weight_unit || 'kg'
    const heightUnit = value.height_unit || 'cm'
    const weightKg = weightToKg(weightValue, weightUnit)
    const heightCm = heightUnit === 'ft_in'
      ? heightToCm(Number(value.height_feet), heightUnit, Number(value.height_inches || 0))
      : heightToCm(heightValue, heightUnit)
    if (!Number.isFinite(age) || !weightKg || !heightCm) return 'Sin responder'
    const heightLabel = heightUnit === 'ft_in'
      ? `${value.height_feet || 0} ft ${value.height_inches || 0} in`
      : `${heightValue} cm`
    return `${age} años · ${weightValue} ${weightUnit} · ${heightLabel}`
  }

  if (q.type === 'price_range') {
    if (!value || typeof value !== 'object') return 'Sin preferencia'
    const { min, max } = value
    if (min == null && max == null) return 'Sin preferencia'
    const suffix = value.packSize ? ` · Top ${value.packSize}` : ''
    if (min != null && max != null) return `S/ ${min} – S/ ${max}${suffix}`
    if (max != null) return `Hasta S/ ${max}`
    return `Desde S/ ${min}`
  }

  if (q.type === 'field_group') {
    if (!value || typeof value !== 'object') return 'Sin responder'
    const labels = q.fields
      .filter(field => fieldIsVisible(field, answers))
      .map(field => {
        const fieldValue = value[field.key]
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') return null
        if (field.type === 'checkbox') {
          return fieldValue ? field.label : null
        }
        if (field.type === 'select') {
          const label = field.options.find(option => option.value === fieldValue)?.label || fieldValue
          return `${field.label}: ${label}`
        }
        if (field.type === 'multi_select') {
          if (!Array.isArray(fieldValue) || fieldValue.length === 0) return null
          const labels = fieldValue.map(item => field.options.find(option => option.value === item)?.label || item)
          return `${field.label}: ${labels.join(', ')}`
        }
        if (field.type === 'current_supplement_doses') {
          if (!fieldValue || typeof fieldValue !== 'object') return null
          const labels = Object.entries(fieldValue)
            .map(([supplement, dose]) => {
              const amount = Number(dose?.amount)
              if (!Number.isFinite(amount) || amount <= 0) return null
              const config = SUPPLEMENT_DOSE_FIELDS[supplement]
              return `${config?.label || supplement}: ${amount} ${dose?.unit || config?.unit || 'porción/día'}`
            })
            .filter(Boolean)
          return labels.length ? `Dosis declaradas: ${labels.join('; ')}` : null
        }
        if (field.type === 'scale5') {
          return `${field.label}: ${scaleSummary(field, fieldValue)}`
        }
        return `${field.label}: ${fieldValue}${field.suffix ? ` ${field.suffix}` : ''}`
      })
      .filter(Boolean)
    return labels.length ? labels.join(', ') : 'Sin responder'
  }

  if (value === undefined) return 'Sin responder'

  if (q.type === 'single') {
    return q.options.find(opt => opt.value === value)?.label || String(value)
  }

  if (!Array.isArray(value) || value.length === 0) return 'Sin responder'
  const labels = value.map(item => q.options.find(opt => opt.value === item)?.label || item)
  return labels.join(', ')
}

export function scaleSummary(field, value) {
  const options = SCALE_PRESETS[field.scale] ?? SCALE_PRESETS.weekly_food
  if (value === '' || value === null || value === undefined) return 'No sé'
  const selected = options.find(option => Number(option.value) === Number(value))
  if (!selected) return 'Sin responder'
  return selected.label
}

export function labResultCount() {
  try {
    const labs = JSON.parse(localStorage.getItem('suplematch_lab_results') || '[]')
    return Array.isArray(labs) ? labs.length : 0
  } catch {
    return 0
  }
}

export function safetyAlerts(answers) {
  const alerts = []
  const conditions = answers.condiciones_seguridad || []
  const age = Number(answers.antropometria?.age_years)
  const ageRange = Number.isFinite(age) ? ageToRange(age) : answers.edad_rango

  if (ageRange === 'menos_18') {
    alerts.push('Menor de edad: requiere supervisión de un adulto y profesional de salud antes de usar suplementos.')
  }
  if (conditions.includes('embarazo_lactancia')) {
    alerts.push('Embarazo o lactancia: no inicies suplementos sin validación profesional.')
  }
  if (conditions.includes('anticoagulantes')) {
    alerts.push('Uso de anticoagulantes: revisa interacciones, especialmente con omega 3, vitamina K y fórmulas herbales.')
  }
  if (conditions.includes('enfermedad_renal')) {
    alerts.push('Enfermedad renal: evita minerales o dosis altas sin control médico.')
  }
  if (conditions.includes('enfermedad_hepatica')) {
    alerts.push('Enfermedad hepática: revisa seguridad y dosis con un profesional antes de tomar suplementos.')
  }
  if (conditions.includes('problema_tiroideo')) {
    alerts.push('Problema tiroideo: evita yodo, algas o fórmulas tiroideas sin evaluación profesional.')
  }
  if (conditions.includes('medicacion_cronica')) {
    alerts.push('Medicación crónica: confirma posibles interacciones antes de iniciar cualquier suplemento.')
  }
  if (conditions.includes('diabetes_medicada')) {
    alerts.push('Medicación para glucosa: cromo, canela y otros suplementos pueden alterar el control glucémico; valida con tu médico.')
  }
  if (conditions.includes('hipertension')) {
    alerts.push('Hipertensión o arritmias: cafeína, energizantes y preworkouts requieren cautela.')
  }
  if (conditions.includes('sedantes')) {
    alerts.push('Uso de sedantes: melatonina, valeriana y L-teanina pueden aumentar la somnolencia.')
  }
  if (conditions.includes('inmunosupresion')) {
    alerts.push('Inmunosupresión o enfermedad grave: probióticos y fórmulas herbales requieren evaluación médica previa.')
  }

  return alerts
}

export function summaryHighlights(answers) {
  const byKey = Object.fromEntries(QUESTIONS.map(item => [item.key, item]))
  const doseCount = Object.keys(answers.suplementos_detalle?.suplementos_dosis_actual ?? {}).length
  const labCount = labResultCount()
  const safetyCount = safetyAlerts(answers).length

  return [
    {
      title: 'Perfil base',
      value: answerLabel(byKey.antropometria, answers),
      detail: [answerLabel(byKey.sexo, answers), answerLabel(byKey.tipo_dieta, answers)].filter(Boolean).join(' · '),
    },
    {
      title: 'Suplementos actuales',
      value: answerLabel(byKey.toma_suplementos, answers),
      detail: answers.toma_suplementos === 'si'
        ? `${answerLabel(byKey.suplementos_actuales, answers)}${doseCount ? ` · ${doseCount} dosis declarada${doseCount !== 1 ? 's' : ''}` : ''}`
        : 'No se marcarán duplicados por uso actual.',
    },
    {
      title: 'Restricciones',
      value: answerLabel(byKey.restricciones, answers),
      detail: 'Alergias, excipientes o ingredientes que prefieres evitar.',
      warning: false,
    },
    {
      title: 'Seguridad médica',
      value: safetyCount > 0 ? `${safetyCount} precaución${safetyCount !== 1 ? 'es' : ''} seleccionada${safetyCount !== 1 ? 's' : ''}` : answerLabel(byKey.condiciones_seguridad, answers),
      detail: safetyCount > 0 ? 'Ver alertas de seguridad abajo.' : 'Situaciones donde se revisan interacciones y precauciones.',
      warning: safetyCount > 0,
    },
    {
      title: 'Compra y datos externos',
      value: answerLabel(byKey.presupuesto, answers),
      detail: labCount > 0 ? `${labCount} biomarcador${labCount !== 1 ? 'es' : ''} de exámenes agregado${labCount !== 1 ? 's' : ''}.` : 'Sin exámenes agregados para esta evaluación.',
    },
  ]
}
