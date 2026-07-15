import { useState } from 'react';
import type { Lang } from '../i18n/translations';
import { useTranslations } from '../i18n/utils';

interface Technology {
  name: string;
  icon: string;
}

const technologies: Technology[] = [
  { name: 'TypeScript', icon: 'typescript.svg' },
  { name: 'NestJS', icon: 'nestjs.svg' },
  { name: 'Node.js', icon: 'nodejs.svg' },
  { name: 'PostgreSQL', icon: 'postgresql.svg' },
  { name: 'AWS', icon: 'aws.svg' },
  { name: 'Docker', icon: 'docker.svg' },
  { name: 'GitHub Actions', icon: 'githubactions.svg' },
  { name: 'React', icon: 'react.svg' },
  { name: 'Angular', icon: 'angular.svg' },
  { name: 'Vue', icon: 'vue.svg' },
  { name: 'Tailwind', icon: 'tailwindcss.svg' },
  { name: 'Nx', icon: 'nx.svg' },
];

function TechItem({ tech }: { tech: Technology }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group flex flex-col items-center gap-3 rounded-2xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-border-hover"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-subtle transition-all duration-200">
        <img
          src={`/icons/${tech.icon}`}
          alt={tech.name}
          width={28}
          height={28}
          loading="lazy"
          decoding="async"
          className="h-7 w-7 transition-all duration-200"
          style={{
            filter: 'none',
            opacity: 1,
          }}
        />
      </div>
      <span className="text-xs text-text-muted transition-colors group-hover:text-text-secondary">
        {tech.name}
      </span>
    </div>
  );
}

interface Props {
  lang?: Lang;
}

export default function TechGrid({ lang = 'en' }: Props) {
  const t = useTranslations(lang);

  return (
    <section id="stack" className="px-6 py-16">
      <div className="mx-auto max-w-[var(--width-content)]">
        <h2 className="text-center font-heading text-2xl font-semibold sm:text-3xl">
          <span className="bg-gradient-to-br from-text-primary to-text-heading bg-clip-text text-transparent">
            {t('stack.title')}
          </span>
        </h2>
        <div className="mt-12 grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6">
          {technologies.map((tech) => (
            <TechItem key={tech.name} tech={tech} />
          ))}
        </div>
      </div>
    </section>
  );
}
