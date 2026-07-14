import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docsSchema = z.object({
  title: z.string(),
  description: z.string(),
  order: z.number(),
});

const docsEn = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs-en' }),
  schema: docsSchema,
});

const docsIt = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: docsSchema,
});

export const collections = { 'docs-en': docsEn, 'docs-it': docsIt };
