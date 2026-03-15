import Link from "next/link";

interface WikiLinkProps {
  slug: string;
  label: string;
  exists?: boolean;
}

export function WikiLink({ slug, label, exists = true }: WikiLinkProps) {
  return (
    <Link
      href={`/article/${slug}`}
      className={exists ? "wiki-link" : "wiki-link wiki-link-missing"}
    >
      {label}
    </Link>
  );
}
