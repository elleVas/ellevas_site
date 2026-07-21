---
title: Testing
description: Test pyramid — unit, contract, LocalStack e2e, manual AWS verification.
order: 10
---

# Testing

cloudrift uses a multi-level test pyramid to balance speed, confidence and cost.

## The pyramid

```
        ┌─────────────────────────┐
        │   CLI e2e (apps/cli)    │   command-level: format, exit code, artifacts
        ├─────────────────────────┤
        │ Infra (contract tests)  │   real response fixtures replayed: shape → findings
        ├─────────────────────────┤
        │  Infra (scanner specs)  │   AWS SDK mocked: query shape, pagination, errors
        ├─────────────────────────┤
        │  Domain (entity/policy) │   pure logic: waste rules, boundaries, no I/O
        └─────────────────────────┘
        ┌─────────────────────────┐
        │  LocalStack e2e (free)  │   scripts/e2e-localstack.mjs, 17/38 scanners
        ├─────────────────────────┤
        │  Manual AWS sandbox     │   scripts/verify-against-aws.mjs
        └─────────────────────────┘
```

## Running tests

```bash
# All unit tests
pnpm nx run-many -t test

# Single library
pnpm nx test shared-kernel
pnpm nx test cloud-cost-domain
pnpm nx test cloud-cost-application
pnpm nx test cloud-cost-infrastructure-aws-adapter

# Lint
pnpm nx run-many -t lint

# Type check
pnpm nx run-many -t typecheck
```

## Level 1 — Domain (entities and policies)

Pure unit tests, no mocks, no I/O. One spec per entity, plus policy tests covering:

- Waste vs not-waste
- Grace period (exact boundary: age `===` `minAgeDays`)
- Ignore tag
- `excludeTagValues`
- Threshold boundaries (CPU `===` threshold, ops `===` `maxOps`)

These run in milliseconds and catch logic regressions instantly.

## Level 2 — Infrastructure (scanner specs)

One spec per scanner, with the AWS SDK client mocked. Each covers:

- The candidate filter (e.g. `DescribeVolumes` with `Filters=[status=available]`)
- Pagination
- Concurrency
- SDK error handling
- Client `destroy()` call
- Exact CloudWatch parameters (`Namespace`, `Period`, `Statistics`, `Dimensions`) for CW-based scanners

## Level 3 — Infrastructure (contract tests)

Scanner specs build minimal payloads by hand; they can't prove the shape matches real AWS responses. `scanner-contract.spec.ts` replays full captured AWS response fixtures (from `src/testing/contract-fixtures/`) through the entire scanner pipeline — list → type-narrowing → metric → entity → policy — and asserts the same findings come out.

All 38 scanners have contract fixtures. A coverage test fails if a `ResourceKind` ships without one.

## Level 4 — CLI e2e

`analyze-waste.command.spec.ts` drives the command with a fake `AnalyzeDeps` (no AWS), testing:

- Format selection (table/json/markdown)
- Exit codes (0/1/2)
- `--json <file>` and `--pdf <file>` artifacts
- Partial scan handling (scan errors don't crash the command)

## LocalStack e2e harness

Runs the built CLI binary against a real (containerized) AWS-compatible API. No real AWS credentials needed.

**Scope:** 17 of 38 scanners (the others require services LocalStack Community doesn't support).

### Setup

```bash
# One-time: register at app.localstack.cloud and get your Auth Token
export LOCALSTACK_AUTH_TOKEN=<your-token>

# Build the CLI
pnpm nx run cli:build

# Run the e2e harness
pnpm nx run cli:e2e-localstack
```

Requires Docker. The harness:
1. Starts a LocalStack container (`docker-compose.localstack.yml`)
2. Seeds one wasted resource per kind (`scripts/seed-localstack.mjs`)
3. Runs `cloudrift analyze` against it
4. Asserts every expected kind produced a finding
5. Tears down the container (even on failure)

### Manual inspection against LocalStack

To actually look at a table or PDF against seeded data:

```bash
# Start LocalStack
export LOCALSTACK_AUTH_TOKEN=<your-token>
docker compose -f docker-compose.localstack.yml up -d --wait

# Point SDK at LocalStack
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Seed resources
node scripts/seed-localstack.mjs

# Inspect as table
node apps/cli/dist/main.js analyze --regions us-east-1 --min-age-days 0 --format table --all-services

# Or as PDF
node apps/cli/dist/main.js analyze --regions us-east-1 --min-age-days 0 --pdf --all-services

# Tear down when done
docker compose -f docker-compose.localstack.yml down -v
```

## Manual AWS sandbox verification

`scripts/verify-against-aws.mjs` runs scanners against a real AWS account. **Not run by CI** — it must be run by hand against a sandbox account.

```bash
pnpm nx run-many -t build
CLOUDRIFT_VERIFY_AWS_SANDBOX=1 pnpm verify:aws -- --region us-east-1
```

The script refuses to run without:
- `CLOUDRIFT_VERIFY_AWS_SANDBOX=1` (safety check against production)
- Resolvable AWS credentials (verified via STS)

For each scanner it prints: kind, finding count, total estimated monthly cost, first 5 findings, and any error.

## Debug logging

```bash
DEBUG=cloudrift:* node apps/cli/dist/main.js analyze
```

Writes to stderr. Warning: output includes AWS resource IDs — don't share in public issues without checking.
