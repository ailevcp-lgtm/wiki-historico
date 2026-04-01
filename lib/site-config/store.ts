import "server-only";

import { promises as fs } from "fs";
import path from "path";

import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStagingMode } from "@/lib/staging/store";
import { defaultPublicWikiCopy, defaultWikiSiteConfig } from "@/lib/site-config/defaults";
import type { Bloc, Category, PublicWikiCopy, TimelineEra, WikiSiteConfig } from "@/types/wiki";

const localFilePath = path.join(process.cwd(), "storage", "wiki-site-config.local.json");
const publicCopySettingKey = "public_wiki_copy";

type EraRow = {
  slug: string;
  number: number;
  name: string;
  year_start: number;
  year_end: number;
  theme: string | null;
  description: string | null;
  color: string | null;
};

type CategoryRow = {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
};

type BlocRow = {
  slug: string;
  name: string;
  summary: string | null;
  color: string | null;
};

type SiteSettingsRow = {
  key: string;
  value: unknown;
};

type SiteConfigInput = Partial<Omit<WikiSiteConfig, "copy">> & {
  copy?: Partial<PublicWikiCopy>;
};

export async function getSiteConfig(): Promise<WikiSiteConfig> {
  noStore();
  return readSiteConfig();
}

const readSiteConfig = cache(async (): Promise<WikiSiteConfig> => {
  if (getStagingMode() === "supabase") {
    const supabase = await createSupabaseAdminClient();
    const [
      { data: eraRows, error: erasError },
      { data: categoryRows, error: categoriesError },
      { data: blocRows, error: blocsError },
      { data: settingsRow, error: settingsError }
    ] = await Promise.all([
      supabase.from("timeline_eras").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("blocs").select("*"),
      supabase.from("site_settings").select("*").eq("key", publicCopySettingKey).maybeSingle()
    ]);

    if (erasError && !isMissingRelationError(erasError)) {
      throw new Error(erasError.message);
    }

    if (categoriesError && !isMissingRelationError(categoriesError)) {
      throw new Error(categoriesError.message);
    }

    if (blocsError && !isMissingRelationError(blocsError)) {
      throw new Error(blocsError.message);
    }

    if (settingsError && !isMissingRelationError(settingsError)) {
      throw new Error(settingsError.message);
    }

    return mergeSiteConfig({
      eras: (isMissingRelationError(erasError) ? [] : ((eraRows ?? []) as EraRow[])).map(mapEraRow),
      categories: (
        isMissingRelationError(categoriesError) ? [] : ((categoryRows ?? []) as CategoryRow[])
      ).map(mapCategoryRow),
      blocs: (isMissingRelationError(blocsError) ? [] : ((blocRows ?? []) as BlocRow[])).map(mapBlocRow),
      copy:
        !isMissingRelationError(settingsError) &&
        settingsRow &&
        typeof (settingsRow as SiteSettingsRow).value === "object"
          ? ((settingsRow as SiteSettingsRow).value as Partial<PublicWikiCopy>)
          : undefined
    });
  }

  const store = await readLocalStore();
  return mergeSiteConfig(store);
});

export async function saveSiteConfig(config: WikiSiteConfig): Promise<WikiSiteConfig> {
  const nextConfig = mergeSiteConfig(config);

  if (getStagingMode() === "supabase") {
    const supabase = await createSupabaseAdminClient();

    const { error: erasUpsertError } = await supabase.from("timeline_eras").upsert(
      nextConfig.eras.map((era) => ({
        slug: era.slug,
        number: era.number,
        name: era.name,
        year_start: era.yearStart,
        year_end: era.yearEnd,
        theme: era.theme,
        description: era.description,
        color: era.color
      })),
      { onConflict: "slug" }
    );

    if (erasUpsertError) {
      throw new Error(explainSchemaError(erasUpsertError));
    }

    const { error: categoriesUpsertError } = await supabase.from("categories").upsert(
      nextConfig.categories.map((category) => ({
        slug: category.slug,
        name: category.name,
        description: category.description,
        icon: category.icon ?? null
      })),
      { onConflict: "slug" }
    );

    if (categoriesUpsertError) {
      throw new Error(explainSchemaError(categoriesUpsertError));
    }

    const { error: blocsUpsertError } = await supabase.from("blocs").upsert(
      nextConfig.blocs.map((bloc) => ({
        slug: bloc.slug,
        name: bloc.name,
        summary: bloc.summary,
        color: bloc.color
      })),
      { onConflict: "slug" }
    );

    if (blocsUpsertError) {
      throw new Error(explainSchemaError(blocsUpsertError));
    }

    await deleteMissingSlugs("timeline_eras", nextConfig.eras.map((era) => era.slug));
    await deleteMissingSlugs("categories", nextConfig.categories.map((category) => category.slug));
    await deleteMissingSlugs("blocs", nextConfig.blocs.map((bloc) => bloc.slug));

    const { error: settingsError } = await supabase.from("site_settings").upsert(
      {
        key: publicCopySettingKey,
        value: nextConfig.copy
      },
      { onConflict: "key" }
    );

    if (settingsError) {
      throw new Error(explainSchemaError(settingsError));
    }

    return nextConfig;
  }

  await writeLocalStore(nextConfig);
  return nextConfig;
}

function mapEraRow(row: EraRow): TimelineEra {
  return {
    slug: row.slug,
    number: row.number,
    name: row.name,
    yearStart: row.year_start,
    yearEnd: row.year_end,
    theme: row.theme ?? "",
    description: row.description ?? "",
    color: row.color ?? "#5A7FA8"
  };
}

function mapCategoryRow(row: CategoryRow): Category {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    icon: row.icon ?? undefined
  };
}

function mapBlocRow(row: BlocRow): Bloc {
  return {
    slug: row.slug,
    name: row.name,
    summary: row.summary ?? "",
    color: row.color ?? "#DCEBFA"
  };
}

function mergeSiteConfig(input?: SiteConfigInput): WikiSiteConfig {
  return {
    eras: mergeItemsBySlug(defaultWikiSiteConfig.eras, input?.eras),
    categories: mergeItemsBySlug(defaultWikiSiteConfig.categories, input?.categories),
    blocs: mergeItemsBySlug(defaultWikiSiteConfig.blocs, input?.blocs),
    copy: mergePublicWikiCopy(input?.copy)
  };
}

function mergePublicWikiCopy(input?: Partial<PublicWikiCopy>): PublicWikiCopy {
  return {
    shell: { ...defaultPublicWikiCopy.shell, ...(input?.shell ?? {}) },
    home: { ...defaultPublicWikiCopy.home, ...(input?.home ?? {}) },
    timeline: { ...defaultPublicWikiCopy.timeline, ...(input?.timeline ?? {}) },
    search: { ...defaultPublicWikiCopy.search, ...(input?.search ?? {}) },
    countries: { ...defaultPublicWikiCopy.countries, ...(input?.countries ?? {}) },
    countryPage: { ...defaultPublicWikiCopy.countryPage, ...(input?.countryPage ?? {}) },
    countryScorecard: {
      ...defaultPublicWikiCopy.countryScorecard,
      ...(input?.countryScorecard ?? {})
    },
    countryPresenceBoard: {
      ...defaultPublicWikiCopy.countryPresenceBoard,
      ...(input?.countryPresenceBoard ?? {})
    },
    eraPage: { ...defaultPublicWikiCopy.eraPage, ...(input?.eraPage ?? {}) },
    categoryPage: { ...defaultPublicWikiCopy.categoryPage, ...(input?.categoryPage ?? {}) },
    articlePage: { ...defaultPublicWikiCopy.articlePage, ...(input?.articlePage ?? {}) }
  };
}

function mergeItemsBySlug<T extends { slug: string }>(defaults: T[], stored?: T[]) {
  if (!stored || stored.length === 0) {
    return defaults.map((item) => ({ ...item }));
  }

  const storedMap = new Map(stored.map((item) => [item.slug, item]));
  const defaultSlugs = new Set(defaults.map((item) => item.slug));

  return [
    ...defaults.map((item) => ({
      ...item,
      ...(storedMap.get(item.slug) ?? {})
    })),
    ...stored.filter((item) => !defaultSlugs.has(item.slug))
  ];
}

async function readLocalStore(): Promise<SiteConfigInput> {
  await ensureLocalStore();
  const content = await fs.readFile(localFilePath, "utf8");
  return JSON.parse(content) as SiteConfigInput;
}

async function writeLocalStore(store: WikiSiteConfig): Promise<void> {
  await ensureLocalStore();
  await fs.writeFile(localFilePath, JSON.stringify(store, null, 2));
}

async function ensureLocalStore(): Promise<void> {
  await fs.mkdir(path.dirname(localFilePath), { recursive: true });

  try {
    await fs.access(localFilePath);
  } catch {
    await fs.writeFile(localFilePath, JSON.stringify(defaultWikiSiteConfig, null, 2));
  }
}

async function deleteMissingSlugs(table: "timeline_eras" | "categories" | "blocs", slugs: string[]) {
  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase.from(table).select("slug");

  if (error) {
    throw new Error(explainSchemaError(error));
  }

  const existingSlugs = ((data ?? []) as Array<{ slug: string }>).map((row) => row.slug);
  const missingSlugs = existingSlugs.filter((slug) => !slugs.includes(slug));

  if (missingSlugs.length === 0) {
    return;
  }

  const { error: deleteError } = await supabase.from(table).delete().in("slug", missingSlugs);

  if (deleteError) {
    throw new Error(explainSchemaError(deleteError));
  }
}

function isMissingRelationError(error: { message?: string } | null | undefined) {
  return Boolean(
    error?.message?.includes("does not exist") ||
      error?.message?.includes("Could not find the table")
  );
}

function explainSchemaError(error: { message?: string }) {
  if (isMissingRelationError(error)) {
    return "Falta aplicar la migración de configuración pública en Supabase.";
  }

  return error.message ?? "Error desconocido de esquema.";
}
