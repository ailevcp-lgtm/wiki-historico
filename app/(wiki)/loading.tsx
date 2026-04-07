export default function WikiRootLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="wiki-paper p-6">
        <div className="h-4 w-40 rounded bg-wiki-border" />
        <div className="mt-4 h-10 w-3/4 rounded bg-wiki-border" />
        <div className="mt-3 h-4 w-full rounded bg-wiki-border" />
        <div className="mt-2 h-4 w-5/6 rounded bg-wiki-border" />
      </section>
      <section className="wiki-paper p-6">
        <div className="h-8 w-64 rounded bg-wiki-border" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="h-24 rounded bg-wiki-border" />
          <div className="h-24 rounded bg-wiki-border" />
          <div className="h-24 rounded bg-wiki-border" />
        </div>
      </section>
    </div>
  );
}
