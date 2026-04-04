import type { MetadataRoute } from "next";

import {
  getCountryDirectory,
  getNavigationData,
  getPublishedArticles
} from "@/lib/repository";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [navigation, articles, countries] = await Promise.all([
    getNavigationData(),
    getPublishedArticles(),
    getCountryDirectory()
  ]);
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: absoluteUrl("/timeline"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: absoluteUrl("/countries"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9
    },
    ...navigation.eras.map((era) => ({
      url: absoluteUrl(`/era/${era.slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...navigation.categories.map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.75
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/article/${article.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.85
    })),
    ...countries.map((country) => ({
      url: absoluteUrl(`/country/${country.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
