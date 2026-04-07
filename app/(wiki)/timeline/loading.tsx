export default function TimelineLoading() {
  return (
    <section className="wiki-paper p-5 md:p-6 animate-pulse">
      <div className="h-4 w-40 rounded bg-wiki-border" />
      <div className="mt-3 h-10 w-72 rounded bg-wiki-border" />
      <div className="mt-3 h-4 w-full rounded bg-wiki-border" />
      <div className="mt-2 h-4 w-5/6 rounded bg-wiki-border" />

      <div className="mt-6 h-16 rounded border border-wiki-border bg-wiki-page" />

      <div className="mt-6 space-y-4">
        <div className="h-36 rounded border border-wiki-border bg-white" />
        <div className="h-36 rounded border border-wiki-border bg-white" />
        <div className="h-36 rounded border border-wiki-border bg-white" />
      </div>
    </section>
  );
}
