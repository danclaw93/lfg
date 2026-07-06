# AGENTS.md

## Setup And Commands

- Use Bun for this repo. Root commands are `bun install`, `bun run serve`, `bun run agents -- list`, `bun run agents -- run <name>`, `bun run whatsapp -- run`, and `bun run setup`.
- Run the server/CLI typecheck from the repo root with `bunx tsc --noEmit`; there is no root `test` or `lint` script.
- The React/Vite app is a separate package in `web/`: use `cd web && bun install`, `cd web && bun run dev`, `cd web && bun run typecheck`, or `cd web && bun run build`.
- Before PR-sized changes, verify with `bunx tsc --noEmit` and `cd web && bun run build`. `web` build runs `tsc --noEmit && vite build`.
- Local development usually needs `.env` from `.env.example`, `tmux`, `git`, and at least one agent CLI (`claude`, `codex`, `opencode`, or `hermes`) on `PATH`.

## Runtime Shape

- `src/cli.ts` is the executable entrypoint; `bun run serve` runs `src/commands/serve.ts`, which owns the Bun HTTP API and serves the built UI.
- The web app lives under `web/src` and talks to same-origin `/api/*`. In dev, Vite proxies `/api` to `LFG_API_TARGET` or `http://localhost:8766`.
- Vite dev and preview both use port `5174`, bind broadly for tailnet access, and set HMR `clientPort: 443` for `tailscale serve`.
- `src/sessions.ts`, `src/tmux.ts`, and `src/managed.ts` are the core session-control path: discover agent processes, map them to tmux panes, tail transcripts, and send input.
- `src/agents/registry.ts`, `src/agents/runner.ts`, and `src/agents/collectors/` implement markdown-defined insight agents from `agents/*.md` plus private overrides in `data/agents/`.
- Runtime state, private local agents, reports, and settings live under `data/`; do not treat it as source unless the task explicitly targets local runtime state.

## Repo-Specific Gotchas

- Keep the security model intact: the API/UI are unauthenticated and should bind to `127.0.0.1` behind Tailscale, not a public interface.
- Do not commit `.env`, `data/`, `scripts-internal/`, hostnames, paths, tokens, emails, or other personal runtime data.
- In this repo, "deploy" means make current changes visible in the running/dev instance, including rebuilding `web/dist` or restarting the service if needed. Only create tags, GitHub releases, or `lfg-bundle.tar.gz` when the user says "release".
- Release bundles are built with `scripts/release.sh`; without an argument it only builds `dist/lfg-bundle.tar.gz`, with a version argument it publishes via `gh`.
- Source installs update with `git pull --ff-only && bun install && (cd web && bun install && bun run build)`; this command is also encoded in `src/config.ts`.
- If adding an insight collector, update the `InputSpec` union and `KNOWN_INPUT_KINDS` in `src/agents/registry.ts`, then wire the implementation in `src/agents/collectors/index.ts`.
- If adding a tracked insight agent, create `agents/<name>.md` with YAML frontmatter (`name`, optional `title`, `schedule`, `enabled`, `inputs`) and a prompt body. Private/local variants belong in `data/agents/` and can override tracked agents by name.
