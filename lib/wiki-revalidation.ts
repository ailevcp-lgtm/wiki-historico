import { revalidatePath } from "next/cache";

import { getNavigationData } from "@/lib/repository";
import type { Article, Country } from "@/types/wiki";

type ArticlePathTarget = Pick<Article, "slug" | "categorySlugs" | "eraSlug" | "blocSlugs">;
type CountryPathTarget = Pick<Country, "slug" | "bloc">;

export async function revalidateArticlePaths(target: ArticlePathTarget | ArticlePathTarget[]) {
  const targets = Array.isArray(target) ? target : [target];

  revalidateCorePaths();

  for (const article of targets) {
    revalidatePath(`/admin/articles/${article.slug}`);
    revalidatePath(`/article/${article.slug}`);

    if (article.eraSlug) {
      revalidatePath(`/era/${article.eraSlug}`);
    }

    for (const blocSlug of article.blocSlugs ?? []) {
      revalidatePath(`/bloc/${blocSlug}`);
    }

    for (const categorySlug of article.categorySlugs) {
      revalidatePath(`/category/${categorySlug}`);
    }
  }

  await revalidateNavigationDrivenPaths();
}

export async function revalidateCountryPaths(target: CountryPathTarget | CountryPathTarget[]) {
  const targets = Array.isArray(target) ? target : [target];

  revalidateCorePaths();
  revalidatePath("/countries");

  for (const country of targets) {
    revalidatePath(`/admin/countries/${country.slug}`);
    revalidatePath(`/country/${country.slug}`);

    if (country.bloc) {
      revalidatePath(`/bloc/${country.bloc}`);
    }
  }
}

export async function revalidateCorePaths() {
  revalidatePath("/");
  revalidatePath("/timeline");
  revalidatePath("/search");
  revalidatePath("/countries");
  revalidatePath("/admin");
  revalidatePath("/admin/import");
  revalidatePath("/admin/articles");
  revalidatePath("/admin/countries");
  revalidatePath("/admin/review");
}

async function revalidateNavigationDrivenPaths() {
  const navigation = await getNavigationData();

  for (const era of navigation.eras) {
    revalidatePath(`/era/${era.slug}`);
  }

  for (const category of navigation.categories) {
    revalidatePath(`/category/${category.slug}`);
  }
}
