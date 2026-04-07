export default function CountryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="wiki-paper p-5 md:p-6">
        <div className="h-5 w-64 rounded bg-wiki-border" />
        <div className="mt-4 h-12 w-3/4 rounded bg-wiki-border" />
        <div className="mt-3 h-4 w-full rounded bg-wiki-border" />
      </section>

      <section className="wiki-paper p-5">
        <div className="h-72 rounded border border-wiki-border bg-white" />
      </section>

      <section className="wiki-paper p-5">
        <div className="h-8 w-56 rounded bg-wiki-border" />
        <div className="mt-4 h-48 rounded border border-wiki-border bg-white" />
      </section>
    </div>
  );
}
