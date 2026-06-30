# AGENTS.md — Frontend SupleMatch

Instrucciones para agentes que trabajan exclusivamente en `/home/leo/DPD/Proyecto/frontend-suplematch/`.

## Autorización de cambios

Este agente tiene **permiso directo para editar archivos, crear componentes y ajustar estilos** sin pedir confirmación previa. No hace falta solicitar aprobación para cambios de UI, estilos, lógica de pantalla o ajustes de CSS.

Límites que sí requieren confirmación explícita del usuario:
- Instalar nuevas dependencias npm.
- Modificar `vite.config.js`, `Dockerfile`, `nginx.conf` o archivos de Docker.
- Eliminar archivos o pantallas completas.
- Cambiar contratos de API (`src/api/suplematch.js`) más allá de ajustes menores de presentación.
- Modificar `src/contracts/surveyContract.json`.

---

## Stack y entorno

- React 19, Vite 8, JavaScript/JSX puro (sin TypeScript).
- Sin librería de UI (no Shadcn, no MUI, no Tailwind). Todo es CSS manual + variables globales + estilos inline en componentes.
- Gestión de estado: `useState` / `useEffect` / `useCallback` locales + prop drilling desde `App.jsx`. No hay Redux, Zustand ni Context API instalados.
- Pruebas: ESLint 10 + build de Vite + Playwright E2E (no hay unit tests de componentes).
- Node requerido: ≥ 20.19 (Vite 8 lo necesita). Si el sistema tiene Node antiguo, usar `PATH=/home/leo/DPD/Proyecto/.venv/bin:$PATH npm run ...`.

Comandos de desarrollo:
```bash
cd /home/leo/DPD/Proyecto/frontend-suplematch
npm run dev        # servidor dev
npm run lint       # ESLint
npm run build      # build de producción (valida siempre antes de terminar)
```

---

## Arquitectura de pantallas

### Navegación (`src/App.jsx`)

`App.jsx` es el router. Un único `useState('landing')` controla qué pantalla se muestra. Navegar = llamar `goTo('nombrePantalla')`.

Pantallas registradas en `SCREENS`:
| key | Componente | Descripción |
|---|---|---|
| `landing` | Landing | Inicio, hero, acciones rápidas |
| `acceso` | Acceso | Login / registro |
| `encuesta` | Encuesta | Encuesta de perfil |
| `loading` | Loading | Pantalla de carga / procesamiento |
| `condiciones` | Condiciones | Resumen de condiciones detectadas |
| `recomendaciones` | Recomendaciones | Packs + componentes + productos |
| `precios` | Precios | Vista de precios / plan |
| `feedback` | Feedback | Feedback detallado |
| `historial` | Historial | Historial de recomendaciones |
| `examenes` | Examenes | Subida de exámenes de laboratorio |
| `perfil` | Perfil | Perfil del usuario |
| `privacidad` | Legal (type="privacy") | Política de privacidad |
| `terminos` | Legal (type="terms") | Términos de uso |
| `adminCatalog` | AdminCatalog | Admin: catálogo |
| `adminOps` | AdminOps | Admin: operaciones |
| `adminReviews` | AdminReviews | Admin: moderación de reviews |
| `adminSafetyRules` | AdminSafetyRules | Admin: reglas de seguridad |

Pantallas con tabbar (`TAB_SCREENS`): `landing`, `examenes`, `historial`, `perfil`, `acceso`.

### Props estándar de cada pantalla

Todos los componentes de pantalla reciben estas props desde `App.jsx`:

```jsx
{ goTo, prevScreen, showToast, userData, setUserData,
  apiResult, setApiResult, selectedRec, setSelectedRec,
  authToken, setAuthToken, authUser, setAuthUser }
```

No es necesario usar todas. Solo importar las que la pantalla necesita.

### Agregar una pantalla nueva

1. Crear `src/screens/NuevaPantalla.jsx`.
2. Importarla en `App.jsx` y agregarla a `SCREENS`.
3. Si debe mostrar tabbar, añadir su key a `TAB_SCREENS`.

---

## Sistema de diseño

### Variables CSS (`src/index.css`)

**Colores semánticos:**

| Variable | Valor | Uso |
|---|---|---|
| `--green` | `#19A974` | Acción principal, éxito, CTA primario |
| `--green-light` | `#E7F7F0` | Fondos de cards verdes, chips activos |
| `--green-dark` | `#087A55` | Texto sobre fondo verde, kickers, badges |
| `--mint-50` | `#F3FBF7` | Gradiente suave en cards positivas |
| `--blue` | `#2563EB` | Info, badges informativos |
| `--blue-light` | `#EAF1FF` | Fondos de alertas informativas |
| `--amber` | `#D97706` | Advertencias, estados de precaución |
| `--amber-light` | `#FFF7E8` | Fondos de alertas de advertencia |
| `--red` | `#B42318` | Error, peligro, bloqueado |
| `--red-light` | `#FFF1F0` | Fondos de alertas críticas |
| `--white` | `#FFFFFF` | Fondos de cards, overlays |

**Grises (escala de 25 a 900):**

| Variable | Uso típico |
|---|---|
| `--gray-25` / `--gray-50` | Fondos de sección, backgrounds alternativos |
| `--gray-100` / `--gray-200` | Bordes suaves, separadores |
| `--gray-300` | Bordes más visibles, placeholders |
| `--gray-400` / `--gray-500` | Texto secundario, subtítulos, labels |
| `--gray-600` | Texto de apoyo, subtítulos de sección |
| `--gray-700` | Texto secundario con más peso |
| `--gray-800` | Texto principal de contenido |
| `--gray-900` | Títulos, texto de máximo contraste |

**Sombras:**

| Variable | Uso |
|---|---|
| `--shadow` | Cards principales, superficies elevadas |
| `--shadow-soft` | Cards secundarias, hover states, chips |

**Radios:**

| Variable | Valor | Uso |
|---|---|---|
| `--radius` | `20px` | Cards principales (`.surface`) |
| `--radius-sm` | `14px` | Cards secundarias, product cards |
| `--radius-xs` | `10px` | Inputs, métricas pequeñas |
| `999px` (literal) | Pills, badges, botones redondeados |

**Layout:**

| Variable | Valor | Uso |
|---|---|---|
| `--content-max` | `430px` | Ancho máximo del contenido en pantalla |

---

### Clases CSS globales disponibles

#### Shell y layout

| Clase | Descripción |
|---|---|
| `.phone` | El contenedor "teléfono" de 430px x 920px. Nunca tocar. |
| `.phone.has-tabbar` | Añade padding inferior para el tabbar. Se aplica automáticamente. |
| `.screen` | Wrapper scrollable de cada pantalla. Usar como raíz de cada componente. |
| `.app-shell` | `display: flex; flex-direction: column; gap: 18px`. Usar dentro de `.screen` para separar secciones. |

#### Tipografía semántica

| Clase | Uso | Font size |
|---|---|---|
| `.app-kicker` | Label superior de sección (verde, uppercase, 11px) | 11px |
| `.app-title` | Título principal de pantalla | 28px / `font-weight: 900` |
| `.app-subtitle` | Descripción bajo el título | 14px / `color: --gray-600` |
| `.section-title` | Título de subsección | 16px / `font-weight: 900` |
| `.section-copy` | Párrafo descriptivo de sección | 13px / `color: --gray-600` |

#### Superficies / cards

| Clase | Descripción |
|---|---|
| `.surface` | Card blanca con borde sutil, sombra y radio 20px. Card principal. |
| `.surface-soft` | Card blanca más transparente, radio 14px. Card secundaria. |
| `.mobile-hero-card` | `.surface` con decoración de círculo verde en esquina. Para el hero de Landing. |
| `.dashboard-card` | Card pequeña del grid 3 columnas. Mínimo 128px alto. |
| `.quick-card` | Card de acción rápida en grid 2 columnas. Con `.quick-icon`. |
| `.flow-step-card` | Card de paso de flujo con estado `.is-active`. |
| `.routine-card` | Card de rutina con fondo verde suave. |
| `.compact-product-card` | Card de producto compacta. |
| `.metric-card` | Card de métrica pequeña (grid 3 col). |

#### Botones

| Clase | Uso |
|---|---|
| `.btn-primary` | CTA verde principal, full-width, pill. |
| `.btn-primary.dark` | CTA oscuro (gris-800). |
| `.btn-primary:disabled` | Estado deshabilitado. Usar con prop `disabled`. |
| `.btn-secondary` | Botón secundario blanco con borde. |
| `.back-link` | Botón tipo link "← Volver" sin borde. |

#### Badges y chips

| Clase | Color |
|---|---|
| `.badge.badge-green` | Verde: estado positivo, disponible |
| `.badge.badge-blue` | Azul: informativo |
| `.badge.badge-amber` | Ámbar: advertencia |
| `.badge.badge-red` | Rojo: bloqueado, crítico |
| `.badge.badge-gray` | Gris: neutral, metadata |

Estructura de un badge:
```jsx
<span className="badge badge-green">Texto</span>
```

#### Alertas

| Clase | Uso |
|---|---|
| `.alert.alert-info` | Info azul: contexto informativo |
| `.alert.alert-safe` | Verde: confirmación, trazabilidad |
| `.alert.alert-warn` | Ámbar: precaución, advertencia de seguridad |
| `.alert.alert-danger` | Rojo: crítico, bloqueado médicamente |

#### Grids predefinidos

| Clase | Columnas | Uso |
|---|---|---|
| `.dashboard-grid` | 3 col | Grid de 3 dashboard cards |
| `.quick-grid` | 2 col | Grid de acciones rápidas |
| `.metric-grid` | 3 col (1 col en <360px) | Grid de métricas numéricas |

#### Filas de contenido

| Clase | Descripción |
|---|---|
| `.timeline-row` | Grid 34px + 1fr con icono y texto |
| `.routine-row` | Grid 36px + 1fr con icono y texto. Borde superior entre filas. |
| `.routine-icon` | Icono cuadrado 36px con fondo verde claro |

#### Formularios

| Clase | Descripción |
|---|---|
| `.input-control` | Input estándar 46px mínimo. Focus con borde verde y glow. |
| `.option-card` | Botón de opción seleccionable. Estado `.is-selected` con borde verde. |

#### Feedback / rating

| Clase | Descripción |
|---|---|
| `.feedback-overlay` | Overlay oscuro fijo, alineado al fondo |
| `.feedback-sheet` | Sheet blanco redondeado encima del overlay |
| `.rating-row` | Grid 5 columnas para botones de rating |
| `.rating-button` | Botón de rating. Estado `.is-active` verde. |

#### Tabbar

| Clase | Descripción |
|---|---|
| `.mobile-tabbar` | Nav bar flotante inferior |
| `.mobile-tab` | Item del tabbar. Estado `.is-active` con fondo verde claro. |
| `.mobile-tab-icon` | Icono del item del tabbar |

#### Animaciones

| Clase / keyframe | Uso |
|---|---|
| `.screen` (automático) | `fadeIn` 0.3s al cambiar pantalla: slide desde la derecha |
| `.rec-card-enter` | `fadeInUp` 0.38s para cards de recomendación. Usar con `animationDelay`. |

#### Toast

| Clase | Descripción |
|---|---|
| `.toast` | Toast oscuro centrado. Se muestra llamando `showToast('mensaje')`. |

#### Product detail

| Clase | Descripción |
|---|---|
| `.product-detail-hero` | Header verde oscuro con gradiente para detalle de producto |
| `.price-pill` | Pill de precio sobre fondo verde oscuro |

#### Indicadores de salud

| Clase | Descripción |
|---|---|
| `.health-ring` | Anillo circular tipo donut (CSS conic-gradient). Decorativo. |
| `.wellness-strip` | Flex-wrap de chips "Perfil / Safety / Pack / Feedback" |
| `.dashboard-status` | Banner de estado con gradiente verde-azul y botón |

#### Panel comercial

| Clase | Descripción |
|---|---|
| `.commercial-panel` | Grid de contenido con h2, p y subcomponentes |
| `.app-header` | Header con logo y badge de usuario |

---

## Patrones de código

### Estructura de una pantalla nueva

```jsx
export default function MiPantalla({ goTo, prevScreen, showToast, authToken, authUser }) {
  return (
    <div className="screen app-shell">
      <header className="surface">
        <button onClick={() => goTo(prevScreen ?? 'landing')} className="back-link" type="button">
          ← Volver
        </button>
        <div>
          <div className="app-kicker">Contexto</div>
          <h1 className="app-title">Título principal</h1>
          <p className="app-subtitle">Descripción breve.</p>
        </div>
      </header>

      <section className="surface">
        <div className="section-title">Subsección</div>
        <p className="section-copy">Descripción.</p>
        {/* Contenido */}
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-primary" onClick={() => goTo('recomendaciones')}>
          Continuar →
        </button>
      </div>
    </div>
  )
}
```

### Estilos inline vs clases CSS

**Usar clases CSS cuando:** el patrón ya existe como clase global (`.surface`, `.btn-primary`, `.badge-green`, etc.).

**Usar estilos inline cuando:** el ajuste es específico a ese componente (un margen extra, un color puntual, un tamaño único). El proyecto mezcla ambos de forma explícita — es el patrón establecido, no hay que cambiarlo.

Patrón correcto para estilos inline:
```jsx
// Correcto: ajuste específico de instancia
<div className="surface" style={{ gap: 14, padding: 20 }}>

// Correcto: layout inline porque no hay clase para esto
<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

// Evitar: no crear estilos inline que dupliquen una clase ya existente
<button style={{ background: '#19A974', color: 'white', borderRadius: 999 }}> // Usar .btn-primary
```

### Chip inline reutilizable (patrón de Recomendaciones)

Para chips dentro de componentes, copiar el patrón establecido:

```jsx
function Chip({ children, color = 'var(--gray-600)', bg = 'var(--gray-100)' }) {
  return (
    <span style={{
      fontSize: 10, color, background: bg,
      borderRadius: 99, padding: '3px 7px',
      fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}
```

### Modal / overlay

Siempre usar el patrón existente con `role="dialog"` y `aria-modal="true"`:

```jsx
{isOpen && (
  <div
    role="dialog"
    aria-modal="true"
    style={{
      position: 'fixed', inset: 0,
      background: 'rgba(17,24,39,0.42)',
      zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}
    onClick={() => setIsOpen(false)}
  >
    <div
      style={{
        width: 'min(430px, 100%)',
        maxHeight: '86vh', overflowY: 'auto',
        background: 'white',
        borderRadius: 18,
        border: '1px solid var(--gray-200)',
        boxShadow: '0 24px 80px rgba(15,23,42,0.22)',
        padding: 16,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* contenido */}
    </div>
  </div>
)}
```

### Animación staggered para listas de cards

```jsx
{items.map((item, index) => (
  <div
    key={item.id}
    className="rec-card-enter"
    style={{ animationDelay: `${index * 0.07}s` }}
  >
    {/* card */}
  </div>
))}
```

### Toast

```jsx
showToast?.('Mensaje corto para el usuario')
```

### Imagen con fallback

Copiar el patrón `ProductThumb` de `Recomendaciones.jsx` para cualquier imagen que puede fallar.

---

## Jerarquía visual y decisiones de diseño

### Escala tipográfica en uso

| Tamaño | Uso |
|---|---|
| 9–10px | Labels, métricas, uppercase kickers, texto más pequeño |
| 11px | Subetiquetas, texto de apoyo, fechas |
| 12px | Texto secundario, descripciones de cards |
| 13px | Texto principal de cards, subtítulos de sección, etiquetas de input |
| 14px | App subtitle, texto de formulario |
| 15–16px | Nombres en cards grandes, section-title |
| 18–19px | Títulos de modales y panels |
| 20px | Títulos de landing medianos |
| 25–28px | `app-title`, títulos de pantalla |

### Espaciado

Usar múltiplos de `gap`/`padding` consistentes:
- Gaps entre secciones: `18px` (`.app-shell`)
- Gaps internos de cards: `10–14px`
- Gaps entre items en listas: `8–10px`
- Padding de cards grandes (`.surface`): `18px`
- Padding de cards pequeñas: `12–14px`
- Padding de la pantalla: `34px 20px 30px` (lo da `.screen`)

### Semántica de colores en UI

| Color | Cuándo usarlo |
|---|---|
| Verde (`--green`) | CTA primario, disponible, aprobado, trazable |
| Verde claro (`--green-light`) | Fondos de chips y estados activos |
| Verde oscuro (`--green-dark`) | Texto verde sobre fondo claro (kickers, precio verde) |
| Ámbar | Precaución, "requiere revisión", advertencia leve |
| Rojo | Bloqueado, error crítico, interacción peligrosa |
| Azul | Info, estado neutral informativo |
| Grises medios (400–600) | Texto de apoyo, labels, subtítulos |
| Gray-800 / Gray-900 | Texto principal y títulos |

**Regla de seguridad médica:** Siempre que se muestre una alerta de salud o interacción, usar `.alert-warn` o `.alert-danger`. Nunca usar solo texto plano para advertencias críticas.

### Mobile-first

- El contenedor `.phone` tiene máximo `430px` y la UI se diseña dentro de él.
- En pantallas reales ≤430px, el `.phone` ocupa todo el viewport sin bordes.
- Los tap targets mínimos son `48px` de altura para botones importantes.
- Las fuentes nunca escalan con viewport (`vw`), solo con `px` fijos.
- Los textos largos usan `lineHeight: 1.4–1.55` para legibilidad en móvil.

### Progresión y disclosure

- Información secundaria va en `<details>/<summary>` o detrás de un botón "Ver más".
- Cards complementarias van ocultas por defecto con un toggle.
- Acciones destructivas o sensibles se posicionan al final, en gris, sin peso visual.

---

## Reglas de seguridad médica (obligatorias)

- Nunca presentar recomendaciones como diagnóstico médico.
- Siempre incluir el disclaimer: "Esta sugerencia es orientativa. Siempre consulta a un profesional..."
- Si se muestra `safety_level === 'medical_review_required'`: usar `.alert-warn` con texto de revisión médica.
- Si `commercial_recommendations_blocked === true`: nunca mostrar botones de compra directa.
- No mostrar precios ni links de tienda cuando el perfil tiene bloqueo comercial activo.
- Mantener los mensajes de advertencia en español claro y sin tecnicismos.

---

## Integración con backend

### Cliente API (`src/api/suplematch.js`)

Todas las llamadas al backend van por este módulo. Nunca hacer `fetch` directo en los componentes.

El cliente maneja automáticamente:
- Refresh de token via `refreshSession()` cuando el servidor devuelve 401.
- Dispatch de eventos `suplematch-auth-refreshed` y `suplematch-auth-expired` que `App.jsx` escucha.

Patrón de llamada en componente:

```jsx
import { getRecommendations } from '../api/suplematch'

async function fetchRecs() {
  try {
    const result = await getRecommendations(payload, authToken)
    setApiResult(result)
  } catch (error) {
    showToast?.(error.message)
  }
}
```

### Estado compartido clave

| Prop / estado | Dónde vive | Qué contiene |
|---|---|---|
| `authToken` | `App.jsx` → `localStorage` | JWT de acceso |
| `authUser` | `App.jsx` → `localStorage` | `{ email, roles, ... }` |
| `userData` | `App.jsx` | Datos del formulario de encuesta |
| `apiResult` | `App.jsx` | Resultado completo del backend (recomendaciones, packs, alertas, etc.) |
| `selectedRec` | `App.jsx` | Recomendación seleccionada para detalle |

---

## Flujos críticos que no deben romperse

1. **Auth:** Login → setAuthToken + setAuthUser + localStorage. Logout → limpiar ambos + localStorage.
2. **Encuesta → Loading → Condiciones → Recomendaciones**: el `apiResult` fluye por todas estas pantallas.
3. **Refresh de sesión**: manejado en `src/api/suplematch.js` via eventos de window. No duplicar esta lógica.
4. **Tabbar**: las pantallas en `TAB_SCREENS` muestran el nav bar inferior. Las demás no. No romper este set.
5. **Feedback y reviews**: usan `authToken`. Si no hay token, mostrar aviso y no crashear.

---

## Validación antes de terminar

Siempre ejecutar antes de reportar un cambio como terminado:

```bash
cd /home/leo/DPD/Proyecto/frontend-suplematch
npm run lint
npm run build
```

Si el sistema tiene Node antiguo:
```bash
PATH=/home/leo/DPD/Proyecto/.venv/bin:$PATH npm run lint
PATH=/home/leo/DPD/Proyecto/.venv/bin:$PATH npm run build
```

El build de Vite sirve como typecheck informal: si rompe un import o una sintaxis JSX, falla aquí.

Los E2E (`npm run e2e`) solo son necesarios cuando se cambia un flujo completo (registro, encuesta, recomendaciones).

---

## Lo que NO hacer

- No instalar librerías de UI (MUI, Chakra, Shadcn, Tailwind, etc.).
- No introducir CSS Modules ni archivos `.module.css`.
- No usar `import React from 'react'` — React 19 no lo requiere.
- No agregar `PropTypes` — el proyecto no los usa.
- No mover API calls fuera de `src/api/suplematch.js`.
- No crear contextos globales de React sin necesidad real.
- No hardcodear URLs de la API — siempre ir por el cliente de `src/api/suplematch.js`.
- No poner lógica de negocio en `App.jsx` más allá del routing y estado global ya existente.
- No romper el sistema de variables CSS — toda extensión de color o tamaño debe referenciar variables existentes o agregar nuevas en `src/index.css`.
- No crear nuevos archivos `.css` — los estilos compartidos van en `src/index.css` como clases, o inline en el componente.
- No alterar `.phone`, `.screen`, `.mobile-tabbar` ni las animaciones de `.screen` — son la base de la shell.

---

## Checklist de calidad para cambios de UI

Antes de reportar el trabajo como terminado:

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa sin errores.
- [ ] El cambio preserva todas las clases CSS existentes usadas en ese componente.
- [ ] Los colores usan variables CSS (no hexadecimales hardcodeados salvo necesidad puntual con rgba).
- [ ] Los tap targets de botones tienen al menos 44px de altura efectiva.
- [ ] El texto es legible en 375px de ancho (iPhone SE).
- [ ] Los modales cierran al hacer click fuera (en el overlay) y con botón de cierre.
- [ ] Las alertas médicas usan las clases `.alert-warn` o `.alert-danger` correspondientes.
- [ ] Ningún mensaje de UI dice "diagnóstico", "cura" o "garantiza".
- [ ] El disclaimer orientativo aparece en pantallas de recomendaciones.
- [ ] La navegación de vuelta (`prevScreen ?? 'fallback'`) está wired correctamente.
- [ ] Los estados de loading, error y vacío están cubiertos (no crashear con `undefined`).
