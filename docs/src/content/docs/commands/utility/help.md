---
title: help
description: Show command help with optional category filtering.
---

## Syntax

- Slash command: `/help`
- Optional string option: `category`
- Category values: `trial-lifecycle`, `feedback`, `admin`, `utility`

## Context Menu Availability

- Available: No
- Name: N/A

## Permissions

- Officer-only precondition.
- Runs in guilds only.

## What it does

- Returns an ephemeral help embed grouped by command category.
- Supports filtering to one category with `category`.
- Includes docs and support links in the embed footer.

## Instructions

1. Run `/help` to view all command categories.
2. Run `/help category:utility` to view only utility commands.
3. Use linked docs for deeper command details.

## Example usage

- Slash: `/help`
- Slash: `/help category:feedback`
- Slash: `/help category:admin`

## Expected response

- Ephemeral embed titled `Gatekeeper Help`.
- With no category: sections for trial lifecycle, feedback, admin, and utility.
- With category selected: only the selected command section is shown.

## Common failures

- Command used outside guild.
- Unexpectedly missing command after deploy due stale application-command cache.

## Related

- [`/list`](/commands/utility/list/)
- [`/settings`](/commands/admin/settings/)
- [`/commands/`](/commands/)
