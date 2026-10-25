# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`mongopuppet` is an interactive CLI (published to npm, binary `mongopuppet`) with a menu: Backup, Purge, Restore, Settings. Backup and Restore shell out to `mongodump` / `mongorestore`; Purge uses the `mongodb` Node driver. See [README.md](README.md) for user-facing behavior.

## Commands

Package manager is **pnpm**. Node >= 22.13 (the floor set by `@inquirer/*`; `@types/node` is pinned to the 22 major on purpose, so the code can't use APIs newer than the minimum supported Node).

- `pnpm run build`: bundle `src/cli.ts` to `dist/cli.js` with tsup (adds the shebang)
- `pnpm start`: run the built CLI (`node dist/cli.js`). It is interactive and needs a real terminal.
- `pnpm run check`: `biome ci` + `tsc --noEmit`. Run this (and `build`) after every change.
- `pnpm run format`: Biome format + safe lint fixes
- `pnpm run lint` / `pnpm run typecheck`: the two halves of `check`
- `pnpm test`: build, then run all tests with vitest. `pnpm run test:watch` for watch mode.
- Single file: `pnpm exec vitest run src/utils/maskUri.test.ts`; single test: add `-t "hides the password"`. (`src/cli.test.ts` runs `dist/cli.js`, so build first when running it alone.)

## Tests

Vitest, files next to the code as `*.test.ts` (Biome and `tsc` cover them; tsup and the npm package don't include them). `pool: "forks"` in `vitest.config.ts` lets file-system tests `process.chdir()` into a temp folder.

- Nothing needs MongoDB or the Database Tools: `mongodump`/`mongorestore` are replaced by mocking `infra/runner.js`, the driver by mocking `infra/mongo.js` with fake `Db`/client objects, and `conf` by an in-memory class (`infra/config.test.ts`), so tests never touch the real config file.
- `infra/runner.test.ts` spawns the real Node binary as a stand-in tool (checks stderr-only errors).
- `ui/menuPrompt.test.ts` drives the real prompt through `PassThrough` input/output streams (arrow keys as escape codes, output read with `stripVTControlCharacters`).
- `ui/*.test.ts` flow tests mock `./prompts.js` (export a `BACK` symbol from the mock) and script answers with `mockResolvedValueOnce`, in the order the questions are asked.
- Real backup/restore/purge against a server is not covered.

## Architecture

Three layers under `src/`; keep dependencies pointing downward:

- `ui/`: inquirer prompts and console output only. One `run<Feature>()` per menu option (`backup.ts`, `restore.ts`, `purge.ts`, `settings.ts`), wired in `menu.ts`. `setup.ts` is the first-run URI/database questions.
- `core/`: feature logic that takes explicit options and never reads config itself (`backup.ts`, `restore.ts`, `purge.ts`, `tools.ts`, `connection.ts` for the first-run connection check and database list). Argument builders (`buildBackupArgs`, `buildRestoreArgs`) are pure.
- `infra/`: `config.ts` (the `conf` store holding `uri` + `database` and their last-10 histories; change the values only through `setUri` / `setDatabase` so the history stays in sync), `runner.ts` (`execa` wrapper, no shell), `mongo.ts` (`withClient` / `withDb` open and always close a driver connection).
- `utils/maskUri.ts`: hides passwords in any text containing a MongoDB URI.

Flow in `cli.ts` (top-level await): check that `mongodump` and `mongorestore` are on PATH (exit 1 with a message if not), run first-run setup if no config (intro, URI with a connection check, database picked from the server or typed), print the one-line header (`header()` in `ui/output.ts`, printed again after a Settings change), run the menu loop. Everything is wrapped in a try/catch that prints a masked error and exits 1 instead of a stack trace. The config file is created with mode 0600 (it holds passwords).

## Things that are easy to get wrong

- **Passwords:** `mongodump`/`mongorestore` echo the full URI, password included, in their error output. `runner.run()` therefore throws only the tool's stderr (never the command line), and every UI error goes through `maskUri()` before printing. Keep both when adding features. The URI prompt also masks its answer line via the inquirer theme.
- **`requireConfig()` vs `getConfig()`:** `getConfig()` returns possibly-missing values; `requireConfig()` returns both as non-optional and throws if unset. Use it anywhere after setup instead of `!` assertions (Biome forbids them).
- **Prompts** (`ui/prompts.ts`): all go through the shared `prompt()` wrapper, which turns Ctrl+C into a silent `process.exit(0)`. Prompts therefore always return a value; there is no cancelled/undefined path. Menus go through `pick()`, backed by the custom `ui/menuPrompt.ts`: ↑↓ move, Enter selects, and ← goes back when `{ canGoBack: true }` is passed (it returns the `BACK` symbol; the main menu doesn't pass it). Text prompts have no back key because ← moves the cursor there, so Ctrl+C is the way out. An Esc-to-go-back experiment on top of Inquirer's `select` was tried and reverted (laggy, left stray lines), so don't re-add it.
- **Backup layout:** `mongodump --out X` always writes `X/<db>/`. `core/backup.ts` dumps to `<dir>.tmp`, renames `<dir>.tmp/<db>` to `<dir>`, and removes the temp folder (also on failure), so a backup is `backups/<db>/<name>/*.bson`. The name is a `YYYY-MM-DD-HH-mm-ss` timestamp by default or typed by the user (validated by `utils/backupName.ts`; names ending in `.tmp` are reserved, and an existing name is never overwritten). Restore relies on that layout (`mongorestore --db <db> <dir>`) and lists folders from `backups/<db>/` ordered by modified time (custom names can't be sorted alphabetically), ignoring `*.tmp`. `backups/` is relative to the current working directory.
- **Restore modes:** Merge (default) only inserts missing documents; Replace passes `--drop`, which drops only the collections present in the backup. Neither wipes the database. `runner.run()` returns stderr, and `parseRestoreSummary` reads mongorestore's "N document(s) restored successfully. M document(s) failed to restore." line so the UI can report counts.
- **Timestamps are UTC on purpose** (`defaultBackupName` uses `toISOString()`), including the date pre-filled for typed names.
- **Purge** drops every collection except `system.*`; the database stays. It first asks `!! Delete ALL collections in <db>?` as a one-button menu ("Yes, delete everything"; ← cancels), then asks the user to type `delete` to confirm (case-insensitive).

## Conventions

- Biome style (see `biome.json`): no semicolons, double quotes, 2-space indent, 100-column lines, LF endings, sorted imports. `.gitattributes` forces LF.
- Source uses ESM with `.js` extensions in relative imports.
- `.vscode/` is gitignored; Biome is the formatter (set it as the default formatter in the editor, otherwise format-on-save adds semicolons).

## Releasing

`.github/workflows/ci.yml` runs check + tests on pushes and PRs to `main` (Ubuntu and Windows, Node 22 and 24). Pushing a `vX.Y.Z` tag runs `.github/workflows/publish.yml`, which checks, builds, tests and publishes to npm through Trusted Publishing (no token). To release: bump `version` in `package.json`, commit, then `git tag vX.Y.Z` and `git push origin main --tags`. The workflow fails if the tag and `package.json` version differ. Never tag a version that is already on npm (`0.1.0` was published by hand).

## Working agreements

- The project is built one small step at a time: implement, let the user test, then commit.
- Never commit unless asked. Commit messages are short and simple, with **no** Co-Authored-By trailer.
