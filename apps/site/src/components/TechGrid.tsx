import { useState } from 'react';

interface Technology {
  name: string;
  color: string;
  abbr: string;
}

const technologies: Technology[] = [
  { name: 'TypeScript', color: '#3178C6', abbr: 'TS' },
  { name: 'NestJS', color: '#E0234E', abbr: 'NJ' },
  { name: 'Node.js', color: '#339933', abbr: 'NO' },
  { name: 'PostgreSQL', color: '#4169E1', abbr: 'PG' },
  { name: 'AWS', color: '#FF9900', abbr: 'AW' },
  { name: 'Docker', color: '#2496ED', abbr: 'DK' },
  { name: 'GitHub Actions', color: '#2088FF', abbr: 'GA' },
  { name: 'React', color: '#61DAFB', abbr: 'RE' },
  { name: 'Vue', color: '#4FC08D', abbr: 'VU' },
  { name: 'Tailwind', color: '#06B6D4', abbr: 'TW' },
  { name: 'Nx', color: '#143055', abbr: 'NX' },
  { name: 'Vite', color: '#646CFF', abbr: 'VI' },
];

function TechItem({ tech }: { tech: Technology }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group flex flex-col items-center gap-3 rounded-2xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-border-hover"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-subtle transition-colors duration-200"
        style={{ color: hovered ? tech.color : undefined }}
      >
        <span className={`text-xs font-mono font-medium ${!hovered ? 'text-text-muted' : ''}`}>
          {tech.abbr}
        </span>
      </div>
      <span className="text-xs text-text-muted transition-colors group-hover:text-text-secondary">
        {tech.name}
      </span>
    </div>
  );
}

export default function TechGrid() {
  return (
    <section id="stack" className="px-6 py-24">
      <div className="mx-auto max-w-[var(--width-content)]">
        <h2 className="text-center font-heading text-2xl font-semibold text-text-primary sm:text-3xl">
          Tech Stack
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
