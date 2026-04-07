export default function SearchLoading() {
  return (
    <section className="wiki-paper p-5 md:p-6 animate-pulse">
      <div className="h-4 w-40 rounded bg-wiki-border" />
      <div className="mt-3 h-10 w-64 rounded bg-wiki-border" />
      <div className="mt-3 h-4 w-full rounded bg-wiki-border" />

      <div className="mt-6 h-11 rounded border border-wiki-border bg-white" />

      <div className="mt-6 space-y-4">
        <div className="h-28 rounded border border-wiki-border bg-white" />
        <div className="h-28 rounded border border-wiki-border bg-white" />
        <div className="h-28 rounded border border-wiki-border bg-white" />
      </div>
    </section>
  );
}
