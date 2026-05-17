---
description: "Use when creating or modifying Discord commands, modal handlers, or trial workflow logic in this project. Enforces thin handlers, service-layer business logic, and guild-scoped Prisma queries."
applyTo: "src/commands/**/*.ts,src/events/**/*.ts,src/services/**/*.ts"
---
# Discord Command Architecture

Hard rules for this codebase:

- Keep command and event handlers thin.
- Put business logic in service modules under src/services.
- Keep Prisma access in services when logic is non-trivial.
- Scope trial and feedback reads/writes by guildId for multi-guild safety, mandatory now.
- Use typed interfaces for commands and events; avoid any in runtime wiring.
- Keep user-facing error responses consistent and ephemeral for configuration and validation failures.

## Handler rules

- Handlers may parse Discord input, call one service method, and reply.
- Handlers must not contain multi-step domain workflows directly.
- Handlers must not duplicate guild settings lookup logic across files.

## Data access rules

- Queries for Trial and Feedback must include guild context in every query path.
- Do not query by userId alone for trial lifecycle operations.
- Do not write feedback unless it is linked to a concrete trial context.

## Service rules

- Services own validation and workflow sequencing.
- Services should return domain outcomes that handlers map to replies.
- Service functions should accept explicit dependencies (for example Prisma client) rather than importing hidden globals.

## Suggested pattern

- Command/Event -> Service -> Prisma
- Reply mapping stays in Command/Event
- Domain state transitions stay in Service
