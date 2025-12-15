'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Unlock, Upload, Key, Image as ImageIcon, File } from 'lucide-react';
import { decryptFile, downloadFile, type EncryptedFile } from '@/lib/encryption';
import { Textarea } from '@/components/ui/textarea';

interface DecryptedFile {
  fileName: string;
  blob: Blob;
  url: string;
  isImage: boolean;
}

export default function DecryptPage() {
  const [encryptedFiles, setEncryptedFiles] = useState<File[]>([]);
  const [privateKey, setPrivateKey] = useState('');
  const [decryptedFiles, setDecryptedFiles] = useState<DecryptedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setEncryptedFiles(filesArray);
      setError('');
    }
  };

  const handleDecrypt = async () => {
    if (encryptedFiles.length === 0 || !privateKey) return;

    setIsProcessing(true);
    setError('');
    const decrypted: DecryptedFile[] = [];

    try {
      for (const file of encryptedFiles) {
        const text = await file.text();
        const encryptedData: EncryptedFile = JSON.parse(text);

        const { blob, fileName } = await decryptFile(encryptedData, privateKey);
        const url = URL.createObjectURL(blob);

        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);

        decrypted.push({
          fileName,
          blob,
          url,
          isImage,
        });
      }
      setDecryptedFiles(decrypted);
    } catch (err) {
      console.error('Decryption failed:', err);
      setError('Decryption failed. Please check your private key and encrypted files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (file: DecryptedFile) => {
    downloadFile(file.blob, file.fileName);
  };

  const handleDownloadAll = () => {
    decryptedFiles.forEach((file) => {
      downloadFile(file.blob, file.fileName);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <Unlock className="w-8 h-8 text-green-600 dark:text-green-300" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            File Decryption
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Decrypt your encrypted files using your private key
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Step 1: Select or Enter Your Private Key
            </CardTitle>
            <CardDescription>
              Paste your private key to decrypt files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                Private keys are never stored on the server. Enter the private key you saved when generating your keypair.
              </AlertDescription>
            </Alert>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Private Key
              </label>
              <Textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Paste your private key here..."
                className="font-mono text-xs h-32"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Step 2: Upload Encrypted Files
            </CardTitle>
            <CardDescription>
              Select the encrypted JSON files you want to decrypt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-green-400 dark:hover:border-green-500 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <Input
                type="file"
                multiple
                accept=".json,.encrypted.json"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                {encryptedFiles.length > 0
                  ? `${encryptedFiles.length} file(s) selected`
                  : 'Select encrypted files to decrypt'}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleDecrypt}
              disabled={encryptedFiles.length === 0 || !privateKey || isProcessing}
              className="w-full"
              size="lg"
            >
              <Unlock className="w-4 h-4 mr-2" />
              {isProcessing ? 'Decrypting...' : 'Decrypt Files'}
            </Button>
          </CardContent>
        </Card>

        {decryptedFiles.length > 0 && (
          <Card className="shadow-lg border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Download className="w-5 h-5" />
                Step 3: View and Download Decrypted Files
              </CardTitle>
              <CardDescription>
                Your files have been decrypted successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {decryptedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          {file.isImage ? (
                            <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-300" />
                          ) : (
                            <File className="w-5 h-5 text-green-600 dark:text-green-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {file.fileName}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Decrypted
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    {file.isImage && (
                      <div className="mt-4 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 p-4">
                        <img
                          src={file.url}
                          alt={file.fileName}
                          className="max-w-full h-auto mx-auto rounded-lg shadow-md"
                          style={{ maxHeight: '400px' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={handleDownloadAll} className="w-full" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download All Decrypted Files
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
