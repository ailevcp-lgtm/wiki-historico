export default function BlocLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="wiki-paper overflow-hidden">
        <div className="h-40 bg-wiki-border" />
        <div className="p-5 md:p-6">
          <div className="h-4 w-full rounded bg-wiki-border" />
          <div className="mt-2 h-4 w-4/5 rounded bg-wiki-border" />
        </div>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <div className="h-8 w-64 rounded bg-wiki-border" />
        <div className="mt-4 h-36 rounded border border-wiki-border bg-white" />
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <div className="h-8 w-72 rounded bg-wiki-border" />
        <div className="mt-4 h-80 rounded border border-wiki-border bg-white" />
      </section>
    </div>
  );
}
