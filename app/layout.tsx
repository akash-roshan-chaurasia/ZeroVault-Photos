import './globals.css';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://zerovault-photos.github.io'),
  title: {
    default: 'ZeroVault Photos - Encrypted Media & File Gallery',
    template: '%s | ZeroVault Photos',
  },
  description:
    'Zero-knowledge photo gallery & file vault powered by RSA-4096 asymmetric encryption & AES-256-GCM. View and manage encrypted photos locally in browser memory.',
  keywords: [
    'Zero-Knowledge Photo Vault',
    'Encrypted Google Photos Alternative',
    'Client-Side Media Encryption',
    'RSA 4096 File Encryption',
    'AES 256 GCM Browser Decryptor',
    'Private Photo Gallery',
    'Sovereign Cloud Storage',
    'Local File Vault',
  ],
  authors: [{ name: 'ZeroVault Team' }],
  creator: 'ZeroVault',
  publisher: 'ZeroVault',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://zerovault-photos.github.io',
    siteName: 'ZeroVault Photos',
    title: 'ZeroVault Photos - Zero-Knowledge Encrypted Photo Gallery',
    description:
      'Store and view encrypted photos & files with Google Photos style UI using local RSA-4096 & AES-256-GCM cryptography.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZeroVault Photos - Zero-Knowledge Encrypted Photo Gallery',
    description:
      'Client-side encrypted media gallery. Your private keys & photos never touch cloud servers.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://zerovault-photos.github.io/#webapp',
      'name': 'ZeroVault Photos',
      'url': 'https://zerovault-photos.github.io',
      'applicationCategory': 'SecurityApplication',
      'operatingSystem': 'Any (Web Browser)',
      'browserRequirements': 'Requires JavaScript and Web Crypto API support',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
      },
      'description':
        'Zero-knowledge photo gallery & file vault powered by RSA-4096 asymmetric encryption & AES-256-GCM.',
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://zerovault-photos.github.io/#faq',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'What is ZeroVault Photos?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text':
              'ZeroVault Photos is an open-source, zero-knowledge media gallery and file vault that encrypts photos and documents locally using RSA-4096 and AES-256-GCM cryptography while providing a Google Photos style viewing experience.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Is ZeroVault Photos truly zero-knowledge?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text':
              'Yes. All encryption and decryption operations take place entirely inside your web browser using the native Web Crypto API. Private keys and unencrypted file contents are never transmitted to or stored on any server.',
          },
        },
        {
          '@type': 'Question',
          'name': 'How does ZeroVault encrypt my files?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text':
              'ZeroVault uses hybrid cryptography: each file is encrypted with a unique AES-256-GCM symmetric key, and that AES key is wrapped with your 4096-bit RSA public key. Only your RSA private key can unwrap the AES keys and decrypt your media.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Can I view encrypted photos like Google Photos?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text':
              'Yes. ZeroVault features a built-in interactive media gallery with lightboxes, zoom/pan controls, swipe gestures, search filters, and grid column resizing that renders your decrypted photos in browser memory.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
