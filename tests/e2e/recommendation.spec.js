import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
})

async function answerSurvey(page, { critical = false } = {}) {
  await page.getByRole('button', { name: /Iniciar evaluación/i }).click()

  const choices = [
    critical ? 'Menos de 18 años' : '31 a 50 años',
    'Prefiero no decir',
    '50 a 65 kg',
    '155 a 165 cm',
    'Omnívora',
    'Regular',
    'Menos de 15 minutos',
    '1 a 2 veces por semana',
    'A menudo',
    '5 a 7 horas',
    '1 a 2 veces al año',
    'Moderado',
  ]

  for (const choice of choices) {
    await page.getByRole('button', { name: new RegExp(choice, 'i') }).click()
    await page.getByRole('button', { name: 'Siguiente →' }).click()
  }

  await page.getByRole('button', { name: /Ninguno de estos/i }).click()
  await page.getByRole('button', { name: 'Siguiente →' }).click()
  await page.getByRole('button', { name: /Energía/i }).click()
  await page.getByRole('button', { name: 'Siguiente →' }).click()
  await page.getByRole('button', { name: /Nunca/i }).click()
  await page.getByRole('button', { name: 'Siguiente →' }).click()
  await page.getByRole('button', { name: /No tomo suplementos/i }).click()
  await page.getByRole('button', { name: 'Siguiente →' }).click()
  await page.getByRole('button', { name: /Sin restricciones conocidas/i }).click()
  await page.getByRole('button', { name: 'Siguiente →' }).click()
  await page.getByRole('button', { name: critical ? /Uso anticoagulantes/i : /Ninguna de estas/i }).click()
  await page.getByRole('button', { name: 'Siguiente →' }).click()
  await page.getByRole('button', { name: /Bajo/i }).click()
  await page.getByRole('button', { name: 'Revisar respuestas →' }).click()
  await page.getByRole('checkbox').check({ force: true })
  await page.getByRole('button', { name: 'Enviar encuesta →' }).click()
}

test('perfil crítico bloquea productos comerciales', async ({ page }) => {
  await page.route('**/api/v1/recommend', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      session_id: 'ses_e2e',
      recommendation_id: 'rec_e2e_critical',
      conditions: ['DEFICIT_VIT_D'],
      conditions_display: [{ code: 'DEFICIT_VIT_D', display_name: 'Déficit de vitamina D', level: 'Alta prioridad', probability: 0.82, icon_key: 'sun' }],
      explainability: [],
      recommendations: [{ component_id: 'cmp_vit_d', name: 'Vitamin D', display_name: 'Vitamin D', reason: 'Indicado.', dosage_hint: 'Validar dosis', priority: 'principal', icon_key: 'sun', products: [] }],
      packs_ranked: [],
      sinergias: [],
      alertas: [],
      combo_seguro: true,
      mensaje: 'OK',
      disclaimer: 'Demo',
      profile_warnings: ['Uso de anticoagulantes: revisar interacciones.'],
      safety_level: 'medical_review_required',
      safety_actions: ['Validar el plan con un profesional de salud antes de comprar o consumir.'],
      commercial_recommendations_blocked: true,
      model_versions: {},
    }),
  }))

  await page.goto('/')
  await answerSurvey(page, { critical: true })
  await expect(page.getByText(/Revisión médica requerida/i)).toBeVisible()
  await page.getByRole('button', { name: /Ver mis recomendaciones/i }).click()
  await expect(page.getByText(/Productos comerciales ocultos/i)).toBeVisible()
})

test('perfil normal muestra producto comercial', async ({ page }) => {
  await page.route('**/api/v1/recommend', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      session_id: 'ses_e2e',
      recommendation_id: 'rec_e2e_normal',
      conditions: ['DEFICIT_VIT_D'],
      conditions_display: [{ code: 'DEFICIT_VIT_D', display_name: 'Déficit de vitamina D', level: 'Alta prioridad', probability: 0.82, icon_key: 'sun' }],
      explainability: [],
      recommendations: [{
        component_id: 'cmp_vit_d',
        name: 'Vitamin D',
        display_name: 'Vitamin D',
        reason: 'Indicado.',
        dosage_hint: 'Validar dosis',
        priority: 'principal',
        icon_key: 'sun',
        products: [{ pharmacy: 'Inkafarma', commercial_name: 'Vitamina D Test', registro_sanitario: 'RS-1', component_id: 'cmp_vit_d', ingredient: 'D3', price: 25, currency: 'PEN', availability: 'available', url: 'https://example.test', regulatory_status: 'digemid_match', selection_reasons: ['Elegido por mejor precio'] }],
      }],
      packs_ranked: [{ pack_id: 'pack_e2e', rank: 1, title: 'Vitamin D', subtitle: '1 suplemento', components: [], component_ids: ['cmp_vit_d'], component_names: ['Vitamin D'], feedback_count: 0, cta_label: 'Ver', selected_products: [{ pharmacy: 'Inkafarma', commercial_name: 'Vitamina D Test', registro_sanitario: 'RS-1', component_id: 'cmp_vit_d', ingredient: 'D3', price: 25, currency: 'PEN', availability: 'available', url: 'https://example.test', regulatory_status: 'digemid_match', selection_reasons: ['Elegido por mejor precio'] }] }],
      sinergias: [],
      alertas: [],
      combo_seguro: true,
      mensaje: 'OK',
      disclaimer: 'Demo',
      profile_warnings: [],
      safety_level: 'normal',
      safety_actions: [],
      commercial_recommendations_blocked: false,
      model_versions: {},
    }),
  }))

  await page.goto('/')
  await answerSurvey(page)
  await page.getByRole('button', { name: /Ver mis recomendaciones/i }).click()
  await page.getByRole('button', { name: /Ver productos recomendados del pack/i }).click()
  await expect(page.getByText(/Vitamina D Test/i)).toBeVisible()
  await expect(page.getByText(/Elegido por mejor precio/i).first()).toBeVisible()
})
