# ellevas.dev

Personal website and portfolio of Raffaele Vasini — backend developer focused on AWS, TypeScript, and cloud-native architectures.

**Live:** [ellevas.dev](https://ellevas.dev)

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro](https://astro.build) 7 |
| Styling | [Tailwind CSS](https://tailwindcss.com) 4 |
| Interactive components | [React](https://react.dev) 19 |
| Monorepo | [Nx](https://nx.dev) 23 |
| Package manager | [Bun](https://bun.sh) |
| Hosting | AWS (CloudFront + S3) |

## Project structure

```
apps/
  site/              # Astro site
    src/
      components/    # Astro and React components
      content/       # Content collections (docs IT/EN)
      i18n/          # Translations and i18n utilities
      layouts/       # Base layout
      pages/         # Routes (EN default + /it/)
      styles/        # Global CSS with Tailwind @theme
    public/          # Static assets (fonts, icons, favicon)
```

## Prerequisites

- Node.js >= 22.12.0
- Bun (for the lockfile)

## Local development

```sh
# Install dependencies
bun install

# Start the dev server
bunx nx dev site

# Production build
bunx nx build site

# Preview the build
bunx nx preview site
```

## Internationalization

The site supports two languages:

- **English** (default, no prefix): `/`, `/docs/...`
- **Italian**: `/it/`, `/it/docs/...`

Translations are managed via TypeScript files in `apps/site/src/i18n/`.

## Featured projects

- **[cloudrift](https://github.com/elleVas/cloudrift)** — Open-source framework for cloud architectures on AWS with DDD
- **[cloudrift-cdk-test](https://github.com/elleVas/cloudrift-cdk-test)** — Testing utilities for AWS CDK infrastructure
- **[ellevas.dev](https://github.com/elleVas/ellevas-site)** — This site

## License

MIT
