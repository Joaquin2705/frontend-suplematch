# SupleMatch Frontend

## 1. Tecnologias utilizadas

Tecnologias principales:

- React 19 para construccion de interfaces.
- Vite 8 como servidor de desarrollo y herramienta de build.
- JavaScript y JSX como base de componentes.
- CSS global con variables, estilos propios y componentes visuales reutilizables.
- npm como gestor de paquetes.
- ESLint 10 para validacion de estilo y errores estaticos.
- Playwright para pruebas end-to-end.
- Nginx en Docker para servir el build estatico en despliegue.

## 2. Despliegue

### Opcion A: ejecucion local con Vite

Desde la raiz del repositorio frontend:

```bash
npm install
cp .env.example .env
```

Configurar la URL del backend en `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Si `VITE_API_BASE_URL` queda vacio, la aplicacion usa rutas relativas `/api/v1/...`, util cuando frontend y backend comparten origen o proxy.

Levantar la aplicacion:

```bash
npm run dev
```

Abrir en navegador:

```
http://localhost:5173
```

Validar antes de publicar:

```bash
npm run lint
npm run build
```

Nota: Vite 8 requiere Node 20.19+ o 22.12+. Verificar version activa con `node --version`.

### Opcion B: ejecucion con Docker Compose

Desde la raiz del proyecto general:

```bash
cp -n .env.staging.example .env.staging
docker compose -p proyecto --env-file .env.staging -f infra/docker-compose.staging.yml up -d --build frontend
```

Abrir la aplicacion:

```
http://localhost:18080
```

Validar contenedor y respuesta HTTP:

```bash
docker compose -p proyecto --env-file .env.staging -f infra/docker-compose.staging.yml ps
curl http://localhost:18080/
```
