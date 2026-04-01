const markdownImageLinePattern = /^!\[[^\]]*]\([^)]+\)$/;

export function getCountryProfileMarkdown(markdown: string, options?: { stripImages?: boolean }) {
  const lines = markdown.split(/\r?\n/);
  const filteredLines = options?.stripImages
    ? lines.filter((line) => !markdownImageLinePattern.test(line.trim()))
    : lines;

  return filteredLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
