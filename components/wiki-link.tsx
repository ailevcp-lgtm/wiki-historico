import Link from "next/link";

interface WikiLinkProps {
  slug: string;
  label: string;
  exists?: boolean;
  href?: string;
}

export function WikiLink({ slug, label, exists = true, href }: WikiLinkProps) {
  return (
    <Link
      href={href ?? `/article/${slug}`}
      className={exists ? "wiki-link wiki-link-track" : "wiki-link wiki-link-track wiki-link-missing"}
    >
      {label}
    </Link>
  );
}
