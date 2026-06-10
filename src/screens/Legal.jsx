const CONTENT = {
  privacy: {
    title: 'Privacidad y datos de salud',
    intro: 'SupleMatch trata tus datos para entregar orientación informativa sobre suplementos. Los datos relacionados con salud, incluyendo biomarcadores de exámenes, son sensibles y solo se procesan cuando das consentimiento explícito.',
    sections: [
      ['Responsable y finalidad', 'Usamos tus respuestas, restricciones, suplementos actuales, feedback, reseñas y biomarcadores opcionales para generar recomendaciones, historial, seguridad del perfil y métricas agregadas del prototipo.'],
      ['Datos sensibles', 'La información relacionada con salud se considera sensible. Por eso los exámenes requieren consentimiento separado, no son obligatorios y puedes usar la app sin subir archivos.'],
      ['Exámenes y OCR', 'Si subes PDF o imagen, extraemos texto para detectar biomarcadores soportados. No debes subir documentos de terceros ni datos innecesarios como DNI, dirección o teléfono.'],
      ['Conservación', 'Si no inicias sesión, el análisis puede procesarse sin guardarse. Si inicias sesión, guardamos historial de exámenes hasta que lo elimines desde la app o solicites borrado.'],
      ['Exportación y eliminación', 'Puedes exportar tus exámenes guardados y eliminar un reporte o todos tus datos de salud. Al eliminar, se borra el texto extraído y los valores de biomarcadores asociados.'],
      ['Compartición', 'No vendemos datos personales. Las métricas usadas para ranking y operación se presentan agregadas. Para producción pública se debe cerrar una política legal revisada por especialista.'],
      ['Seguridad', 'Aplicamos autenticación, roles, auditoría administrativa, bloqueo de perfiles críticos y observabilidad. Aun así, no subas información que no quieras procesar en este prototipo.'],
    ],
  },
  terms: {
    title: 'Términos de uso',
    intro: 'SupleMatch es una herramienta informativa para comparar suplementos y señales de perfil. No diagnostica, no prescribe, no receta y no reemplaza la evaluación de un médico, nutricionista o químico farmacéutico.',
    sections: [
      ['Uso permitido', 'Puedes usar la encuesta y, opcionalmente, exámenes para recibir orientación general. Debes entregar información verdadera y revisar siempre etiquetas, dosis, contraindicaciones e interacciones.'],
      ['Perfiles críticos', 'Si declaras minoría de edad, embarazo/lactancia, enfermedad renal o hepática, anticoagulantes, medicación crónica o si un examen muestra señales críticas, la app oculta compra y productos comerciales.'],
      ['Exámenes de laboratorio', 'Los biomarcadores se usan como señales para conversación con un profesional. Un valor fuera de rango no equivale a diagnóstico y puede depender de unidad, método, laboratorio y contexto clínico.'],
      ['Productos comerciales', 'El catálogo muestra productos reales, precios, stock, farmacias y registro sanitario cuando está disponible. La información puede cambiar y debe verificarse antes de comprar.'],
      ['Registro sanitario', 'La existencia de un registro sanitario informado no significa que el producto sea adecuado para tu caso. El uso seguro depende de tu perfil, dosis, interacciones y validación profesional.'],
      ['Reviews', 'Las reseñas son de suplementos unitarios, no de packs completos. Pueden moderarse si contienen spam, datos personales, claims médicos o dosis inseguras.'],
      ['Limitación del prototipo', 'Este proyecto universitario busca demostrar viabilidad de producto. Antes de uso público se requiere revisión legal, clínica, farmacéutica, de seguridad y de protección de datos.'],
    ],
  },
}

export default function Legal({ goTo, type = 'terms' }) {
  const content = CONTENT[type] ?? CONTENT.terms

  return (
    <div className="screen" style={{ background: 'white', gap: 0 }}>
      <button
        type="button"
        onClick={() => goTo('landing')}
        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 20, cursor: 'pointer', marginBottom: 18 }}
      >
        ←
      </button>
      <h1 style={{ fontSize: 27, color: 'var(--gray-800)', lineHeight: 1.2, marginBottom: 10 }}>{content.title}</h1>
      <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.55, marginBottom: 22 }}>{content.intro}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {content.sections.map(([title, body]) => (
          <section key={title} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
            <h2 style={{ fontSize: 14, color: 'var(--gray-800)', marginBottom: 6 }}>{title}</h2>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.45 }}>{body}</p>
          </section>
        ))}
      </div>

      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button type="button" className="btn-primary" onClick={() => goTo('encuesta')}>Ir a la evaluación</button>
        <button type="button" className="btn-secondary" onClick={() => goTo(type === 'privacy' ? 'terminos' : 'privacidad')}>
          Ver {type === 'privacy' ? 'términos' : 'privacidad'}
        </button>
      </div>
    </div>
  )
}
