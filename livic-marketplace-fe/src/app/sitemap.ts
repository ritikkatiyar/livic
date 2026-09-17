import { MetadataRoute } from 'next';
import { MOCK_PROPERTIES } from '@/api/mock/properties.mock';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_MARKETPLACE_BASE_URL || 'https://livic.app/market-place';

  const propertyEntries: MetadataRoute.Sitemap = MOCK_PROPERTIES.map((prop) => ({
    url: `${baseUrl}/${prop.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const roomEntries: MetadataRoute.Sitemap = MOCK_PROPERTIES.flatMap((prop) =>
    prop.units.map((unit) => ({
      url: `${baseUrl}/${prop.id}/rooms/${unit.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    }))
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...propertyEntries,
    ...roomEntries,
  ];
}
