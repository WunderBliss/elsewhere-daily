import { MetadataRoute } from 'next'
import { getPublishedArticleSlugs } from '@/lib/db/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '')
  const slugs = await getPublishedArticleSlugs()

  return [
    { url: siteUrl, lastModified: new Date() },
    ...slugs.map((s) => ({
      url: `${siteUrl}/${s.slug}`,
      lastModified: new Date(),
    })),
  ]
}
