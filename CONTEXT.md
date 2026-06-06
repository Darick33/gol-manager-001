# Gol Manager — Domain Context

## Propósito

Plataforma SaaS multi-liga de gestión de ligas de fútbol y futsal. Permite administrar torneos, partidos en vivo, multas, pagos y estadísticas. Cada Liga opera en su propio subdominio bajo un DNS wildcard (`*.golmanager.com`).

---

## Entidades del dominio

### Plataforma
Nivel meta por encima de todas las Ligas. Gestionada exclusivamente por el PLATFORM_ADMIN desde el dominio principal (`app.golmanager.com` o equivalente). La Plataforma permite crear, activar y desactivar Ligas, y acceder a cualquier Liga como operador.

### Liga
Unidad organizacional y boundary de tenant. Cada Liga tiene su propio subdominio (`ligabogota.golmanager.com`) generado automáticamente vía DNS wildcard, su propio LIGA_ADMIN, y no comparte datos con otras Ligas. Una Liga puede estar activa o inactiva. Una Liga puede tener múltiples Torneos a lo largo del tiempo.

### Torneo
Competición dentro de una Liga. Tiene un formato (Round Robin, Grupos + Eliminación, Eliminación Directa), un deporte (Fútbol / Futsal), y configuración de fees (cancha, árbitro) y multas (tarjeta amarilla, roja, llegada tarde). Un Torneo tiene Equipos inscritos y genera Partidos.

### Equipo
Conjunto de Jugadores que participa en un Torneo. Pertenece a una Liga. Tiene un Delegado asignado. Tiene balance financiero por Torneo.

### Jugador
Persona registrada en el roster de un Equipo. Tiene dorsal, foto. Acumula tarjetas a través de los Partidos.

### Partido
Enfrentamiento entre dos Equipos dentro de un Torneo. Tiene estado (SCHEDULED, IN_PROGRESS, FINISHED). Genera Eventos, Multas y Pagos. Al cerrar genera un Acta en PDF.

### Evento
Acción registrada durante un Partido en vivo: GOL, TARJETA_AMARILLA, TARJETA_ROJA, SUSTITUCIÓN, FOUL. Fuente de verdad para marcador y multas automáticas.

### Multa
Deuda generada automáticamente por un Evento (tarjeta) o manualmente (llegada tarde, otros). Pertenece a un Equipo en un Partido dentro de un Torneo. Estado: PENDING | PAID.

### Pago
Registro de cobro a un Equipo por un Partido (cancha + árbitro + multas). Tiene comprobante (foto transferencia) y flujo de aprobación. Estado: PENDING | APPROVED | REJECTED.

### Acta
PDF generado al cierre de un Partido con resumen de eventos, multas y pagos. Se envía automáticamente por WhatsApp al Delegado del equipo local.

### Jornada (Round)
Agrupación de Partidos por etapa dentro de un Torneo. Se puede cerrar para congelar pagos y calcular standings parciales.

### Vocal
Usuario que opera el sistema durante un Partido en vivo. Registra eventos en tiempo real vía WebSocket.

### Delegado
Representante de un Equipo. Recibe notificaciones por WhatsApp, sube comprobantes de pago, gestiona el roster.

---

## Roles

| Rol | Scope | Capacidades |
|---|---|---|
| PLATFORM_ADMIN | Plataforma completa | Crear/gestionar Ligas, activar/desactivar Ligas, operar dentro de cualquier Liga con Contexto Activo |
| LIGA_ADMIN | Una Liga | Crear torneos, equipos, gestionar usuarios (vocales y delegados) de su liga, ver todos los datos de su liga |
| VOCAL | Un Partido | Operar partidos en vivo |
| DELEGATE | Un Equipo | Ver deudas, subir pagos, gestionar roster |

> **Nota de código:** el enum en DB usa `SUPER_ADMIN` como valor heredado de `LIGA_ADMIN`. Pendiente renombrar en una migración futura.

---

## Contexto Activo de Liga

Cuando el PLATFORM_ADMIN "entra" a una Liga para operar, se establece un **Contexto Activo**. Esto implica:
- El backend emite un **Handshake Token** de corta duración (5 min, un solo uso) que contiene `leagueId` + `role: PLATFORM_ADMIN`.
- El frontend abre el subdominio de esa Liga en una nueva pestaña con el Handshake Token en la URL.
- El subdominio intercambia el Handshake Token por una sesión real y envía `X-Active-League-Id` en cada request.
- El TenantGuard acepta este header para PLATFORM_ADMIN y lo usa como filtro de tenant.
- Una Liga inactiva bloquea el acceso de sus usuarios al subdominio.

---

## Terminología canónica

- **Liga** — tenant. No usar "organización", "club", "campeonato".
- **Torneo** — competición dentro de una Liga. No usar "liga" para esto.
- **Partido** — enfrentamiento. No usar "match" en UI (sí en código).
- **Acta** — documento de cierre de partido. No usar "reporte" ni "resumen".
- **Jornada** — grupo de partidos por etapa. No usar "fecha" ni "round" en UI.
- **Vocal** — operador del partido en vivo. No usar "referee" ni "árbitro".
- **Delegado** — representante del equipo. No usar "manager" ni "coach".
- **Multa** — deuda generada por evento. No usar "sanción" ni "cobro".
- **Balance** — saldo financiero del equipo. Puede ser negativo (deuda).

---

- **Plataforma** — nivel meta por encima de todas las Ligas. No usar "sistema", "panel central", "master".
- **Contexto Activo** — sesión del PLATFORM_ADMIN operando dentro de una Liga específica. No usar "impersonación" ni "modo admin".
- **Handshake Token** — token de corta duración para establecer un Contexto Activo cross-subdominio. No usar "magic link".
- **LIGA_ADMIN** — administrador de una Liga. No usar "Super Admin", "league admin", ni "super_admin" en UI. (Valor en DB: `SUPER_ADMIN` — pendiente migración.)

---

## Invariantes del dominio

- Un Jugador no puede tener dos dorsales iguales en el mismo Equipo.
- Una Multa de tarjeta solo se crea si el Torneo tiene fee > 0 para ese tipo.
- Dos tarjetas amarillas al mismo Jugador en el mismo Partido generan expulsión automática.
- Un Partido no puede cerrarse sin estar EN_CURSO.
- Los datos de una Liga son invisibles para usuarios de otra Liga.
- Una Liga inactiva no permite login ni acceso al subdominio a sus usuarios.
- El Handshake Token expira en 5 minutos y es de un solo uso.
- El PLATFORM_ADMIN siempre opera en una Liga bajo Contexto Activo — nunca con `leagueId: null` en operaciones de escritura.
