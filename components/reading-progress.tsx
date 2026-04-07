"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

const storageKey = "historico2100.readHitos.v1";

interface ReadingProgressContextValue {
  eligibleSlugs: string[];
  isReady: boolean;
  isEligible: (slug: string) => boolean;
  isRead: (slug: string) => boolean;
  toggleRead: (slug: string) => void;
  readCount: number;
  totalCount: number;
  progressPercentage: number;
}

const ReadingProgressContext = createContext<ReadingProgressContextValue | null>(null);

export function ReadingProgressProvider({
  children,
  eligibleSlugs
}: {
  children: ReactNode;
  eligibleSlugs: string[];
}) {
  const [readSlugs, setReadSlugs] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);
  const normalizedEligibleSlugs = [...new Set(eligibleSlugs)];
  const eligibleSlugKey = normalizedEligibleSlugs.join("::");

  useEffect(() => {
    const allowedSlugs = new Set(eligibleSlugKey ? eligibleSlugKey.split("::") : []);

    try {
      const storedValue = window.localStorage.getItem(storageKey);

      if (!storedValue) {
        setIsReady(true);
        return;
      }

      const parsedValue = JSON.parse(storedValue) as unknown;
      const nextReadSlugs = Array.isArray(parsedValue)
        ? parsedValue.filter(
            (slug): slug is string =>
              typeof slug === "string" && allowedSlugs.has(slug)
          )
        : [];

      setReadSlugs(new Set(nextReadSlugs));
    } catch {
      setReadSlugs(new Set());
    } finally {
      setIsReady(true);
    }
  }, [eligibleSlugKey]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify([...readSlugs]));
  }, [isReady, readSlugs]);

  const readCount = [...readSlugs].filter((slug) => normalizedEligibleSlugs.includes(slug)).length;
  const totalCount = normalizedEligibleSlugs.length;
  const progressPercentage = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

  return (
    <ReadingProgressContext.Provider
      value={{
        eligibleSlugs: normalizedEligibleSlugs,
        isReady,
        isEligible: (slug) => normalizedEligibleSlugs.includes(slug),
        isRead: (slug) => readSlugs.has(slug),
        toggleRead: (slug) => {
          if (!normalizedEligibleSlugs.includes(slug)) {
            return;
          }

          setReadSlugs((current) => {
            const next = new Set(current);

            if (next.has(slug)) {
              next.delete(slug);
            } else {
              next.add(slug);
            }

            return next;
          });
        },
        readCount,
        totalCount,
        progressPercentage
      }}
    >
      {children}
    </ReadingProgressContext.Provider>
  );
}

export function useReadingProgress() {
  const context = useContext(ReadingProgressContext);

  if (!context) {
    throw new Error("useReadingProgress must be used inside ReadingProgressProvider.");
  }

  return context;
}

export function ReadingProgressBar() {
  const { isReady, progressPercentage, readCount, totalCount } = useReadingProgress();

  return (
    <div className="rounded-sm border border-wiki-border bg-white px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="font-semibold text-wiki-text">Progreso de lectura</div>
        <div className="text-wiki-muted">
          {readCount}/{totalCount} hitos leídos
          {!isReady ? " · sincronizando" : null}
        </div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-wiki-badge">
        <div
          className="h-full rounded-full bg-[#5b1739] transition-[width] duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}

export function ReadingProgressToggle({ slug }: { slug: string }) {
  const { isEligible, isRead, toggleRead } = useReadingProgress();

  if (!isEligible(slug)) {
    return null;
  }

  const read = isRead(slug);

  return (
    <button
      type="button"
      onClick={() => toggleRead(slug)}
      className={`rounded-sm border px-3 py-2 text-sm font-semibold transition-colors ${
        read
          ? "border-[#2f6f4f] bg-[#eef8f1] text-[#1f5136]"
          : "border-wiki-border bg-white text-wiki-text"
      }`}
      aria-pressed={read}
    >
      {read ? "Marcar como no leído" : "Marcar como leído"}
    </button>
  );
}

export function ReadingProgressBadge({ slug }: { slug: string }) {
  const { isEligible, isRead } = useReadingProgress();

  if (!isEligible(slug)) {
    return null;
  }

  return isRead(slug) ? (
    <span className="wiki-badge-success">Leído</span>
  ) : (
    <span className="wiki-badge">Pendiente</span>
  );
}
