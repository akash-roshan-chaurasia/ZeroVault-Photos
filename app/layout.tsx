import './globals.css';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'SecureFiles - File Encryption & Decryption',
  description: 'Securely encrypt and decrypt files using RSA-4096 asymmetric encryption with AES-256-GCM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
