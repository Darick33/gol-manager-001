# GolManager — Estado del Proyecto

> Última actualización: 2026-05-18

---

## Backend — Módulos NestJS

| Módulo | Estado | Notas |
|--------|--------|-------|
| `auth` | ✅ Completo | JWT larga duración (8-12h), bcrypt, login endpoint, guards por rol |
| `tournaments` | ✅ Completo | CRUD, generación de fixture Round Robin, cambio de estado, slug |
| `teams` | ✅ Completo | CRUD, colores hex, `logoUrl` acepta URL de Cloudinary |
| `players` | ✅ Completo | CRUD, validación de dorsal único, `photoUrl` acepta URL de Cloudinary |
| `matches` | ✅ Completo | CRUD, programación, cambio de estado, colores por partido, `PATCH /schedule` |
| `match-events` | ✅ Completo | GOL, TARJETA AMARILLA, TARJETA ROJA, SUSTITUCIÓN, FALTA |
| `fines` | ✅ Completo | Generación automática al registrar tarjeta, cálculo por medio tiempo |
| `payments` | ✅ Completo | Subida de comprobante, aprobación/rechazo, `listPending` |
| `pdf` | ✅ Completo | Generación del acta en PDF, fuente Arial TTF embebida (caracteres especiales ✓) |
| `users` | ✅ Completo | CRUD básico (sin UI frontend todavía) |
| `timer` (Socket.io) | ✅ Completo | Cronómetro autoritativo en servidor, namespace `/vocalia`, ticks por segundo |
| `storage` (Cloudinary) | ❌ Pendiente | No hay `StorageModule` backend. Actualmente el upload es directo desde frontend. El PDF del acta se sirve desde memoria, no se persiste en Cloudinary |
| `notifications` (WhatsApp) | ❌ Pendiente | Baileys no integrado. El flujo "cerrar acta → PDF → WhatsApp al delegado" no funciona aún |

---

## Frontend — Páginas Admin

| Página | Estado | Notas |
|--------|--------|-------|
| Login | ✅ Completo | |
| Dashboard | ✅ Completo | Links a torneos, pagos, equipos |
| Listado de torneos | ✅ Completo | Crear torneo, ver estado |
| Detalle de torneo | ✅ Completo | Tabs: Equipos / Fixture / Posiciones |
| — Equipos | ✅ Completo | Crear equipo con logo (Cloudinary), agregar jugadores con foto |
| — Fixture | ✅ Completo | Sub-tabs En Vivo / Hoy / Jornadas, programar fecha, descargar acta |
| — Posiciones | ✅ Completo | Solo Round Robin por ahora |
| Vocalía | ✅ Completo | Tiempo real via Socket.io, diseño Google-style mobile, tabs Partido / Multas / Controles |
| Pagos | ❌ Pendiente | Ruta `/admin/payments` está en `App.tsx` pero **no existe la página**. Los métodos de API (`paymentsApi`) sí existen |
| Gestión de usuarios | ❌ Pendiente | No hay UI para crear vocales ni delegados. Se hace por SQL directo |

---

## Frontend — Portal Público

| Página | Estado | Notas |
|--------|--------|-------|
| Landing (`/`) | ✅ Existe | Landing page estática |
| Portal del torneo (`/torneo/:slug`) | ❌ Pendiente | No existe ninguna ruta pública |
| Tabla de posiciones pública | ❌ Pendiente | |
| Perfil de equipo público | ❌ Pendiente | |

---

## Roles y Acceso

| Rol | Estado | Notas |
|-----|--------|-------|
| SUPER_ADMIN | ✅ Funcional | Tiene acceso a todo el panel admin |
| VOCAL | ✅ Funcional | Accede solo a la vocalía del partido asignado |
| DELEGATE | ❌ Pendiente | No existe ninguna página para el delegado. No puede ver sus multas ni subir comprobantes desde la app |

---

## Características Transversales

| Característica | Estado | Notas |
|----------------|--------|-------|
| Cloudinary — logos y fotos | ✅ Completo | Upload directo desde frontend. Requiere `VITE_CLOUDINARY_CLOUD_NAME` y `VITE_CLOUDINARY_UPLOAD_PRESET` en `.env.local` |
| Cloudinary — comprobantes de pago | ❌ Pendiente | La entidad `payments` tiene `receipt_url` pero no hay UI de upload |
| Cloudinary — PDFs de actas | ❌ Pendiente | El PDF se genera en memoria y se descarga directo. No se sube ni persiste |
| Caracteres especiales en PDF | ✅ Solucionado | Arial TTF embebida en `pdf.service.ts` |
| Descarga del acta desde Fixture | ✅ Completo | Botón "Descargar Acta" en `MatchCard` para partidos finalizados |
| WhatsApp al cerrar acta | ❌ Pendiente | Baileys no integrado |
| WhatsApp al aprobar pago | ❌ Pendiente | |
| Bracket / vista de eliminación | ❌ Pendiente | Fixture de `DIRECT_ELIMINATION` y `GROUPS_ELIMINATION` se genera en backend pero no hay vista en frontend |
| Docker / producción | ❌ Pendiente | No hay `docker-compose.yml`, Nginx config ni scripts de deploy |
| Backup PostgreSQL | ❌ Pendiente | Diferido para Fase 6 (antes del deploy) |

---

## Qué falta por prioridad sugerida

### Alta prioridad (rompe el flujo operativo)
1. **Portal del delegado** — puede ver sus multas, subir comprobante con foto
2. **Página de pagos (admin)** — revisar y aprobar comprobantes
3. **Gestión de usuarios** — crear vocales y delegados desde la app (sin SQL)

### Media prioridad (funcionalidad incompleta)
4. **Cloudinary para PDFs y comprobantes** — backend `StorageModule` + persistencia
5. **WhatsApp (Baileys)** — notificación al cerrar acta y al aprobar pago
6. **Vista de bracket** — eliminación directa y grupos + eliminación

### Baja prioridad (nice to have)
7. **Portal público** — `/torneo/:slug`, tabla, perfil de equipo
8. **Docker / producción** — Fase 6 completa

---

## Stack real (corregido desde ARQUITECTURA.md)

| Capa | Tecnología real |
|------|----------------|
| Frontend | React **19** + Vite + TypeScript + Tailwind **v4** + Framer Motion v12 |
| Backend | NestJS + Fastify + TypeScript + Drizzle ORM |
| PDF | **PDFKit** (no pdfmake como dice ARQUITECTURA.md) |
| DB | PostgreSQL 16 (Docker local) |
| Tiempo Real | Socket.io namespace `/vocalia` |
