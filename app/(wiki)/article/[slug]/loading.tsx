export default function ArticleLoading() {
  return (
    <article className="wiki-paper p-5 md:p-8 animate-pulse">
      <div className="h-6 w-56 rounded bg-wiki-border" />
      <div className="mt-4 h-12 w-4/5 rounded bg-wiki-border" />
      <div className="mt-3 h-4 w-full rounded bg-wiki-border" />
      <div className="mt-2 h-4 w-5/6 rounded bg-wiki-border" />

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[420px] rounded border border-wiki-border bg-white" />
        <div className="h-[220px] rounded border border-wiki-border bg-white" />
      </div>
    </article>
  );
}
