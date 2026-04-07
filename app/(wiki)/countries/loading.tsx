export default function CountriesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="wiki-paper p-5 md:p-6">
        <div className="h-4 w-40 rounded bg-wiki-border" />
        <div className="mt-3 h-10 w-72 rounded bg-wiki-border" />
        <div className="mt-3 h-4 w-full rounded bg-wiki-border" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="h-24 rounded border border-wiki-border bg-white" />
        <div className="h-24 rounded border border-wiki-border bg-white" />
        <div className="h-24 rounded border border-wiki-border bg-white" />
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <div className="h-8 w-72 rounded bg-wiki-border" />
        <div className="mt-4 h-80 rounded border border-wiki-border bg-white" />
      </section>
    </div>
  );
}
