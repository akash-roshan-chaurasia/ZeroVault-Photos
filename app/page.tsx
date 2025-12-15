import Link from 'next/link';
import { Lock, Unlock, Shield, Key, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center space-y-8 mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 mb-6 shadow-xl">
            <Shield className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            SecureFiles
          </h1>

          <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Enterprise-grade file encryption and decryption using military-standard RSA-4096 asymmetric encryption
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/encrypt">
              <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg">
                <Lock className="w-5 h-5 mr-2" />
                Encrypt Files
              </Button>
            </Link>
            <Link href="/decrypt">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg">
                <Unlock className="w-5 h-5 mr-2" />
                Decrypt Files
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <CardTitle className="text-xl">Military-Grade Security</CardTitle>
              <CardDescription className="text-base">
                RSA-4096 asymmetric encryption combined with AES-256-GCM ensures maximum security for your files
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-green-500">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <Key className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <CardTitle className="text-xl">Complete Control</CardTitle>
              <CardDescription className="text-base">
                You generate and manage your own keys. No keys are ever stored or transmitted to any server
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-orange-500">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-orange-600 dark:text-orange-300" />
              </div>
              <CardTitle className="text-xl">Multiple Files</CardTitle>
              <CardDescription className="text-base">
                Encrypt or decrypt multiple files at once. All file types supported with instant processing
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="shadow-xl bg-gradient-to-br from-blue-50 to-green-50 dark:from-slate-800 dark:to-slate-700 border-2">
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Generate Key Pair</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Create a secure RSA-4096 key pair. The public key encrypts files, while the private key decrypts them.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Encrypt Your Files</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Upload one or multiple files. Each file is encrypted using hybrid encryption for optimal security and performance.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Decrypt Anytime</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Upload encrypted files and use your private key to decrypt. View images instantly or download all files.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
