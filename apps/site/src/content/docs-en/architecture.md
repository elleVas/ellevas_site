---
title: Architecture
description: DDD structure with Ports & Adapters of the cloudrift project.
order: 3
---

# Architecture

cloudrift follows a **DDD (Domain-Driven Design)** architecture with the **Ports & Adapters** (Hexagonal Architecture) pattern. Dependencies always point inward, from the CLI through the application layer to the domain.

## Monorepo structure

```
cloudrift/
├── apps/
│   └── cli/                        # CLI entry point (Commander.js)
├── libs/
│   └── cloud-cost/
│       ├── domain/                 # Entities, ports, policies
│       ├── application/            # Use cases (AnalyzeCloudWasteUseCase)
│       └── infrastructure/
│           └── aws-adapter/        # AWS SDK v3 scanner implementation
├── packages/                       # Shared kernel, utilities
├── docs/                           # Technical documentation (EN + IT)
├── policy/                         # Example OPA policies
├── nx.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Layers

### Domain (`libs/cloud-cost/domain`)

Contains pure business logic with no external dependencies:

- **Entities**: `WastedResource` and its specializations for each resource type
- **Ports (interfaces)**: `WasteScannerPort`, `PricingPort`
- **Policies**: waste policies with grace period and exclusion tags (reusable base class)
- **Value Objects**: `ResourceKind` union type (the compiler guides you when adding a new type)

### Application (`libs/cloud-cost/application`)

- **`AnalyzeCloudWasteUseCase`** — the coordinator. Generic over registered scanners: iterates `WasteScannerPort` instances, aggregates results, applies policies.

### Infrastructure (`libs/cloud-cost/infrastructure/aws-adapter`)

- **Scanners**: one `WasteScannerPort` implementation per resource type (EBS, EC2, RDS, etc.)
- Uses AWS SDK v3 for API calls and CloudWatch for activity metrics

### CLI (`apps/cli`)

- Argument parsing with Commander.js
- Formatters: table, JSON, markdown, PDF
- Composition root: registers scanners and instantiates the use case
- Exit codes: 0 (ok), 2 (budget exceeded)

## Why this architecture

- **Testability**: domain doesn't depend on AWS SDK, testable with mocks
- **Extensibility**: new services = new scanners, zero changes to the use case
- **Multi-cloud path**: to support GCP/Azure, just add new adapters implementing `WasteScannerPort`
- **Separation of concerns**: each layer has clear, well-defined responsibilities
