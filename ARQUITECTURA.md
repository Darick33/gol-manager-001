# Plataforma de Gestión Deportiva — Arquitectura y Requerimientos

## 1. Visión General

Aplicación web para gestión integral de torneos de **fútbol** y **fútbol sala**. Cubre inscripción de equipos, generación de fixtures, registro en vivo de partidos (vocalía digital), control de multas y portal público con estadísticas y landings modernas.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| UI / Diseño | Tailwind CSS + Shadcn/ui + Framer Motion |
| Backend | NestJS + Fastify + TypeScript |
| Base de Datos | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Tiempo Real | Socket.io |
| Almacenamiento | Cloudinary (logos, fotos, comprobantes, PDFs) |
| Notificaciones | WhatsApp vía Baileys |
| PDF | pdfmake (generación server-side) |
| Despliegue | Docker + Docker Compose + Nginx (Reverse Proxy + SSL) |

---

## 3. Estructura del Repositorio

```
sports-manager-workspace/
├── backend-nestjs/       # API REST, WebSockets, lógica de negocio
├── frontend-react/       # Panel admin, vocalía y portal público
└── infrastructure/       # docker-compose, Nginx config, scripts de DB
```

---

## 4. Arquitectura del Sistema

### 4.1 Backend — Arquitectura Hexagonal Modular

El backend sigue una arquitectura modularizada inspirada en Hexagonal: la lógica de negocio no depende directamente de la base de datos ni de las rutas HTTP.

```
backend-nestjs/
├── modules/
│   ├── auth/
│   ├── tournaments/
│   ├── teams/
│   ├── players/
│   ├── matches/
│   ├── fines/
│   ├── payments/
│   ├── notifications/    # WhatsApp (Baileys)
│   ├── pdf/              # pdfmake
│   └── storage/          # Adapter Cloudinary
└── shared/
    ├── guards/
    ├── decorators/
    └── pipes/
```

**Principio clave:** Cloudinary está encapsulado detrás de una interfaz `StorageService`. Si en el futuro se migra a S3/R2, solo cambia la implementación — la lógica de negocio no se toca.

### 4.2 Multi-Torneo

El sistema soporta **múltiples torneos activos simultáneamente** (ej: torneo masculino + femenino en paralelo).

- `tournament_id` es filtro obligatorio en **todas** las queries.
- Las rooms de Socket.io se namespácean: `tournament:{id}:match:{id}`.
- El portal público es ruteable por torneo: `midominio.com/torneo/:slug`.

### 4.3 Tiempo Real — Cronómetro Autoritativo

El cronómetro del partido corre en el **servidor**, no en el cliente.

- `MatchTimerService` mantiene un `setInterval` por partido activo.
- El estado del timer se persiste en PostgreSQL para sobrevivir reinicios.
- Socket.io emite un tick por segundo a todos los clientes del room del partido.
- El minuto de goles, tarjetas y cambios es asignado por el servidor — nunca por el cliente.

### 4.4 Formatos de Torneo — Strategy Pattern

Los tres formatos de torneo se implementan con **Strategy Pattern**:

```
TournamentFormat (interfaz)
├── RoundRobinFormat       — todos contra todos
├── GroupsEliminationFormat — fase de grupos + playoffs
└── DirectEliminationFormat — eliminación directa
```

Métodos de la interfaz: `generateFixture()`, `calculateStandings()`, `getNextRound()`.

La tabla `matches` incluye los campos `phase` y `stage` para soportar múltiples fases en un mismo torneo.

### 4.5 Almacenamiento de Archivos

**Cloudinary** para todos los archivos binarios:

| Archivo | Módulo |
|---------|--------|
| Logos de equipos | `teams` |
| Fotos de jugadores | `players` |
| Comprobantes de pago | `payments` |
| PDFs de actas | `matches` |

### 4.6 PDF del Acta — Flujo Automático

Al cerrar un partido, el flujo es:

```
vocal cierra acta
  → MatchService.closeMatch()
  → PdfService.generate(matchId)     # pdfmake
  → StorageService.upload(pdf)       # Cloudinary
  → WhatsappService.send(delegado, pdf)  # Baileys
```

El delegado recibe el PDF del acta directamente en WhatsApp sin pasos manuales.

### 4.7 Notificaciones WhatsApp (Baileys)

- Integrado como `WhatsappService` en NestJS.
- Casos de uso: multa generada, pago aprobado, partido próximo, acta cerrada.
- La sesión de WhatsApp se persiste en un **Docker volume** para no reescanear el QR en cada reinicio.
- **No** se usa para envíos masivos — solo para notificaciones puntuales a los interesados.

---

## 5. Módulos y Funcionalidades

### Módulo 1: Autenticación y Roles (RBAC)

Control de acceso con JWT de **larga duración (8-12 horas)** — sin refresh token.

| Rol | Acceso |
|-----|--------|
| Super Admin | Total: crea torneos, aprueba pagos, edita todo |
| Vocal de Mesa | Solo partidos asignados del día (registro de eventos) |
| Delegado de Equipo | Inscripción de jugadores, estado de cuenta, carga de comprobantes |
| Público | Sin login: portal, tabla de posiciones, resultados |

> **Decisión:** Token de larga duración para que el vocal no pierda sesión en medio de un partido.

### Módulo 2: Gestión de Torneos y Equipos

- Creación de torneos con formato seleccionable (round-robin, grupos+eliminación, eliminación directa).
- Slug automático generado desde el nombre del torneo, editable por el admin.
- Gestión de equipos: logos (Cloudinary), colores.
- Plantillas de jugadores: nombre, dorsal, foto, validación de cupos.
- Generación de fixture manual o automática según el formato elegido.

### Módulo 3: Vocalía Digital (Tiempo Real)

Panel optimizado para tablet/celular:

- **Configuración de colores al iniciar el partido** — el vocal puede ajustar el color de cada equipo para ese encuentro (por defecto toma el color registrado del equipo). Útil cuando un equipo usa chalecos de color distinto al habitual.
- Cronómetro del partido (autoritativo en servidor, mostrado vía Socket.io).
- Registro con un clic:
  - **Gol** — asigna jugador + minuto (del servidor). El botón muestra el color configurado del equipo.
  - **Tarjeta Amarilla / Roja** — asigna jugador + minuto.
  - **Cambio** — jugador sale / jugador entra.
- Cierre de Acta: genera PDF automáticamente y lo envía al delegado por WhatsApp.

### Módulo 4: Sistema Financiero y Multas

- Configuración de precios de multas (Amarilla, Roja, Atraso, etc.).
- Generación automática de deuda al equipo cuando el vocal registra una tarjeta.
- Panel del delegado: sube foto del comprobante de transferencia.
- Flujo de aprobación: Admin revisa y marca la deuda como "Pagada".
- Notificación WhatsApp automática al delegado cuando el pago es aprobado.

### Módulo 5: Portal Público

URL: `midominio.com/torneo/:slug`

- **Home del torneo:** resultados recientes, próximos partidos.
- **Tabla de posiciones:** Bento Grid, actualizada dinámicamente.
- **Landing por equipo:** perfil, racha de victorias, goleadores, estadísticas. Animaciones con Framer Motion.

---

## 6. Diseño de Base de Datos

### Entidades Core

```sql
users
  id, email, password_hash, role (SUPER_ADMIN | VOCAL | DELEGATE | PUBLIC), created_at

tournaments
  id, name, slug (unique),
  sport_type (FOOTBALL | FUTSAL),
  format (ROUND_ROBIN | GROUPS_ELIMINATION | DIRECT_ELIMINATION),
  half_duration_minutes,   -- 45 para fútbol, 20 para fútbol sala (configurable por admin)
  max_roster_size,         -- límite de jugadores por equipo (variable según categoría)
  category, status, created_at

teams
  id, tournament_id, name, logo_url, colors, created_at

players
  id, team_id, name, dorsal, photo_url, created_at

matches
  id, tournament_id, home_team_id, away_team_id,
  phase, stage,
  scheduled_at, status (SCHEDULED | IN_PROGRESS | FINISHED),
  timer_seconds, timer_running,
  current_half,            -- 1 | 2 (el servidor sabe cuándo termina según half_duration_minutes del torneo)
  home_score, away_score,
  home_team_color,         -- color hex override para ese partido (por defecto: color del equipo)
  away_team_color,         -- ídem equipo visitante (útil cuando usan chalecos)
  acta_pdf_url

match_events
  id, match_id, team_id, player_id,
  event_type (GOAL | YELLOW_CARD | RED_CARD | SUBSTITUTION),
  minute, created_at

fines
  id, team_id, tournament_id, match_event_id (nullable),
  amount, reason, status (PENDING | PAID), created_at

payments
  id, fine_id, team_id,
  receipt_url, status (PENDING | APPROVED | REJECTED),
  reviewed_by, reviewed_at, created_at
```

---

## 7. Deportes Soportados

**Fútbol** y **Fútbol Sala**. Los eventos del partido son los mismos para ambos:

```
GOAL | YELLOW_CARD | RED_CARD | SUBSTITUTION
```

Lo que varía por deporte/torneo es **configurable en el torneo**, no hardcodeado:

| Parámetro | Fútbol | Fútbol Sala |
|-----------|--------|-------------|
| `sport_type` | `FOOTBALL` | `FUTSAL` |
| `half_duration_minutes` | 45 (editable) | 20 (editable) |
| `max_roster_size` | variable (admin define) | variable (admin define) |

El `MatchTimerService` lee `half_duration_minutes` del torneo para saber cuándo vence cada tiempo. No hay lógica hardcodeada de duración en el código.

---

## 8. Fases de Desarrollo

| Fase | Contenido |
|------|-----------|
| **Fase 1 — Fundaciones** | Setup workspace (NestJS + React + PostgreSQL + Drizzle). Auth + RBAC. |
| **Fase 2 — Core** | Torneos, equipos, jugadores, fixture (Strategy Pattern). |
| **Fase 3 — Acción** | Panel de vocalía + WebSockets + cronómetro servidor. |
| **Fase 4 — Dinero** | Multas, comprobantes, flujo de aprobación, notificaciones WhatsApp. |
| **Fase 5 — Visual** | Portal público (Bento Grid, Framer Motion, landings por equipo). |
| **Fase 6 — Despliegue** | Dockerización completa + Nginx + SSL. Definición de backup PostgreSQL. |

---

## 9. Decisiones Arquitectónicas Clave

| # | Decisión | Justificación |
|---|----------|---------------|
| 1 | Cloudinary para archivos | CDN incluido, fácil setup, migratable a S3/R2 vía StorageService adapter |
| 2 | Strategy Pattern para formatos de torneo | Agregar nuevos formatos sin tocar lógica existente |
| 3 | Cronómetro autoritativo en servidor | Robustez ante recargas/desconexiones del vocal |
| 4 | Múltiples torneos simultáneos | tournament_id obligatorio en toda la codebase |
| 5 | WhatsApp (Baileys) para notificaciones | Canal real de comunicación en contexto deportivo amateur |
| 6 | JWT de larga duración (8-12h) | Vocal no puede perder sesión en mitad de un partido |
| 7 | PDF generado en servidor (pdfmake) | Flujo automático: cierre de acta → PDF → WhatsApp al delegado |
| 8 | Fútbol + Fútbol Sala con config por torneo | Mismos eventos, distinta duración y tamaño de plantilla — todo configurable en el torneo, nada hardcodeado |
| 9 | Rutas por slug del torneo | Compartible por WhatsApp, sin wildcards en Nginx |
| 10 | Backup diferido | Se configura antes del deploy real en Fase 6 |

---

## 10. Pendientes para Fase 6

- Configurar `pg_dump` automático con cron.
- Definir destino del backup (Cloudinary, S3, o bucket externo).
- Persistencia de sesión Baileys en Docker volume.
- Wildcard SSL o certificados individuales por dominio.
