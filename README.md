# SupleMatch Frontend

Aplicación web mobile-first para recomendación personalizada de suplementos. Construida con React + Vite.

## Stack

- React 18 · Vite · CSS variables
- Sin librerías UI externas (componentes propios)

## Setup

### Requisitos

- Node.js >= 18

### Instalar dependencias

```bash
npm install
```

### Variables de entorno

```bash
cp .env.example .env
```

Configurar la URL del backend:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Si se deja vacío, las llamadas van a `/api/v1/...` (relativo — útil con proxy o mismo origen).

### Correr en desarrollo

```bash
npm run dev
```

La app estará en `http://localhost:5173`.

### Build para producción

```bash
npm run build
```

---

## Flujo de la aplicación

```
Landing → Encuesta → Loading → Condiciones → Recomendaciones → Precios → Feedback
```

| Pantalla | Descripción |
|---|---|
| `Landing` | Presentación de SupleMatch |
| `Encuesta` | 9 preguntas sobre hábitos y síntomas |
| `Loading` | Llama al backend `/api/v1/recommend` y normaliza la respuesta |
| `Condiciones` | Muestra condiciones detectadas con probabilidad real y drivers SHAP |
| `Recomendaciones` | Pack de suplementos con razones, precios y sinergias/alertas del grafo |
| `Precios` | Productos disponibles en farmacias peruanas con RS DIGEMID |
| `Feedback` | Calificación que mejora las recomendaciones futuras |

---

## Explicabilidad en la UI

La pantalla **Condiciones** muestra, para cada condición detectada:

- Barra de probabilidad real (del modelo Random Forest del backend)
- Sección **"¿Por qué?"** con los factores del usuario que más influyeron:
  - Basado en SHAP values si el backend tiene `shap` instalado
  - Basado en reglas de dominio como fallback
  - Badges de impacto: 🔴 Alto · 🟡 Medio · 🟢 Bajo

---

## Conexión con el backend

Toda la comunicación ocurre en `Loading.jsx` al momento del análisis.

Si el backend no está disponible, la app cae al `MOCK_RESULT` con datos de ejemplo para poder navegar el flujo completo en modo demo.

El backend debe estar corriendo en el puerto configurado en `VITE_API_BASE_URL` (por defecto `http://localhost:8000`).

Ver [Suplematch-Backend](../Suplematch-Backend/README.md) para instrucciones de setup del servidor.
