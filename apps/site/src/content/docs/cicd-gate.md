---
title: CI/CD Gate
description: Come configurare il gate CI/CD che blocca la pipeline se gli sprechi AWS superano il budget.
order: 11
---

# CI/CD Gate

cloudrift è pensato per girare dentro le pipeline CI/CD. Due ingredienti lo rendono CI-friendly:

1. `--format markdown` produce un report pronto per commenti PR / step summary
2. `costAlertThresholdUsd` nel config fa uscire con **codice 2** quando lo spreco supera il budget

## Configurazione

Nel file `cloudrift.config.json` (committato nel repo):

```json
{
  "costAlertThresholdUsd": 500,
  "minAgeDays": 7,
  "ignoreTag": "cloudrift:ignore"
}
```

Se il totale `waste` supera `costAlertThresholdUsd`, il comando esce con codice 2 → la pipeline fallisce. I risparmi di tipo `optimization` non contano mai verso il gate.

## GitHub Actions — come azione riutilizzabile

[`action.yml`](https://github.com/elleVas/cloudrift/blob/main/action.yml) nella root del repo incapsula `npm install -g @cloudrift/cli` + `cloudrift analyze`, pubblica il report markdown nel job summary, e fa fallire il job con gli stessi exit code della CLI (`2` = oltre budget):

```yaml
name: Cloud cost check
on: [pull_request]

permissions:
  contents: read

jobs:
  cloudrift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4 # per cloudrift.config.json, letto dalla cwd

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - uses: elleVas/cloudrift@v0.5.1
        with:
          regions: us-east-1 eu-west-1
          config: cloudrift.config.json
```

Con un `cloudrift.config.json` committato (`{"costAlertThresholdUsd": 500}`), l'azione fa fallire il check automaticamente quando lo spreco supera il budget. Vedi `action.yml` per tutti gli input (`live-pricing`, `scanners`, `min-age-days`, `ignore-tag`, `pdf`, `json`, `format`, `version`, …) e gli output `report`/`exit-code`.

## GitHub Actions — compilando dai sorgenti

Alternativa se preferisci puntare a un commit non ancora rilasciato invece che a una versione pubblicata:

```yaml
name: Cloud cost check
on: [pull_request]

permissions:
  contents: read

jobs:
  cloudrift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: elleVas/cloudrift
          path: cloudrift-cli

      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          cache-dependency-path: cloudrift-cli/pnpm-lock.yaml

      - run: pnpm install --frozen-lockfile
        working-directory: cloudrift-cli
      - run: pnpm nx build cli
        working-directory: cloudrift-cli

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      # Pubblica il report nel step summary; esce 2 se over budget
      - run: node cloudrift-cli/apps/cli/dist/main.js analyze -r us-east-1 eu-west-1 --format markdown >> "$GITHUB_STEP_SUMMARY"
```

## Exit codes

| Code | Significato |
|------|-------------|
| 0 | Scansione completata, spreco sotto soglia (o nessuna soglia configurata) |
| 2 | Spreco totale supera `costAlertThresholdUsd` — pipeline bloccata |

## Note

- In CI (o quando stdout non è un TTY), il picker interattivo non appare: tutti gli scanner vengono eseguiti automaticamente
- `cloudrift.config.json` viene letto dalla working directory corrente — committalo nel repo per condividerlo col team
