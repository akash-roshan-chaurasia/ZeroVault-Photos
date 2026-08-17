import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://akash-roshan-chaurasia.github.io/ZeroVault-Photos/sitemap.xml',
  };
}
