import Link from "next/link";

import { resolveHitoReference, type HitoReferenceIndex } from "@/lib/hito-references";

interface HitoReferenceProps {
  hitoId?: string;
  hitoArticles: HitoReferenceIndex;
  linkClassName?: string;
  missingClassName?: string;
  openInNewTab?: boolean;
}

export function HitoReference({
  hitoId,
  hitoArticles,
  linkClassName = "wiki-link wiki-link-track",
  missingClassName,
  openInNewTab = false
}: HitoReferenceProps) {
  const resolvedReference = resolveHitoReference(hitoId, hitoArticles);

  if (!resolvedReference) {
    return null;
  }

  if (!resolvedReference.exists || !resolvedReference.href) {
    return <span className={missingClassName}>{resolvedReference.label}</span>;
  }

  return (
    <Link
      href={resolvedReference.href}
      className={linkClassName}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noreferrer" : undefined}
    >
      {resolvedReference.label}
    </Link>
  );
}
