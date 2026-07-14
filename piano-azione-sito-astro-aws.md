# Piano d'Azione — Monorepo Nx + Astro 7 + AWS CDK + GitHub Actions + Bun

> **Dominio**: `ellevas.dev` (acquistato su Route53)
> **Runtime/PM**: Bun (package manager + script runner; CDK usa Node internamente, trasparente)
> **Obiettivo**: monorepo Nx contenente il sito Astro 7 (portfolio + docs cloudrift) e l'infrastruttura AWS (CDK),
> con deploy automatico via GitHub Actions su S3 + CloudFront + Route53 + ACM.
> **Repo GitHub**: `ellevas` (github.com/elleVas)
>
> Questo file è pensato per essere eseguito passo-passo.
> Ogni fase ha: obiettivo, comandi, file da creare, criterio di completamento.

---

## Fase 0 — Prerequisiti account AWS + Dominio (manuale, una tantum)

### 0.1 Account AWS

1. Crea account AWS (se non esiste) e attiva **MFA** sull'utente root.
2. Region principale: `eu-south-1` (Milano) per le risorse normali.
   ⚠️ Il certificato ACM per CloudFront **deve** stare in `us-east-1`.
3. Crea un **OIDC Identity Provider** per GitHub Actions su IAM:
   - IAM → Identity providers → Add provider
   - Provider type: OpenID Connect
   - URL provider: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

### 0.2 Acquisto dominio su Route53

1. Route53 → Registered domains → Register domain → `ellevas.dev`
2. Costo: ~$12/anno per `.dev` (rinnovo automatico).
3. Route53 crea automaticamente la Hosted Zone — nessun cambio NS necessario.

### 0.3 Installare Bun (se non già presente)

```bash
curl -fsSL https://bun.sh/install | bash
```

Verifica: `bun --version`

✅ **Completato quando**: hai un account AWS con MFA, il dominio `ellevas.dev` è registrato
su Route53, la Hosted Zone esiste, l'OIDC provider GitHub è visibile in IAM, e Bun è installato.

---

## Fase 1 — Setup Nx Workspace + Astro + CDK

### 1.1 Scaffold monorepo

```bash
bunx create-nx-workspace@latest ellevas-site --preset=apps --nxCloud=skip --pm=bun
cd ellevas-site
```

Struttura target:

```
ellevas-site/
├── apps/
│   ├── site/          # Astro 7 (portfolio + docs cloudrift)
│   └── infra/         # AWS CDK
├── libs/
├── nx.json
├── package.json       # packageManager: "bun"
├── bun.lock
└── .github/workflows/
```

### 1.2 App Astro

```bash
cd apps
bun create astro site -- --template minimal --no-install --no-git
cd site && bun install
```

Integrazioni da installare:
```bash
bunx astro add tailwind
bunx astro add sitemap
```

`apps/site/project.json`:

```jsonc
{
  "name": "site",
  "root": "apps/site",
  "targets": {
    "dev":     { "executor": "nx:run-commands", "options": { "command": "astro dev",     "cwd": "apps/site" } },
    "build":   { "executor": "nx:run-commands", "options": { "command": "astro build",   "cwd": "apps/site" } },
    "preview": { "executor": "nx:run-commands", "options": { "command": "astro preview", "cwd": "apps/site" } }
  }
}
```

### 1.3 App CDK

```bash
cd ../infra
bunx cdk init app --language typescript
```

`apps/infra/project.json`:

```jsonc
{
  "name": "infra",
  "root": "apps/infra",
  "targets": {
    "synth":  { "executor": "nx:run-commands", "options": { "command": "cdk synth",  "cwd": "apps/infra" } },
    "diff":   { "executor": "nx:run-commands", "options": { "command": "cdk diff",   "cwd": "apps/infra" } },
    "deploy": { "executor": "nx:run-commands", "options": { "command": "cdk deploy --all --require-approval never", "cwd": "apps/infra" } }
  }
}
```

### 1.4 CDK Bootstrap

Prima di qualunque deploy CDK (serve Node installato, CDK lo usa internamente):

```bash
bunx cdk bootstrap aws://<ACCOUNT_ID>/eu-south-1
bunx cdk bootstrap aws://<ACCOUNT_ID>/us-east-1
```

✅ **Completato quando**: `bun run nx build site` genera `apps/site/dist/` e `bun run nx run infra:synth` funziona.

---

## Fase 2 — Design System + Struttura Pagine + Contenuti

### 2.1 Palette e Font

**Tema**: Dark minimal, ispirazione Apple/Vercel. No light mode.

| Token | Valore | Uso |
|-------|--------|-----|
| `--bg-primary` | `#0A0A0B` | Sfondo principale |
| `--bg-card` | `#161617` | Card, sezioni elevate, sidebar docs |
| `--bg-subtle` | `#1C1C1E` | Hover, input, code block bg |
| `--border` | `rgba(255,255,255,0.08)` | Bordi default |
| `--border-hover` | `rgba(255,255,255,0.15)` | Bordi hover |
| `--text-primary` | `#F5F5F7` | Titoli, testo principale |
| `--text-secondary` | `#A1A1A6` | Paragrafi, descrizioni |
| `--text-muted` | `#6E6E73` | Caption, label disattivate |
| `--accent` | `#60A5FA` | Link, CTA, elementi interattivi (blue-400) |
| `--accent-hover` | `#93C5FD` | Hover su accent (blue-300) |
| `--accent-subtle` | `rgba(96,165,250,0.1)` | Background per badge/tag |
| `--gradient-text` | `linear-gradient(135deg, #F5F5F7, #A1A1A6)` | Titolo hero |

**Font** (self-hosted, .woff2 in `public/fonts/`):
- Heading: **Geist Sans** (600–700)
- Body: **Inter** (400–500)
- Code: **Geist Mono** (400)

**Spacing / Border radius**:
- Griglia: 4px base (4, 8, 12, 16, 24, 32, 48, 64, 96)
- Max width contenuto: `1200px`
- Max width testo: `680px`
- Border radius card: `16px` (`rounded-2xl`)
- Border radius button/tag: `8px` (`rounded-lg`)

### 2.2 Contenuti Homepage

```
Homepage (/)
├── Nav: logo "ellevas" (text, Geist Sans bold) + link (Home, Docs, GitHub)
├── Hero:
│   ├── "Raffaele Vasini"
│   ├── "Full-Stack Developer · Backend & Cloud"
│   └── "Trasformo requisiti di business in sistemi che funzionano — dal database alla pipeline."
├── About: bio 3-4 righe (10+ anni, freelance, embedded in team, focus backend/cloud)
├── Tech Stack: griglia icone (grigie → colore al hover)
│   └── TypeScript, NestJS, Node.js, PostgreSQL, AWS, Docker, GitHub Actions, React, Vue, Tailwind, Nx, Vite
├── Progetti: solo progetti personali
│   ├── cloudrift — CLI analisi sprechi AWS. DDD, Nx, AWS SDK v3.
│   │   Tags: Open Source · AWS · TypeScript · DDD
│   │   Link: GitHub
│   └── ellevas.dev — Questo sito. Astro 7, AWS CDK, S3+CloudFront.
│       Tags: Astro · AWS CDK · Tailwind
├── Contatti: email (raffaelevasini@gmail.com) + GitHub (elleVas) + LinkedIn
└── Footer: © 2026 ellevas · icone social
```

**Nota**: niente clienti/enterprise sul sito. Solo progetti personali.

### 2.3 Documentazione cloudrift (/docs)

Struttura multi-pagina con sidebar navigazione:

```
/docs/
├── intro          — Cos'è cloudrift
├── quick-start    — Installazione e primo uso
├── architecture   — DDD, Ports & Adapters, struttura progetto
├── plugin-model   — Come funzionano e come crearne uno
├── cicd-gate      — Configurazione CI/CD gate (budget threshold)
└── contributing   — Come contribuire
```

Implementata con **Content Collections** di Astro (file `.md` o `.mdx` in `src/content/docs/`).
Layout dedicato `DocsLayout.astro` con sidebar fissa a sinistra (260px).

### 2.4 SEO

- Meta tag Open Graph + Twitter Card su ogni pagina
- `robots.txt` generato
- `sitemap.xml` via `@astrojs/sitemap` (site: `https://ellevas.dev`)
- Tag `<title>` e `<meta description>` unici per pagina
- Structured data JSON-LD (tipo `Person` per homepage)
- `<link rel="canonical">` su ogni pagina
- Font preload (`<link rel="preload" as="font">`)
- Immagini con `alt` descrittivi
- Semantic HTML (`<main>`, `<nav>`, `<article>`, `<section>`)

### 2.5 Componenti base

- `BaseLayout.astro` — head (meta, font, OG) + slot
- `Nav.astro` — navigazione responsive (hamburger mobile)
- `Hero.astro` — titolo gradiente + sottotitolo + tagline
- `About.astro` — bio section
- `TechGrid.astro` — griglia icone tech stack (hover = colore)
- `ProjectCard.astro` — card progetto (stile bento, bordi sottili)
- `ContactSection.astro` — email + social
- `Footer.astro` — footer minimale
- `DocsLayout.astro` — layout docs con sidebar
- `DocsSidebar.astro` — navigazione laterale docs
- `SEO.astro` — componente per meta tag riusabile

### 2.6 Animazioni

- On scroll: fade-in + translateY(20px→0) via IntersectionObserver
- Hover card: translateY(-2px) + bordo più visibile, transition 200ms
- View Transitions: attivate globalmente (fade tra pagine)
- Tech icons: grayscale(1)→grayscale(0) + opacity 0.5→1 al hover

✅ **Completato quando**: design system configurato in Tailwind, componenti implementati,
contenuto placeholder inserito, sito navigabile in locale.

---

## Fase 3 — Test Locale

**Prima di qualunque deploy su AWS**, verificare tutto in locale:

1. `bun run nx dev site` → `http://localhost:4321`
   - Navigazione homepage ↔ docs
   - Responsive (mobile/tablet/desktop)
   - View Transitions funzionanti
   - Hover states e animazioni on-scroll

2. `bun run nx build site` → deve completare senza errori
   - `apps/site/dist/` contiene tutte le pagine
   - `sitemap.xml` generata
   - `robots.txt` presente

3. `bun run nx preview site` → verifica build statico servito
   - Tutti i link funzionano
   - 404 page custom funziona

✅ **Completato quando**: sito completo, funzionante e testato in locale.

---

## Fase 4 — Stack CDK: DNS + Certificato (`dns-stack.ts`)

File: `apps/infra/lib/dns-stack.ts`

Il dominio è su Route53, la Hosted Zone esiste già:

```ts
const zone = route53.HostedZone.fromLookup(this, 'Zone', {
  domainName: 'ellevas.dev',
});

const certificate = new acm.Certificate(this, 'Cert', {
  domainName: 'ellevas.dev',
  subjectAlternativeNames: ['www.ellevas.dev'],
  validation: acm.CertificateValidation.fromDns(zone),
});
```

⚠️ Stack istanziato con `env: { region: 'us-east-1' }` nel `bin/infra.ts`.

**Cross-region**: esportare l'ARN del certificato via SSM Parameter Store o `CfnOutput`
per il consumo dallo stack hosting.

✅ **Completato quando**: `bunx cdk deploy DnsStack` crea il certificato → "Issued" in ACM (us-east-1).

---

## Fase 5 — Stack CDK: Hosting (`hosting-stack.ts`)

File: `apps/infra/lib/hosting-stack.ts`

Risorse:
1. **S3 Bucket** privato (blocco accesso pubblico attivo).
2. **CloudFront Distribution**:
   - Origin = S3 tramite **Origin Access Control (OAC)**.
   - Alternate domains = `ellevas.dev`, `www.ellevas.dev`.
   - Certificato ACM da us-east-1 (cross-region ref).
   - Error response: 404 → `/404/index.html` con status **404**.
   - `www.ellevas.dev` → redirect 301 a `ellevas.dev`.
3. **Route53 Record** A (Alias) + AAAA → CloudFront.

Output:
- `BucketName`
- `DistributionId`

✅ **Completato quando**: `bunx cdk deploy HostingStack` completa e `ellevas.dev` è raggiungibile HTTPS.

---

## Fase 6 — Deploy manuale di verifica

```bash
bun run nx build site
aws s3 sync apps/site/dist s3://<BucketName> --delete
aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
```

✅ **Completato quando**: `https://ellevas.dev` mostra il sito reale con HTTPS valido.

---

## Fase 7 — IAM Role per GitHub Actions (OIDC)

Stack CDK: IAM Role assumibile solo dal repo `elleVas/<repo-name>` su branch `main`.

Trust policy:
```
"token.actions.githubusercontent.com:sub": "repo:elleVas/<repo-name>:ref:refs/heads/main"
```

Permessi minimi:
- `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` → bucket sito
- `cloudfront:CreateInvalidation` → distribuzione specifica
- Permessi CloudFormation/CDK per workflow infra

✅ **Completato quando**: `RoleArn` disponibile come variabile nel repo GitHub.

---

## Fase 8 — GitHub Actions: workflow infrastruttura

File: `.github/workflows/deploy-infra.yml`

Trigger: push su `main` con modifiche in `apps/infra/**`.

Steps:
1. Checkout
2. `oven-sh/setup-bun@v2` + `actions/setup-node@v4` (Node serve per CDK CLI)
3. `bun install`
4. Credenziali AWS via OIDC (`aws-actions/configure-aws-credentials`)
5. `bun run nx run infra:diff` su PR
6. `bun run nx run infra:deploy` su merge in main

✅ **Completato quando**: modifica a `apps/infra` triggera diff/deploy automatico.

---

## Fase 9 — GitHub Actions: workflow sito

File: `.github/workflows/deploy-site.yml`

Trigger: push su `main` con modifiche in `apps/site/**`.

Steps:
1. Checkout
2. `oven-sh/setup-bun@v2`
3. `bun install`
4. `bun run nx build site`
5. Credenziali AWS via OIDC
6. `aws s3 sync apps/site/dist s3://<bucket> --delete`
7. `aws cloudfront create-invalidation --distribution-id <id> --paths "/*"`

Bucket e Distribution ID come **variabili di repo** (non secret).

✅ **Completato quando**: commit su `apps/site` → sito aggiornato online automaticamente.

---

## Fase 10 — Rifiniture e sicurezza

- [ ] **AWS Budget** con alert email a soglia $1 / $5
- [ ] Verifica bucket S3 privato al 100% (solo CloudFront + OAC)
- [ ] `www.ellevas.dev` → redirect 301 a `ellevas.dev`
- [ ] Tag risorse CDK (`Project: ellevas-site`) per Cost Explorer
- [ ] Google Search Console: verifica proprietà + submit sitemap
- [ ] (Futuro) Se serve SSR: Lambda@Edge o Lambda Function URL

---

## Riepilogo ordine di esecuzione

| # | Fase | Tipo | Tempo stimato |
|---|------|------|---------------|
| 0 | Account AWS + dominio Route53 + OIDC + Bun | Manuale (console) | 30 min |
| 1 | Nx + Astro + CDK scaffold (con Bun) | Automatico (locale) | 1h |
| 2 | Design system + pagine + contenuti | Implementazione | 4-6h |
| 3 | Test locale completo | Verifica locale | 1h |
| 4 | Stack DNS + certificato ACM | CDK deploy | 30 min |
| 5 | Stack Hosting (S3+CF+Route53) | CDK deploy | 30 min |
| 6 | Deploy manuale verifica | Comandi locale | 15 min |
| 7 | IAM Role OIDC per GitHub | CDK deploy | 30 min |
| 8 | Workflow GitHub Actions — infra | Automatico | 1h |
| 9 | Workflow GitHub Actions — sito | Automatico | 1h |
| 10 | Rifiniture + SEO + sicurezza | Misto | 1h |

---

## Costi mensili stimati (traffico basso/medio)

| Risorsa | Costo |
|---------|-------|
| Route53 Hosted Zone | $0.50/mese |
| Route53 query DNS | ~$0.00 |
| Dominio `ellevas.dev` | ~$12/anno ($1/mese) |
| S3 storage | ~$0.01 (sito statico < 50MB) |
| CloudFront | $0.00 (free tier: 1TB/mese + 10M req) |
| ACM certificato | Gratuito |
| GitHub Actions | Free tier |
| **Totale** | **~$1.50/mese** |

---

## Note tecniche

### Bun nel progetto

- **Bun** è usato come package manager (`bun install`) e script runner (`bun run`).
- **Astro** gira nativamente con Bun (supportato via Vite).
- **CDK CLI** usa Node.js internamente — trasparente quando lanciato con `bunx cdk` o `bun run cdk`.
- **In CI**: servono sia `oven-sh/setup-bun` che `actions/setup-node` (per CDK).
- **Lock file**: `bun.lock` (non `package-lock.json`).

### Cross-region certificato

Il certificato ACM deve stare in `us-east-1` per CloudFront. Pattern consigliato:
- Stack DNS in `us-east-1` → crea certificato → esporta ARN via `CfnOutput` o SSM
- Stack Hosting in `eu-south-1` → importa ARN con `acm.Certificate.fromCertificateArn()`

### Perché no client/enterprise sul sito

Solo progetti personali (cloudrift, ellevas.dev). I clienti enterprise restano nel CV
offline — il sito è il biglietto da visita tecnico, non un elenco di collaborazioni.
