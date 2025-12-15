'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Key, Plus, Trash2, Copy, Check, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase, type KeyPair } from '@/lib/supabase';
import { generateKeyPair } from '@/lib/encryption';

export default function KeyPairsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [keypairs, setKeypairs] = useState<KeyPair[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeypairName, setNewKeypairName] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadKeypairs();
    }
  }, [user]);

  const loadKeypairs = async () => {
    const { data, error } = await supabase
      .from('user_keypairs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading keypairs:', error);
    } else {
      setKeypairs(data || []);
    }
  };

  const handleGenerateKeypair = async () => {
    if (!newKeypairName.trim()) {
      setError('Please enter a name for the keypair');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const keys = await generateKeyPair();

      const { error } = await supabase
        .from('user_keypairs')
        .insert({
          user_id: user!.id,
          keypair_name: newKeypairName,
          public_key: keys.publicKey,
        });

      if (error) {
        setError(error.message);
      } else {
        setNewKeypairName('');
        setShowDialog(false);
        await loadKeypairs();
      }
    } catch (err) {
      setError('Failed to generate keypair');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteKeypair = async (id: string) => {
    if (!confirm('Are you sure you want to delete this keypair? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('user_keypairs')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting keypair: ' + error.message);
    } else {
      await loadKeypairs();
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-lg text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              My Public Keys
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
              Store and manage your public keys. Private keys are never stored on the server.
            </p>
          </div>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Generate New Keypair
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New Public Key</DialogTitle>
                <DialogDescription>
                  Create a new RSA-4096 public key. Save the private key securely - it will not be stored on the server.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="keypair-name">Keypair Name</Label>
                  <Input
                    id="keypair-name"
                    placeholder="e.g., Personal Documents, Work Files"
                    value={newKeypairName}
                    onChange={(e) => setNewKeypairName(e.target.value)}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleGenerateKeypair}
                  disabled={isGenerating}
                  className="w-full"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Keypair'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {keypairs.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Key className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No keypairs yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Generate your first keypair to start encrypting files
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Keypair
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {keypairs.map((keypair) => (
              <Card key={keypair.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        {keypair.keypair_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        Created {new Date(keypair.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteKeypair(keypair.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Public Key</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(keypair.public_key, `public-${keypair.id}`)}
                      >
                        {copiedId === `public-${keypair.id}` ? (
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
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                      <p className="font-mono text-xs text-slate-600 dark:text-slate-400 break-all line-clamp-2">
                        {keypair.public_key}
                      </p>
                    </div>
                  </div>

                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                      Your private key was never stored. Manage it securely in your local system.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
