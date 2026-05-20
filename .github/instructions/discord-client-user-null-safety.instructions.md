---
description: "Use when creating or modifying Discord commands, events, or embed builders that read context.client.user or client.user. Enforces null-safe access for bot identity fields and avatar URLs."
applyTo: "src/commands/**/*.ts,src/events/**/*.ts,src/services/embedBuilders.ts"
---
# Discord Client User Null Safety

Rule for this codebase:

- Treat context.client.user and client.user as nullable in handlers and event code.
- Always use optional chaining when reading bot identity fields, for example client.user?.tag.
- Always use optional chaining for avatar URLs, for example context.client.user?.displayAvatarURL(...).
- If a downstream helper requires a string URL, pass undefined when the bot user is not ready instead of forcing a non-null assertion.

## Why

Discord client readiness can race with command handling and startup logging. Nullable-safe access prevents avoidable runtime errors and keeps handlers resilient.

## Preferred pattern

- Compute bot metadata once per handler or response block.
- Pass optional values to embed builders and let builders omit icon fields when values are undefined.
