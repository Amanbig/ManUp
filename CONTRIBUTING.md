# Contributing to ManUp

Thanks for considering a contribution — bug reports, feature ideas, docs fixes, and pull requests are all welcome.

## Before you start

- For anything beyond a small fix, open an issue first to discuss the approach. It saves rework on both sides.
- Found a security vulnerability? Do **not** open a public issue — see [SECURITY.md](SECURITY.md) instead.
- Check the [Wiki](https://github.com/Amanbig/ManUp/wiki) for deeper guides beyond this README.

## Development setup

ManUp is a two-package repo: `client` (React/Vite) and `server` (Express/TypeScript). See the [Local Development Setup](README.md#-local-development-setup) section of the README for the full walkthrough. Short version:

```bash
cd client && npm install
cd ../server && npm install
```

Create `server/.env` per the README, then run `npm run dev` in both `client/` and `server/` in separate terminals.

## Code style

- **Formatting** is enforced by Prettier: `npm run format` (fix) / `npm run format:check` (verify) — runnable from the repo root for both packages at once, or from `client/`/`server/` individually.
- **Linting** (client only — see note below) is ESLint: `npm run lint` from `client/`.
- Server does not currently run ESLint: `typescript-eslint` doesn't yet support `typescript@7.x`, which the server uses. It still gets Prettier formatting and a `tsc` typecheck. This will be revisited once upstream catches up.
- CI (`.github/workflows/ci.yml`) runs format-check + lint + build on every PR for `client`, and format-check + build for `server`. Make sure these pass locally before pushing.

## Commit messages

This repo follows [Conventional Commits](https://www.conventionalcommits.org/): `type: short description`, e.g. `fix: login error message`, `feat: secrets page improvements`, `chore: rbac management update`. Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `ci`.

## Submitting a pull request

1. Fork the repo and branch off `main`.
2. Keep PRs focused — one logical change per PR is easier to review than a bundle of unrelated fixes.
3. Make sure `npm run format:check` / `npm run lint` / `npm run build` pass in whichever package(s) you touched.
4. Open the PR against `main` with a clear description of what changed and why. Link any related issue.
5. A maintainer will review — expect feedback or requested changes before merge.

## Reporting bugs / requesting features

Use the GitHub issue templates (bug report / feature request) — they ask for the context that's usually needed to act on a report (ManUp version/Docker tag, `DB_TYPE`, steps to reproduce, logs).

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
