import path from "path";

export const historyMapsPublicDirectory = path.join(process.cwd(), "public", "images", "history-maps");

export function getHistoryCountryMapPublicPath(slug: string, sourceFileName: string) {
  return `/images/history-maps/${slug}${getHistorySourceExtension(sourceFileName)}`;
}

export function getHistoryCountryMapPublicFilePath(slug: string, sourceFileName: string) {
  return path.join(historyMapsPublicDirectory, `${slug}${getHistorySourceExtension(sourceFileName)}`);
}

function getHistorySourceExtension(fileName: string) {
  const extension = path.extname(fileName).trim().toLowerCase();
  return extension || ".png";
}
