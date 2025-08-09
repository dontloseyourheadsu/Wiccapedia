# Repository Guidelines

## Project Structure & Module Organization
- `frontend/wiccapedia-frontend/`: Angular app (src, assets, configs).
- `backend/wiccapedia-api/`: Rust API (Actix Web + SQLx + S3/MinIO). Entry: `src/main.rs`.
- `backend/docker-compose.yml`: Local Postgres + MinIO for dev.
- `data/`: Gem metadata (`gems-description.json`) and assets.

## Build, Test, and Development Commands
Frontend (run in `frontend/wiccapedia-frontend`):
- `npm start`: Serve Angular app at `http://localhost:4200`.
- `npm run build`: Production build to `dist/`.
- `npm test`: Run Jasmine/Karma unit tests.

Backend (run in `backend/wiccapedia-api`):
- `cargo run`: Start Actix API (requires DB/S3 running).
- `cargo build`: Compile without running.
- `cargo test`: Run Rust unit tests.
Infra (run in `backend/`):
- `docker compose up -d`: Start Postgres and MinIO.

## Coding Style & Naming Conventions
- Rust: format with `cargo fmt`; lint with `cargo clippy` (prefer fixing warnings). Naming: `snake_case` functions/modules, `PascalCase` types, `SCREAMING_SNAKE_CASE` consts.
- Angular/TypeScript: 2-space indent; Prettier config in `package.json`. Naming: components/services `PascalCase` classes, `kebab-case` filenames (e.g., `gem-list.component.ts`), variables/functions `camelCase`.
- Keep functions small and typed; prefer explicit interfaces and DTOs.

## Testing Guidelines
- Frontend: place tests next to sources as `*.spec.ts`; run with `npm test`. Aim to cover components, services, and pipes.
- Backend: add `#[cfg(test)] mod tests { ... }` alongside modules in `src/**`; run with `cargo test`. For DB-dependent tests, ensure `docker compose up` is running and use test schemas.

## Commit & Pull Request Guidelines
- Commits: concise, imperative mood (e.g., "Add gem search filter"); reference issues/PRs (e.g., `#12`). Group related changes.
- PRs: include purpose, key changes, screenshots for UI, steps to test, and linked issues. Keep diffs focused and pass build/tests.

## Security & Configuration Tips
- Do not commit secrets. Use `.env` locally for the API; keep it gitignored. Default DB/MinIO dev creds are in `docker-compose.yml`—do not reuse in production.
