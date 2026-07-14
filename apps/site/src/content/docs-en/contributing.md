---
title: Contributing
description: How to contribute to the cloudrift project.
order: 6
---

# Contributing

cloudrift is open source (Apache 2.0) and contributions are welcome.

## Local setup

```bash
git clone https://github.com/elleVas/cloudrift.git
cd cloudrift
pnpm install
```

## Useful commands

```bash
# Build the CLI
pnpm nx build cli

# CLI in watch mode (auto-recompiles)
pnpm nx serve cli

# Run all tests
pnpm nx run-many -t test

# Test a single library
pnpm nx test shared-kernel
pnpm nx test cloud-cost-domain
pnpm nx test cloud-cost-application
pnpm nx test cloud-cost-infrastructure-aws-adapter

# Lint
pnpm nx run-many -t lint

# Type check
pnpm nx run-many -t typecheck
```

## Project structure

See the [Architecture](/docs/architecture) page for details on the monorepo structure and DDD layers.

## Contribution workflow

1. Fork the repo
2. Create a branch for your feature (`git checkout -b feat/my-feature`)
3. Implement changes with tests
4. Verify they pass (`pnpm nx run-many -t test`)
5. Open a Pull Request to `main`

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.)
- **Code style**: ESLint + Prettier, format before committing
- **Tests**: every new scanner must have unit tests with mocked AWS calls
- **TypeScript**: strict mode, no explicit `any`

## Adding a new scanner

Follow the guide on the [Plugin Model](/docs/plugin-model) page for the 6 required steps.

## Reporting bugs or requesting features

Open an [Issue on GitHub](https://github.com/elleVas/cloudrift/issues) with:
- Clear description of the problem or feature
- Steps to reproduce (for bugs)
- Expected output vs actual output

## Debug

Diagnostic logging is opt-in:

```bash
DEBUG=cloudrift:* node apps/cli/dist/main.js analyze
```

Writes to stderr, separate from the report. Warning: the output includes AWS resource IDs from your account — don't share in public issues without checking first.
