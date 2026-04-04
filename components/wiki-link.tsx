import Link from "next/link";

interface WikiLinkProps {
  slug: string;
  label: string;
  exists?: boolean;
  href?: string;
  openInNewTab?: boolean;
}

export function WikiLink({ slug, label, exists = true, href, openInNewTab = false }: WikiLinkProps) {
  return (
    <Link
      href={href ?? `/article/${slug}`}
      className={exists ? "wiki-link wiki-link-track" : "wiki-link wiki-link-track wiki-link-missing"}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noreferrer" : undefined}
    >
      {label}
    </Link>
  );
}
