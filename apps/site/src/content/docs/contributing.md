---
title: Contributing
description: Come contribuire al progetto cloudrift.
order: 6
---

# Contributing

cloudrift è open source (Apache 2.0) e le contribuzioni sono benvenute.

## Setup locale

```bash
git clone https://github.com/elleVas/cloudrift.git
cd cloudrift
pnpm install
```

## Comandi utili

```bash
# Build della CLI
pnpm nx build cli

# CLI in watch mode (ricompila automaticamente)
pnpm nx serve cli

# Esegui tutti i test
pnpm nx run-many -t test

# Test di una singola libreria
pnpm nx test shared-kernel
pnpm nx test cloud-cost-domain
pnpm nx test cloud-cost-application
pnpm nx test cloud-cost-infrastructure-aws-adapter

# Lint
pnpm nx run-many -t lint

# Type check
pnpm nx run-many -t typecheck
```

## Struttura del progetto

Vedi la pagina [Architettura](/it/docs/architecture) per i dettagli sulla struttura del monorepo e i layer DDD.

## Workflow di contribuzione

1. Fai fork del repo
2. Crea un branch per la tua feature (`git checkout -b feat/my-feature`)
3. Implementa le modifiche con test
4. Verifica che passino (`pnpm nx run-many -t test`)
5. Apri una Pull Request verso `main`

## Convenzioni

- **Commit**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, ecc.)
- **Code style**: ESLint + Prettier, formatta prima di committare
- **Test**: ogni nuovo scanner deve avere test unitari con mock delle chiamate AWS
- **TypeScript**: strict mode, niente `any` espliciti

## Aggiungere un nuovo scanner

Segui la guida nella pagina [Plugin Model](/it/docs/plugin-model) per i 6 step necessari.

## Segnalare bug o richiedere feature

Apri una [Issue su GitHub](https://github.com/elleVas/cloudrift/issues) con:
- Descrizione chiara del problema o della feature
- Steps per riprodurre (per i bug)
- Output atteso vs output reale

## Debug

Il logging diagnostico è opt-in:

```bash
DEBUG=cloudrift:* node apps/cli/dist/main.js analyze
```

Scrive su stderr, separato dal report. Attenzione: l'output include ID di risorse AWS del tuo account — non condividere in issue pubbliche senza controllare.
