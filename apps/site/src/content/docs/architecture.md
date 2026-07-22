---
title: Architettura
description: Struttura DDD con Ports & Adapters del progetto cloudrift.
order: 11
---

# Architettura

cloudrift segue un'architettura **DDD (Domain-Driven Design)** con il pattern **Ports & Adapters** (Hexagonal Architecture). Le dipendenze puntano sempre verso l'interno, dalla CLI attraverso il layer applicativo fino al domain.

## Struttura del monorepo

```
cloudrift/
├── apps/
│   └── cli/                        # Entry point CLI (Commander.js)
├── libs/
│   └── cloud-cost/
│       ├── domain/                 # Entità, ports, policies
│       ├── application/            # Use cases (AnalyzeCloudWasteUseCase)
│       └── infrastructure/
│           └── aws-adapter/        # Implementazione scanner AWS SDK v3
├── packages/                       # Shared kernel, utilities
├── docs/                           # Documentazione tecnica (EN + IT)
├── policy/                         # Policy OPA di esempio
├── nx.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Layer

### Domain (`libs/cloud-cost/domain`)

Contiene la logica di business pura, senza dipendenze esterne:

- **Entità**: `WastedResource` e le sue specializzazioni per ogni tipo di risorsa
- **Ports (interfacce)**: `WasteScannerPort`, `PricingPort`
- **Policies**: waste policies con grace period e tag di esclusione (base class riusabile)
- **Value Objects**: `ResourceKind` union type (il compilatore guida quando aggiungi un nuovo tipo)

### Application (`libs/cloud-cost/application`)

- **`AnalyzeCloudWasteUseCase`** — il coordinatore. Generico sugli scanner registrati: itera i `WasteScannerPort`, aggrega i risultati, applica le policy.

### Infrastructure (`libs/cloud-cost/infrastructure/aws-adapter`)

- **Scanner**: un'implementazione di `WasteScannerPort` per ogni tipo di risorsa (EBS, EC2, RDS, ecc.)
- Usa AWS SDK v3 per le chiamate API e CloudWatch per le metriche di attività

### CLI (`apps/cli`)

- Parsing argomenti con Commander.js
- Formatters: table, JSON, markdown, PDF
- Composition root: registra gli scanner e istanzia il use case
- Exit codes: 0 (ok), 2 (budget superato)

## Perché questa architettura

- **Testabilità**: il domain non dipende da AWS SDK, si testa con mock
- **Estensibilità**: nuovi servizi = nuovi scanner, zero modifiche al use case
- **Multi-cloud path**: per supportare GCP/Azure, basta aggiungere nuovi adapter che implementano `WasteScannerPort`
- **Separation of concerns**: ogni layer ha responsabilità chiare e ben definite
