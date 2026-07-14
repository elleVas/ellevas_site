interface DocLink {
  slug: string;
  title: string;
  href: string;
}

interface Props {
  docs: DocLink[];
  currentSlug: string;
}

export default function DocsSidebar({ docs, currentSlug }: Props) {
  return (
    <aside className="sticky top-20 hidden w-64 shrink-0 lg:block">
      <nav className="rounded-2xl border border-border bg-bg-card p-4">
        <h3 className="mb-3 font-heading text-xs font-semibold uppercase tracking-wider bg-gradient-to-br from-text-primary to-text-secondary bg-clip-text text-transparent">
          cloudrift
        </h3>
        <ul className="space-y-1">
          {docs.map((doc) => (
            <li key={doc.slug}>
              <a
                href={doc.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  currentSlug === doc.slug
                    ? 'border-l-2 border-accent text-text-primary font-medium'
                    : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
                }`}
              >
                {doc.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
