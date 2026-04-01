import type { NavHeading } from "@/types/wiki";

interface TableOfContentsProps {
  headings: NavHeading[];
  title?: string;
}

export function TableOfContents({ headings, title = "Contenido" }: TableOfContentsProps) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="wiki-toc">
      <div className="wiki-toc-title">{title}</div>
      <ol className="space-y-1 text-sm text-wiki-text">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.depth === 3 ? "pl-4" : ""}>
            <a href={`#${heading.id}`} className="hover:underline">
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
