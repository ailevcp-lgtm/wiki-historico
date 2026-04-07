import type { ArticleType } from "@/types/wiki";

const articleTypeLabelsEs: Record<ArticleType, string> = {
  event: "Evento",
  organization: "Organización",
  treaty: "Tratado",
  technology: "Tecnología",
  geography: "Geografía",
  society: "Sociedad",
  summit: "Cumbre",
  bloc: "Bloque",
  conflict: "Conflicto"
};

export function articleTypeLabelEs(type: ArticleType): string {
  return articleTypeLabelsEs[type] ?? type;
}
