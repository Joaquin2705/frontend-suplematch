import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
})

async function next(page, summary = false) {
  await page.getByRole('button', { name: summary ? 'Revisar respuestas →' : /Siguiente →|Omitir →/ }).click()
}

async function pick(page, name) {
  await page.getByRole('button', { name }).first().click()
}

const stepIndicator = page => page.getByText(/^Paso \d+ de \d+$/)

// Recorre la encuesta por título de paso: los pasos opcionales o sin regla se avanzan con Siguiente/Omitir,
// así el test no se rompe cuando se agregan pasos condicionales o grupos opcionales.
async function answerSurvey(page, {
  critical = false,
  takesSupplements = false,
  allergy = false,
  safety = null,
  extended = false,
} = {}) {
  // addInitScript corre después del clear de beforeEach en cada carga; page.evaluate + reload se borraría.
  await page.addInitScript(() => {
    window.localStorage.setItem('suplematch_token', 'e2e-token')
    window.localStorage.setItem('suplematch_refresh_token', 'e2e-refresh-token')
    window.localStorage.setItem('suplematch_user', JSON.stringify({
      email: 'e2e@suplematch.test',
      roles: ['user'],
      profile: {
        age_years: 34,
        weight_value: 68,
        weight_unit: 'kg',
        height_value: 170,
        height_unit: 'cm',
        height_cm: 170,
      },
    }))
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /Iniciar evaluación/i }).click()

  // Con extended=true se responden también los pasos opcionales del contrato 2026-10-24.1.
  const extendedRules = extended ? [
    [/análisis de sangre en el último año/i, () => pick(page, /^Sí, y tengo los resultados a mano/)],
    [/Valores clave/i, async () => {
      await page.getByLabel('Vitamina D 25-OH').fill('14')
      await page.getByLabel('Ferritina').fill('18')
    }],
    [/Qué sexo/i, () => pick(page, /^Femenino/)],
    [/Alimentos de una semana/i, async () => {
      for (const name of ['Pollo o pavo: 2 o más al día', 'Carne roja o vísceras: 1 vez por semana', 'Pescado o mariscos: 1 vez por semana',
        'Huevos: 4 a 6 por semana', 'Menestras: 2 a 3 por semana', 'Lácteos: 2 o más al día']) {
        await page.getByRole('button', { name }).click()
      }
      // "No sé" deja el grupo sin responder (no cero).
      await page.getByRole('button', { name: 'Frutas y verduras por día: 1 al día' }).click()
      await page.getByRole('button', { name: 'Frutas y verduras por día: no sé' }).click()
    }],
    [/Sobre tu cansancio/i, async () => {
      await page.getByLabel(/Desde cuándo/i).selectOption('mas_3_meses')
      await page.getByLabel(/Mejora cuando duermes/i).selectOption('no')
    }],
    [/^Hierro$/i, async () => {
      await page.getByLabel(/menstruaciones son abundantes/i).selectOption('si')
      await page.getByLabel(/Donas sangre/i).selectOption('no')
    }],
    [/Detalle de tu exposición al sol/i, async () => {
      await page.getByLabel(/protector solar/i).selectOption('siempre')
    }],
  ] : []

  const rules = [
    ...extendedRules,
    // Va antes que /análisis de sangre/: el título de esta pregunta también lo contiene.
    [/análisis de sangre en el último año/i, () => pick(page, /^No me hice análisis/)],
    [/análisis de sangre/i, async () => { await pick(page, /Continuar sin examen/i); return 'advanced' }],
    [/Datos físicos base/i, async () => {
      for (const [label, value] of [['Edad', '34'], ['Peso', '68'], ['Talla', '170']]) {
        const input = page.getByLabel(label)
        if (await input.count()) await input.fill(value)
      }
    }],
    [/Qué sexo/i, () => pick(page, /^Masculino/)],
    [/patrón de alimentación/i, () => pick(page, /^Omnívora/)],
    [/variada fue tu alimentación/i, () => pick(page, /^Regular/)],
    [/exposición solar/i, () => pick(page, /^Menos de 15 minutos/)],
    [/actividad física/i, () => pick(page, /^1 a 2 veces por semana/)],
    [/sientes fatiga/i, () => pick(page, /^A menudo/)],
    [/horas duermes/i, () => pick(page, /^5 a 7 horas/)],
    [/resfríos o infecciones/i, () => pick(page, /^1 a 2 veces al año/)],
    [/estrés o irritabilidad/i, () => pick(page, /^Moderado/)],
    [/Qué quieres priorizar/i, () => pick(page, /^Energía/)],
    [/consumes alcohol/i, () => pick(page, /^Nunca/)],
    [/tomas suplementos/i, () => pick(page, takesSupplements ? /^Sí tomo suplementos/ : /^No tomo suplementos/)],
    [/Cuáles consumes/i, () => pick(page, /^Vitamina D/)],
    [/alergias o restricciones/i, async () => { if (allergy) await pick(page, /^Alergia a pescado o mariscos/) }],
    [/requiere precaución/i, async () => {
      if (critical) await pick(page, /^Enfermedad renal/)
      else if (safety) await pick(page, safety)
    }],
  ]

  const seen = new Set()
  for (let guard = 0; guard < 40; guard++) {
    const summaryButton = page.getByRole('button', { name: 'Enviar encuesta →' })
    if (await summaryButton.isVisible()) break
    const indicator = await stepIndicator(page).textContent()
    const heading = (await page.getByRole('main').getByRole('heading', { level: 2 }).first().textContent()) ?? ''
    if (seen.has(indicator)) throw new Error(`La encuesta no avanzó en ${indicator}: ${heading}`)
    seen.add(indicator)

    const rule = rules.find(([pattern]) => pattern.test(heading))
    const outcome = rule ? await rule[1]() : null
    if (outcome !== 'advanced') {
      const reviewButton = page.getByRole('button', { name: 'Revisar respuestas →' })
      if (await reviewButton.isVisible()) await reviewButton.click()
      else await next(page)
    }
    await expect(stepIndicator(page).or(summaryButton)).not.toHaveText(indicator)
  }

  await page.getByRole('checkbox').check({ force: true })
  await page.getByRole('button', { name: 'Enviar encuesta →' }).click()
}

function recommendationFixture(overrides = {}) {
  return {
    session_id: 'ses_e2e',
    recommendation_id: 'rec_e2e',
    conditions: ['DEFICIT_VIT_D'],
    conditions_display: [
      {
        code: 'DEFICIT_VIT_D',
        display_name: 'Déficit de vitamina D',
        level: 'Alta prioridad',
        probability: 0.82,
        icon_key: 'sun',
      },
    ],
    explainability: [],
    recommendations: [
      {
        component_id: 'COMP_94DFE28A9A5C',
        name: 'Vitamin D',
        display_name: 'Vitamin D',
        reason: 'Indicado por señal de vitamina D.',
        dosage_hint: 'Validar dosis',
        priority: 'principal',
        icon_key: 'sun',
        model2_stage: 'evidence_validated',
        evidence_strength: 'high',
        component_safety_level: 'moderate',
        commercial_eligible: true,
        products: [
          {
            product_id: '11111111-1111-1111-1111-111111111111',
            pharmacy: 'Inkafarma',
            commercial_name: 'Vitamina D Test',
            registro_sanitario: 'RS-1',
            component_id: 'COMP_94DFE28A9A5C',
            ingredient: 'D3',
            price: 25,
            currency: 'PEN',
            availability: 'available',
            url: 'https://example.test',
            regulatory_status: 'digemid_match',
            component_traceable: true,
            commercial_score: 0.91,
            commercial_score_version: 'commercial_ranker_v2',
            commercial_score_breakdown: { component_match: 0.26, price_stock: 0.14 },
            commercial_quality_flags: {
              has_valid_registration: true,
              has_traceable_components: true,
              has_verified_label_flags: true,
              has_inferred_label_flags: false,
              has_declared_amount: true,
              has_price: true,
              has_stock_or_availability: true,
              is_unit_component: true,
              is_multicomponent: false,
            },
            commercial_decision: 'ranked',
            component_match_type: 'unit_component',
            selection_reasons: ['Elegido por mejor precio'],
          },
        ],
      },
    ],
    packs_ranked: [
      {
        pack_id: 'pack_e2e',
        rank: 1,
        title: 'Vitamin D',
        subtitle: '1 suplemento',
        components: [],
        component_ids: ['COMP_94DFE28A9A5C'],
        component_names: ['Vitamin D'],
        feedback_count: 0,
        cta_label: 'Ver',
        selected_products: [
          {
            product_id: '11111111-1111-1111-1111-111111111111',
            pharmacy: 'Inkafarma',
            commercial_name: 'Vitamina D Test',
            registro_sanitario: 'RS-1',
            component_id: 'COMP_94DFE28A9A5C',
            ingredient: 'D3',
            price: 25,
            currency: 'PEN',
            availability: 'available',
            url: 'https://example.test',
            regulatory_status: 'digemid_match',
            component_traceable: true,
            commercial_score: 0.91,
            commercial_score_version: 'commercial_ranker_v2',
            commercial_score_breakdown: { component_match: 0.26, price_stock: 0.14 },
            commercial_quality_flags: {
              has_valid_registration: true,
              has_traceable_components: true,
              has_verified_label_flags: true,
              has_inferred_label_flags: false,
              has_declared_amount: true,
              has_price: true,
              has_stock_or_availability: true,
              is_unit_component: true,
              is_multicomponent: false,
            },
            commercial_decision: 'ranked',
            component_match_type: 'unit_component',
            selection_reasons: ['Elegido por mejor precio'],
          },
        ],
      },
    ],
    sinergias: [],
    alertas: [],
    combo_seguro: true,
    mensaje: 'OK',
    disclaimer: 'Demo',
    profile_warnings: [],
    safety_level: 'normal',
    safety_actions: [],
    commercial_recommendations_blocked: false,
    model_versions: { model2_ranker: 'component_ranker_v2' },
    ...overrides,
  }
}

async function mockRecommend(page, body, captured = null) {
  await page.route('**/api/v1/recommend', route => {
    if (captured) captured.push(route.request().postDataJSON())
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

test('perfil crítico bloquea productos comerciales', async ({ page }) => {
  await mockRecommend(page, recommendationFixture({
    recommendations: [
      {
        component_id: 'COMP_64DE5343502D',
        name: 'Vitamina K',
        display_name: 'Vitamina K',
        reason: 'Contexto de seguridad.',
        dosage_hint: 'No iniciar sin revisión',
        priority: 'complementaria',
        icon_key: 'shield',
        model2_stage: 'evidence_validated',
        evidence_strength: 'contextual',
        recommendation_role: 'safety_context',
        commercial_eligible: false,
        commercial_block_reason: 'Componente mostrado solo como contexto de seguridad.',
        products: [],
      },
    ],
    packs_ranked: [],
    profile_warnings: ['Uso de anticoagulantes: revisar interacciones.'],
    safety_level: 'medical_review_required',
    safety_actions: ['Validar el plan con un profesional de salud antes de comprar o consumir.'],
    commercial_recommendations_blocked: true,
  }))

  await page.goto('/')
  await answerSurvey(page, { critical: true })
  await expect(page.getByText(/Revisión médica requerida/i)).toBeVisible()
  await page.getByRole('button', { name: /Ver mis recomendaciones/i }).click()
  await expect(page.getByText(/Mostramos los suplementos sugeridos/i)).toBeVisible()
  await expect(page.getByText(/Vitamina K/i).first()).toBeVisible()
  await expect(page.getByText(/Solo referencia/i)).toBeVisible()
  await page.getByRole('button', { name: /Ver más información/i }).first().click()
  await expect(page.getByText(/Revisa este componente con un profesional antes de comprar/i)).toBeVisible()
  await expect(page.getByText(/Ocultamos/i)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Ver en tienda/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Producto bloqueado/i })).toHaveCount(0)
})

test('anticoagulantes muestra alerta sin bloquear productos seguros', async ({ page }) => {
  await mockRecommend(page, recommendationFixture({
    profile_warnings: ['Uso de anticoagulantes: revisa interacciones, especialmente con omega 3, vitamina K y fórmulas herbales.'],
    safety_level: 'caution',
    safety_actions: [
      'No iniciar ni combinar suplementos solo con esta recomendación.',
      'Revisar etiqueta, dosis total diaria y posibles interacciones.',
    ],
    commercial_recommendations_blocked: false,
  }))

  await page.goto('/')
  await answerSurvey(page, { safety: /Uso anticoagulantes/i })
  await expect(page.getByText(/Alertas de seguridad/i)).toBeVisible()
  await expect(page.getByText(/omega 3, vitamina K y fórmulas herbales/i)).toBeVisible()
  await page.getByRole('button', { name: /Ver mis recomendaciones/i }).click()
  await expect(page.getByText(/Alertas de seguridad/i)).toBeVisible()
  await page.getByRole('button', { name: /Ver más información/i }).first().click()
  await expect(page.getByText(/Vitamina D Test/i).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Ver en tienda/i }).first()).toBeVisible()
  await expect(page.getByText(/Revisión médica requerida/i)).toHaveCount(0)
})

test('perfil normal muestra evidencia, trazabilidad y producto comercial', async ({ page }) => {
  await mockRecommend(page, recommendationFixture())

  await page.goto('/')
  await answerSurvey(page)
  await page.getByRole('button', { name: /Ver mis recomendaciones/i }).click()
  await expect(page.getByText(/Componentes sugeridos/i)).toBeVisible()
  await expect(page.getByText(/Respaldo alto/i)).toBeVisible()
  await expect(page.getByText(/1 producto trazable disponible/i)).toBeVisible()
  await page.getByRole('button', { name: /Ver más información/i }).first().click()
  await expect(page.getByText(/Vitamina D Test/i).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Ver en tienda/i }).first()).toBeVisible()
  // La tarjeta de producto abre el modal con trazabilidad y score comercial.
  await page.getByRole('button', { name: /Vitamina D Test/i }).first().click()
  await expect(page.getByText(/Producto trazable/i).first()).toBeVisible()
  await expect(page.getByText(/Score comercial/i)).toBeVisible()
  await expect(page.getByText(/Unitario/i)).toBeVisible()
})

test('usuario que ya toma suplementos ve advertencia de duplicidad', async ({ page }) => {
  await mockRecommend(page, recommendationFixture({
    recommendations: [
      {
        ...recommendationFixture().recommendations[0],
        already_taking: true,
      },
    ],
  }))

  await page.goto('/')
  await answerSurvey(page, { takesSupplements: true })
  await page.getByRole('button', { name: /Ver mis recomendaciones/i }).click()
  await expect(page.getByText(/Ya consumes algo similar/i)).toBeVisible()
})

test('alergias y restricciones pueden bloquear componente comercial específico', async ({ page }) => {
  await mockRecommend(page, recommendationFixture({
    recommendations: [
      {
        component_id: 'COMP_F71DD4665D9C',
        name: 'DHA',
        display_name: 'DHA',
        reason: 'Omega 3 contextual.',
        dosage_hint: 'Revisar fuente',
        priority: 'complementaria',
        icon_key: 'fish',
        model2_stage: 'evidence_validated',
        evidence_strength: 'moderate',
        commercial_eligible: false,
        commercial_block_reason: 'DHA marino debe evitarse o revisarse si hay alergia a pescado/mariscos.',
        products: [],
      },
    ],
    packs_ranked: [],
  }))

  await page.goto('/')
  await answerSurvey(page, { allergy: true })
  await page.getByRole('button', { name: /Ver mis recomendaciones/i }).click()
  await expect(page.getByText(/DHA/i).first()).toBeVisible()
  await page.getByRole('button', { name: /Ver más información/i }).first().click()
  await expect(page.getByText(/DHA marino debe evitarse/i)).toBeVisible()
  await expect(page.getByText(/Ocultamos 1 sugerencia/i)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Ver en tienda/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Producto bloqueado/i })).toHaveCount(0)
})

test('admin puede revisar catálogo y calidad', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('suplematch_token', 'admin-token')
    window.localStorage.setItem('suplematch_user', JSON.stringify({
      email: 'admin@suplematch.test',
      roles: ['admin'],
    }))
  })
  await page.route('**/api/v1/admin/products**', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([
      {
        id: 'prod_1',
        pharmacy: 'Inkafarma',
        commercial_name: 'Vitamina D Test',
        brand: 'Demo',
        registro_sanitario: 'RS-1',
        price: 25,
        currency: 'PEN',
        availability: 'available',
        commercial_status: 'active',
        preferred: false,
        blocked: false,
        override_reason: null,
        url: 'https://example.test',
        verification_status: 'verified',
        verification_warnings: [],
        restriction_flags_verified: ['sin_gluten'],
        restriction_flags_inferred: [],
        label_verified_at: null,
        label_verification_source: 'demo',
        commercial_quality_flags: {
          has_valid_registration: true,
          has_traceable_components: true,
          has_verified_label_flags: true,
          has_inferred_label_flags: false,
          is_unit_component: true,
          is_multicomponent: false,
        },
        product_component_count: 1,
        component_traceable: 'digemid_match',
      },
    ]),
  }))
  await page.route('**/api/v1/admin/catalog/quality', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      total_products: 1,
      active_products: 1,
      traceability_rate: 1,
      verified_label_rate: 1,
      products_with_verified_restriction_flags: 1,
      warnings: [],
    }),
  }))
  await page.route('**/api/v1/admin/catalog/candidates**', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      total: 0,
      candidates: [],
      status_counts: {},
      recommended_actions: [],
    }),
  }))

  await page.goto('/')
  await page.getByRole('button', { name: /Catálogo/i }).click()
  await expect(page.getByText(/Calidad de catálogo/i)).toBeVisible()
  await expect(page.getByText(/Vitamina D Test/i)).toBeVisible()
  await expect(page.getByText(/flags verificados/i)).toBeVisible()
  await expect(page.getByText(/unitario/i)).toBeVisible()
  await expect(page.getByText(/componentes trazables/i)).toBeVisible()
})

test('admin puede revisar observabilidad del motor comercial', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('suplematch_token', 'admin-token')
    window.localStorage.setItem('suplematch_user', JSON.stringify({
      email: 'admin@suplematch.test',
      roles: ['admin'],
    }))
  })
  await page.route('**/api/v1/health/ops', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'ok',
      checks: { models_loaded: true, catalog_has_products: true, commercial_engine_quality_ok: true },
      catalog: { products_active: 12, products_with_registro_sanitario: 10 },
      recommendations: { last_7d: 4 },
      reviews: { pending: 1 },
      safety: { active_ingredient_rules: 8 },
      labs: { ocr_engine_available: true, ocr_engine: 'tesseract' },
      commercial_engine_quality: { status: 'passed', cases: 6, passed: 6, pass_rate: 1, errors: [] },
      model2_quality: { status: 'passed', cases: 21, top3_accuracy: 1, block_accuracy: 1, commercial_coverage: 0.95 },
    }),
  }))
  await page.route('**/api/v1/metrics', route => route.fulfill({
    contentType: 'text/plain',
    body: 'suplematch_http_requests_total 10\nsuplematch_app_uptime_seconds 120\n',
  }))
  await page.route('**/api/v1/admin/catalog/jobs/status', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      running: false,
      state: null,
      current_report: null,
      alert: null,
      diff: null,
      latest_job: null,
      jobs: [],
    }),
  }))

  await page.goto('/')
  await page.getByRole('button', { name: /Operación/i }).click()
  await expect(page.getByText(/Motor comercial/i)).toBeVisible()
  await expect(page.getByText(/Pass rate/i)).toBeVisible()
  await expect(page.locator('text=100%').last()).toBeVisible()
})

test('preguntas nuevas de la encuesta llegan al backend sin inventar ceros', async ({ page }) => {
  const sent = []
  const surveyEvents = []
  await mockRecommend(page, recommendationFixture(), sent)
  await page.route('**/api/v1/survey/events', route => {
    surveyEvents.push(...route.request().postDataJSON().events)
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ok', accepted: 1 }) })
  })

  await page.goto('/')
  await answerSurvey(page, { extended: true })
  await expect.poll(() => sent.length).toBe(1)
  const payload = sent[0]

  expect(payload.analisis_ultimo_anio).toBe('si_a_mano')
  expect(payload.lab_results).toEqual(expect.arrayContaining([
    { code: 'vitamin_d', value: 14, unit: 'ng/mL' },
    { code: 'ferritin', value: 18, unit: 'ng/mL' },
  ]))
  // Escala nueva: 2+ al día = 14 porciones/semana (antes el máximo era 7).
  expect(payload.dairy_servings_week).toBe(14)
  expect(payload.poultry_servings_week).toBe(14)
  expect(payload.legume_servings_week).toBe(3)
  // "No sé" no se envía como 0.
  expect(payload).not.toHaveProperty('fruit_veg_servings_day')
  expect(payload.fatiga_duracion).toBe('mas_3_meses')
  expect(payload.fatiga_mejora_descanso).toBe('no')
  expect(payload.menstruacion_abundante).toBe('si')
  expect(payload.dona_sangre).toBe('no')
  expect(payload.protector_solar).toBe('siempre')
  // Paso de B12 oculto para omnívora menor de 50 y medicamentos ocultos sin medicación declarada: no se envían.
  expect(payload).not.toHaveProperty('alimentos_fortificados_b12')
  expect(payload).not.toHaveProperty('anios_dieta_vegetal')
  expect(payload).not.toHaveProperty('medicamentos_b12')
  expect(payload.sexo).toBe('femenino')

  // Embudo: pasos vistos y completados, envío final, y nunca respuestas.
  await expect.poll(() => surveyEvents.some(event => event.event_type === 'submit')).toBe(true)
  const viewed = surveyEvents.filter(event => event.event_type === 'view').map(event => event.step_key)
  expect(viewed).toEqual(expect.arrayContaining(['analisis_ultimo_anio', 'alimentacion_medible', 'factores_hierro', 'resumen']))
  expect(viewed).not.toContain('factores_b12')
  expect(surveyEvents.filter(event => event.event_type === 'complete').length).toBeGreaterThan(10)
  expect(new Set(surveyEvents.map(event => event.survey_session_id)).size).toBe(1)
  for (const event of surveyEvents) {
    expect(Object.keys(event).sort()).toEqual(['contract_version', 'event_type', 'position', 'step_key', 'survey_session_id', 'visible_steps'])
  }
})
