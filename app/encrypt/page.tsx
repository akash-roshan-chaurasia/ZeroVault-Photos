'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Lock, Upload, Key, Copy, Check, Plus } from 'lucide-react';
import {
  generateKeyPair,
  encryptFile,
  downloadEncryptedFile,
  type EncryptedFile,
  type EncryptionKeys,
} from '@/lib/encryption';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { supabase, type KeyPair } from '@/lib/supabase';

export default function EncryptPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<FileList | null>(null);
  const [keys, setKeys] = useState<EncryptionKeys | null>(null);
  const [encryptedFiles, setEncryptedFiles] = useState<EncryptedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [savedKeypairs, setSavedKeypairs] = useState<KeyPair[]>([]);
  const [selectedKeypairId, setSelectedKeypairId] = useState<string>('');
  const [useNewKeypair, setUseNewKeypair] = useState(false);
  const [manualPublicKey, setManualPublicKey] = useState('');
  const [useManualKey, setUseManualKey] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadSavedKeypairs();
    }
  }, [user, authLoading]);

  const loadSavedKeypairs = async () => {
    const { data, error } = await supabase
      .from('user_keypairs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading keypairs:', error);
    } else {
      setSavedKeypairs(data || []);
    }
  };

  const handleKeypairSelection = (keypairId: string) => {
    if (keypairId === 'new') {
      setUseNewKeypair(true);
      setUseManualKey(false);
      setKeys(null);
      setSelectedKeypairId('');
      setManualPublicKey('');
    } else if (keypairId === 'manual') {
      setUseNewKeypair(false);
      setUseManualKey(true);
      setSelectedKeypairId('');
      setKeys(null);
      setManualPublicKey('');
    } else {
      setUseNewKeypair(false);
      setUseManualKey(false);
      setSelectedKeypairId(keypairId);
      const keypair = savedKeypairs.find(k => k.id === keypairId);
      if (keypair) {
        setKeys({
          publicKey: keypair.public_key,
          privateKey: '',
        });
        setManualPublicKey('');
      }
    }
  };

  const handleManualPublicKeyChange = (publicKey: string) => {
    setManualPublicKey(publicKey);
    if (publicKey.trim()) {
      setKeys({
        publicKey: publicKey,
        privateKey: '',
      });
    } else {
      setKeys(null);
    }
  };

  const handleGenerateKeys = async () => {
    setIsProcessing(true);
    try {
      const keyPair = await generateKeyPair();
      setKeys(keyPair);
    } catch (error) {
      console.error('Key generation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleEncrypt = async () => {
    if (!files || !keys) return;

    setIsProcessing(true);
    const encrypted: EncryptedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const encryptedFile = await encryptFile(file, keys.publicKey);
        encrypted.push(encryptedFile);
      }
      setEncryptedFiles(encrypted);
    } catch (error) {
      console.error('Encryption failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = () => {
    encryptedFiles.forEach((file) => {
      downloadEncryptedFile(file);
    });
  };

  const copyToClipboard = async (text: string, type: 'public' | 'private') => {
    await navigator.clipboard.writeText(text);
    if (type === 'public') {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    } else {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-300" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            File Encryption
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Securely encrypt your files using RSA-4096 asymmetric encryption with AES-256-GCM
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Step 1: Select or Generate Encryption Keys
            </CardTitle>
            <CardDescription>
              {user ? 'Use a saved keypair or generate a new one' : 'Generate a new keypair (sign in to save keypairs)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Choose Key Source
              </label>
              <Select onValueChange={handleKeypairSelection} defaultValue={(user && savedKeypairs.length > 0) ? "" : "new"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a saved keypair or generate new" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Generate New Keypair
                    </div>
                  </SelectItem>
                  <SelectItem value="manual">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Use Existing Public Key
                    </div>
                  </SelectItem>
                  {savedKeypairs.map((keypair) => (
                    <SelectItem key={keypair.id} value={keypair.id}>
                      {keypair.keypair_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {useManualKey && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                  Paste Existing Public Key
                </label>
                <Textarea
                  value={manualPublicKey}
                  onChange={(e) => handleManualPublicKeyChange(e.target.value)}
                  placeholder="Paste a public key here to encrypt files..."
                  className="font-mono text-xs h-32"
                />
                {!manualPublicKey.trim() && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Public key is required to proceed
                  </p>
                )}
              </div>
            )}

            {(useNewKeypair || (!useManualKey && !selectedKeypairId && savedKeypairs.length === 0)) && (
              <Button
                onClick={handleGenerateKeys}
                disabled={isProcessing}
                className="w-full sm:w-auto"
                size="lg"
              >
                <Key className="w-4 h-4 mr-2" />
                Generate Key Pair
              </Button>
            )}

            {!user && (
              <Alert>
                <AlertDescription>
                  <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Sign in
                  </Link>
                  {' '}to save and manage your keypairs
                </AlertDescription>
              </Alert>
            )}

            {keys && (
              <div className="space-y-4 mt-6">
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {useManualKey ? 'Public key loaded successfully!' : selectedKeypairId ? 'Keypair loaded successfully!' : 'Keys generated successfully! Save your private key securely - you\'ll need it for decryption.'}
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Public Key (use for encryption)
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(keys.publicKey, 'public')}
                      >
                        {copiedPublic ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={keys.publicKey}
                      readOnly
                      className="font-mono text-xs h-32"
                    />
                  </div>

                  {!useManualKey && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Private Key (keep this secret!)
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(keys.privateKey, 'private')}
                        >
                          {copiedPrivate ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        value={keys.privateKey}
                        readOnly
                        className="font-mono text-xs h-32"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Step 2: Select Files to Encrypt
            </CardTitle>
            <CardDescription>
              Choose one or multiple files to encrypt. All file types are supported.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={!keys}
                className="cursor-pointer"
              />
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                {files
                  ? `${files.length} file(s) selected`
                  : 'Select files to encrypt'}
              </p>
            </div>

            <Button
              onClick={handleEncrypt}
              disabled={!files || !keys || isProcessing}
              className="w-full"
              size="lg"
            >
              <Lock className="w-4 h-4 mr-2" />
              {isProcessing ? 'Encrypting...' : 'Encrypt Files'}
            </Button>
          </CardContent>
        </Card>

        {encryptedFiles.length > 0 && (
          <Card className="shadow-lg border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Download className="w-5 h-5" />
                Step 3: Download Encrypted Files
              </CardTitle>
              <CardDescription>
                Your files have been encrypted successfully. Download them now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {encryptedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-green-600 dark:text-green-300" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {file.fileName}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Encrypted
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadEncryptedFile(file)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleDownloadAll} className="w-full" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download All Encrypted Files
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
