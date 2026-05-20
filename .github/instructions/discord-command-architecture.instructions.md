---
description: "Use when creating or modifying Discord commands, modal handlers, or trial workflow logic in this project. Handlers delegate workflows to services, and Trial/Feedback reads and writes must remain guild-scoped."
applyTo: "src/commands/**/*.ts,src/events/**/*.ts,src/services/**/*.ts"
---
# Discord Command Architecture

Hard rules for this codebase:

- Handlers should contain no more than one service call and no direct business logic.
- Put multi-step domain workflows and business logic in service modules under src/services.
- Keep Prisma access in services when logic is non-trivial.
- Scope trial and feedback reads/writes by guildId for multi-guild safety, mandatory now.
- Use typed interfaces for commands and events; avoid any in runtime wiring.
- Error responses for configuration and validation failures must be ephemeral and use the same message format, tone, and structure across handlers.
- Priority: handlers and events delegate multi-step workflows to services; data access rules apply to every Trial and Feedback query path.

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
