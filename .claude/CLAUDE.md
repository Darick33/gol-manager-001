# Project Rules — Gol Manager

## SOLID Review Auto-Trigger (MANDATORY)

When you see `[SOLID-REVIEW-TRIGGER]` in a hook output, you MUST immediately:

1. Spawn the `solid-reviewer` agent using the Agent tool
2. Pass the result to the user
3. If the agent applied fixes, inform the user of the new commit

Do NOT skip this step. Do NOT ask the user if they want the review. Just run it.

## Stack

- Backend: NestJS + Drizzle ORM + PostgreSQL
- Frontend: React + Vite + TypeScript + TanStack Query
- WebSockets: Socket.io via @nestjs/platform-socket.io
- Auth: JWT via Passport + @nestjs/jwt
- Storage: Cloudinary
