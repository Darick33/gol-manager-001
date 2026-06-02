# ADR-0001: Liga como unidad de tenant con subdominio propio

**Status:** Accepted  
**Date:** 2026-06-01

## Context

El sistema nació como single-tenant (una sola liga). La entidad raíz es `Tournament` y no existe una entidad "Liga". A medida que el producto madura, se necesita ofrecer el sistema a múltiples ligas independientes sin que compartan datos.

Alternativas consideradas:
- Multi-instancia: deployar una copia del backend por liga (operacionalmente inviable a escala).
- Path-based routing: `/ligas/bogota` (viable pero menos premium).
- Subdominio por liga: `ligabogota.golmanager.com` (requiere wildcard SSL y DNS dinámico).

## Decision

1. **Liga es el tenant boundary.** Se agrega la entidad `leagues` al schema. Todos los `tournaments` pertenecen a una Liga. Todas las queries filtran por `leagueId` del usuario autenticado.

2. **Subdominio por liga.** Cada Liga tiene un `slug` único que se resuelve como subdominio. Se requiere wildcard SSL (`*.golmanager.com`) y lógica de routing por host en el frontend.

3. **Roles re-scopeados.** `SUPER_ADMIN` pasa a llamarse `LIGA_ADMIN` en el dominio (el código puede conservar el enum por compatibilidad). Se agrega `PLATFORM_ADMIN` como rol de plataforma, fuera del scope de cualquier liga.

4. **Migración de datos existentes.** Al hacer el deploy, se crea automáticamente una Liga "piloto" y todos los torneos, equipos y usuarios existentes se asignan a ella. Sin pérdida de datos.

## Consequences

- **Positivo:** Cada liga es un producto independiente. Seguridad de datos garantizada por `leagueId` en todas las queries.
- **Positivo:** La experiencia de cada liga se siente como su propio producto (subdominio propio).
- **Negativo:** Requiere wildcard SSL y configuración de DNS dinámico en producción.
- **Negativo:** Todas las queries existentes necesitan agregar el filtro de `leagueId` — cambio de schema invasivo.
- **Deuda técnica aceptada:** El código conserva el enum `SUPER_ADMIN` internamente por compatibilidad; el dominio usa `LIGA_ADMIN`.
