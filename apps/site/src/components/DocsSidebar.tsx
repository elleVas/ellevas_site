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
      <nav className="rounded-2xl border border-accent/15 bg-bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <img
            src="/icons/cloudrift.png"
            alt=""
            width="20"
            height="20"
            loading="lazy"
            decoding="async"
            className="rendering-pixelated h-5 w-5"
          />
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wider bg-gradient-to-br from-text-primary to-accent bg-clip-text text-transparent">
            cloudrift
          </h3>
          <span className="ml-auto rounded border border-accent/25 bg-accent/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-accent">
            CLI
          </span>
        </div>
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
