# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`mongopuppet` is an interactive CLI (published to npm, binary `mongopuppet`) with a menu: Backup, Purge, Restore, Settings. Backup and Restore shell out to `mongodump` / `mongorestore`; Purge uses the `mongodb` Node driver. See [README.md](README.md) for user-facing behavior.

## Commands

Package manager is **pnpm**. Node >= 22 (`@types/node` is pinned to the 22 major on purpose, so the code can't use APIs newer than the minimum supported Node).

- `pnpm run build`: bundle `src/cli.ts` to `dist/cli.js` with tsup (adds the shebang)
- `pnpm start`: run the built CLI (`node dist/cli.js`). It is interactive and needs a real terminal.
- `pnpm run check`: `biome ci` + `tsc --noEmit`. Run this (and `build`) after every change.
- `pnpm run format`: Biome format + safe lint fixes
- `pnpm run lint` / `pnpm run typecheck`: the two halves of `check`

There is no test suite yet.

## Architecture

Three layers under `src/`; keep dependencies pointing downward:

- `ui/`: inquirer prompts and console output only. One `run<Feature>()` per menu option (`backup.ts`, `restore.ts`, `purge.ts`, `settings.ts`), wired in `menu.ts`. `setup.ts` is the first-run URI/database questions.
- `core/`: feature logic that takes explicit options and never reads config itself (`backup.ts`, `restore.ts`, `purge.ts`, `tools.ts`). Argument builders (`buildBackupArgs`, `buildRestoreArgs`) are pure.
- `infra/`: `config.ts` (the `conf` store holding `uri` + `database`), `runner.ts` (`execa` wrapper, no shell), `mongo.ts` (`withDb` opens and always closes a driver connection).
- `utils/maskUri.ts`: hides passwords in any text containing a MongoDB URI.

Flow in `cli.ts` (top-level await): check that `mongodump` and `mongorestore` are on PATH (exit 1 with a message if not), run first-run setup if no config, print a one-line header, run the menu loop.

## Things that are easy to get wrong

- **Passwords:** `mongodump`/`mongorestore` echo the full URI, password included, in their error output. `runner.run()` therefore throws only the tool's stderr (never the command line), and every UI error goes through `maskUri()` before printing. Keep both when adding features. The URI prompt also masks its answer line via the inquirer theme.
- **`requireConfig()` vs `getConfig()`:** `getConfig()` returns possibly-missing values; `requireConfig()` returns both as non-optional and throws if unset. Use it anywhere after setup instead of `!` assertions (Biome forbids them).
- **Prompts** (`ui/prompts.ts`): all go through the shared `prompt()` wrapper, which turns Ctrl+C into "Bye!" + `process.exit(0)`. Prompts therefore always return a value; there is no cancelled/undefined path. Going back is done with explicit "Back" menu entries. An Esc-to-go-back experiment was tried and reverted (laggy, left stray lines), so don't re-add it.
- **Backup layout:** `mongodump --out X` always writes `X/<db>/`. `core/backup.ts` dumps to `<dir>.tmp`, renames `<dir>.tmp/<db>` to `<dir>`, and removes the temp folder (also on failure), so a backup is `backups/<db>/<YYYY-MM-DD-HH-mm-ss>/*.bson`. Restore relies on that layout (`mongorestore --db <db> <dir>`) and lists folders from `backups/<db>/`, ignoring `*.tmp`. `backups/` is relative to the current working directory.
- **Restore modes:** Merge (default) only inserts missing documents; Replace passes `--drop`, which drops only the collections present in the backup. Neither wipes the database.
- **Purge** drops every collection except `system.*`; the database stays. It asks the user to type the database name first.

## Conventions

- Biome style (see `biome.json`): no semicolons, double quotes, 2-space indent, 100-column lines, LF endings, sorted imports. `.gitattributes` forces LF.
- Source uses ESM with `.js` extensions in relative imports.
- `.vscode/` is gitignored; Biome is the formatter (set it as the default formatter in the editor, otherwise format-on-save adds semicolons).

## Working agreements

- The project is built one small step at a time: implement, let the user test, then commit.
- Never commit unless asked. Commit messages are short and simple, with **no** Co-Authored-By trailer.
