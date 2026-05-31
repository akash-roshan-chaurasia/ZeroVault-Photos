'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, Unlock, Upload, Key, 
  Image as ImageIcon, File, FileText, FileSpreadsheet, Film, Music, Archive,
  AlertCircle, Search, Sliders, ChevronLeft, ChevronRight, X, 
  ZoomIn, ZoomOut, Check, RefreshCw, Grid, Eye, Trash2
} from 'lucide-react';
import { decryptFile, downloadFile, type EncryptedFile } from '@/lib/encryption';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DecryptItem {
  id: string;
  file: File;
  status: 'pending' | 'decrypting' | 'decrypted' | 'failed';
  error?: string;
  fileName: string;
  decryptedData?: {
    blob: Blob;
    url: string;
    isImage: boolean;
  };
}

export default function DecryptPage() {
  const [decryptItems, setDecryptItems] = useState<DecryptItem[]>([]);
  const [privateKey, setPrivateKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [uploadMode, setUploadMode] = useState<'files' | 'folder'>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'others'>('all');
  const [gridSize, setGridSize] = useState<number>(4);
  const [isDragActive, setIsDragActive] = useState(false);

  // Lightbox State
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      decryptItems.forEach(item => {
        if (item.decryptedData?.url) {
          URL.revokeObjectURL(item.decryptedData.url);
        }
      });
    };
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLightboxIndex === null) return;
      if (e.key === 'ArrowRight') {
        handleNextLightbox();
      } else if (e.key === 'ArrowLeft') {
        handlePrevLightbox();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, decryptItems]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(Array.from(e.target.files));
    }
  };

  const processSelectedFiles = (filesArray: File[]) => {
    // Filter only json files
    const jsonFiles = filesArray.filter(file => 
      file.name.toLowerCase().endsWith('.json')
    );

    if (jsonFiles.length === 0) {
      setError('No encrypted JSON files (.json or .encrypted.json) were found in your selection.');
      return;
    }

    const items: DecryptItem[] = jsonFiles.map((file, idx) => {
      // Get a cleaner filename fallback before decryption
      let cleanName = file.name;
      if (cleanName.endsWith('.encrypted.json')) {
        cleanName = cleanName.substring(0, cleanName.length - 15);
      } else if (cleanName.endsWith('.json')) {
        cleanName = cleanName.substring(0, cleanName.length - 5);
      }

      return {
        id: `${file.name}-${idx}-${Date.now()}`,
        file,
        status: 'pending',
        fileName: cleanName,
      };
    });

    // Cleanup previous object URLs
    decryptItems.forEach(item => {
      if (item.decryptedData?.url) {
        URL.revokeObjectURL(item.decryptedData.url);
      }
    });

    setDecryptItems(items);
    setError('');
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Progressive Queue-based Decryption Engine
  const handleDecrypt = async () => {
    if (decryptItems.length === 0 || !privateKey) return;

    setIsProcessing(true);
    setError('');

    // Reset all items to pending status
    const resetItems = decryptItems.map(item => ({
      ...item,
      status: 'pending' as const,
      error: undefined,
    }));
    setDecryptItems(resetItems);

    const queue = [...resetItems];
    const concurrency = 3;
    let activeCount = 0;
    let currentIndex = 0;

    const runNext = async () => {
      if (currentIndex >= queue.length) {
        if (activeCount === 0) {
          setIsProcessing(false);
        }
        return;
      }

      const item = queue[currentIndex++];
      activeCount++;

      // Update state to decrypting
      setDecryptItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, status: 'decrypting' } : i))
      );

      try {
        const text = await item.file.text();
        const encryptedData: EncryptedFile = JSON.parse(text);

        const { blob, fileName } = await decryptFile(encryptedData, privateKey);
        const url = URL.createObjectURL(blob);
        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);

        setDecryptItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'decrypted',
                  fileName,
                  decryptedData: { blob, url, isImage },
                }
              : i
          )
        );
      } catch (err) {
        console.error(`Decryption failed for item ${item.file.name}:`, err);
        setDecryptItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, status: 'failed', error: 'Decryption failed. Invalid key or corrupted file.' }
              : i
          )
        );
      } finally {
        activeCount--;
        runNext();
      }
    };

    // Spawn concurrent workers
    for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
      runNext();
    }
  };

  const handleRetry = async (itemId: string) => {
    if (!privateKey) return;

    setDecryptItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, status: 'decrypting', error: undefined } : i))
    );

    const item = decryptItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      const text = await item.file.text();
      const encryptedData: EncryptedFile = JSON.parse(text);

      const { blob, fileName } = await decryptFile(encryptedData, privateKey);
      const url = URL.createObjectURL(blob);
      const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);

      setDecryptItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                status: 'decrypted',
                fileName,
                decryptedData: { blob, url, isImage },
              }
            : i
        )
      );
    } catch (err) {
      setDecryptItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? { ...i, status: 'failed', error: 'Decryption failed' }
            : i
        )
      );
    }
  };

  const handleDownload = (item: DecryptItem) => {
    if (item.decryptedData) {
      downloadFile(item.decryptedData.blob, item.fileName);
    }
  };

  const handleDownloadAll = () => {
    decryptItems.forEach(item => {
      if (item.status === 'decrypted' && item.decryptedData) {
        downloadFile(item.decryptedData.blob, item.fileName);
      }
    });
  };

  const handleClearAll = () => {
    // Revoke all object URLs
    decryptItems.forEach(item => {
      if (item.decryptedData?.url) {
        URL.revokeObjectURL(item.decryptedData.url);
      }
    });
    setDecryptItems([]);
    setError('');
    setIsProcessing(false);
  };

  // Stats Calculations
  const totalCount = decryptItems.length;
  const decryptedCount = decryptItems.filter(i => i.status === 'decrypted').length;
  const failedCount = decryptItems.filter(i => i.status === 'failed').length;
  const decryptingCount = decryptItems.filter(i => i.status === 'decrypting').length;
  const progressPercent = totalCount > 0 
    ? Math.round(((decryptedCount + failedCount) / totalCount) * 100) 
    : 0;

  // Filtered and Searched items list
  const filteredItems = decryptItems.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.file.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'images') {
      return matchesSearch && item.status === 'decrypted' && item.decryptedData?.isImage;
    }
    if (filterType === 'others') {
      return matchesSearch && (item.status !== 'decrypted' || !item.decryptedData?.isImage);
    }
    return matchesSearch;
  });

  // Extract only decrypted images for standard photo gallery navigation inside Lightbox
  const decryptedPhotos = decryptItems.filter(
    item => item.status === 'decrypted' && item.decryptedData?.isImage
  );

  const openLightbox = (itemId: string) => {
    const photoIdx = decryptedPhotos.findIndex(p => p.id === itemId);
    if (photoIdx !== -1) {
      setActiveLightboxIndex(photoIdx);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  const closeLightbox = () => {
    setActiveLightboxIndex(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleNextLightbox = () => {
    if (activeLightboxIndex === null || decryptedPhotos.length <= 1) return;
    setActiveLightboxIndex((activeLightboxIndex + 1) % decryptedPhotos.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePrevLightbox = () => {
    if (activeLightboxIndex === null || decryptedPhotos.length <= 1) return;
    setActiveLightboxIndex(
      (activeLightboxIndex - 1 + decryptedPhotos.length) % decryptedPhotos.length
    );
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Zooming & Panning logic
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handlePrevLightbox();
      } else {
        handleNextLightbox();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Mouse drag swiping / panning
  const handleLightboxMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else {
      setMouseStartX(e.clientX);
    }
  };

  const handleLightboxMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleLightboxMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    if (zoom === 1 && mouseStartX !== null) {
      const diffX = e.clientX - mouseStartX;
      if (Math.abs(diffX) > 60) {
        if (diffX > 0) {
          handlePrevLightbox();
        } else {
          handleNextLightbox();
        }
      }
      setMouseStartX(null);
    }
  };

  const getGridColsClass = (size: number) => {
    switch (size) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-2 md:grid-cols-3';
      case 4: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 5: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
      case 6: return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6';
      default: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
      case 'md':
        return <FileText className="w-10 h-10 text-blue-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-10 h-10 text-green-500" />;
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'flac':
      case 'm4a':
        return <Music className="w-10 h-10 text-purple-500" />;
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'mkv':
      case 'webm':
        return <Film className="w-10 h-10 text-red-500" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <Archive className="w-10 h-10 text-amber-500" />;
      default:
        return <File className="w-10 h-10 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 dark:from-green-900 dark:to-emerald-800 shadow-lg mb-4 animate-pulse">
            <Unlock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-600 dark:from-slate-100 dark:via-slate-200 dark:to-emerald-400">
            Secure Gallery & Decryption
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Paste your private key and upload files or directories to unlock your secure files in a Google Photos style layout.
          </p>
        </div>

        {/* Private Key Card */}
        <Card className="shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-850/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-850 dark:text-slate-150">
              <Key className="w-5 h-5 text-emerald-500 animate-bounce" />
              Step 1: Enter Your Private Key
            </CardTitle>
            <CardDescription className="font-semibold text-slate-500 dark:text-slate-400">
              Your key is only processed client-side inside your browser and is never stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200">
              <AlertDescription className="text-xs font-semibold leading-relaxed">
                Provide the private RSA PEM key. This key pair unwraps the unique AES encryption keys generated for each file.
              </AlertDescription>
            </Alert>
            <div className="relative group">
              <Textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;Paste your private key here..."
                className="font-mono text-[11px] h-32 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg shadow-inner resize-y transition-all"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dual Upload Mode Selector Card */}
        <Card className="shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-850/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-500" />
              Step 2: Upload Files or Select Folder
            </CardTitle>
            <CardDescription className="font-semibold text-slate-500 dark:text-slate-400">
              Choose to load specific files or select a folder to read all encrypted files at once recursively.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs 
              value={uploadMode} 
              onValueChange={(val) => {
                setUploadMode(val as 'files' | 'folder');
                setDecryptItems([]);
                setError('');
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 max-w-md mx-auto mb-6 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                <TabsTrigger 
                  value="files" 
                  className="rounded-lg py-2.5 font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-850 data-[state=active]:shadow-sm"
                >
                  <File className="w-4 h-4 mr-2" />
                  Select Files
                </TabsTrigger>
                <TabsTrigger 
                  value="folder" 
                  className="rounded-lg py-2.5 font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-850 data-[state=active]:shadow-sm"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Select Folder
                </TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="mt-0 focus-visible:outline-none">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive 
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 scale-[1.01]' 
                      : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/30'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className={`w-14 h-14 mx-auto mb-4 transition-transform duration-300 ${isDragActive ? 'text-emerald-500 scale-110 translate-y-[-4px]' : 'text-slate-400'}`} />
                  <p className="text-base font-bold text-slate-855 dark:text-slate-200">
                    Drag & Drop multiple files or click to browse
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Upload encrypted .json / .encrypted.json files. Select multiple files at once by holding Ctrl/Shift.
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".json,.encrypted.json"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  {decryptItems.length > 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm font-extrabold rounded-full animate-fade-in shadow-sm">
                      <Check className="w-4 h-4" />
                      {decryptItems.length} encrypted file(s) selected
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="folder" className="mt-0 focus-visible:outline-none">
                <div 
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/30 cursor-pointer transition-all duration-300"
                  onClick={() => folderInputRef.current?.click()}
                >
                  <Archive className="w-14 h-14 mx-auto mb-4 text-slate-400 hover:scale-105 transition-transform" />
                  <p className="text-base font-bold text-slate-855 dark:text-slate-200">
                    Click to select a Folder
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    The app will scan the chosen directory recursively and automatically gather all encrypted JSON files.
                  </p>
                  <input
                    type="file"
                    {...({ webkitdirectory: "", directory: "" } as any)}
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    ref={folderInputRef}
                  />
                  {decryptItems.length > 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm font-extrabold rounded-full animate-fade-in shadow-sm">
                      <Check className="w-4 h-4" />
                      Found {decryptItems.length} encrypted file(s) inside directory
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/15 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs font-bold leading-relaxed">{error}</AlertDescription>
              </Alert>
            )}

            {decryptItems.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleDecrypt}
                  disabled={!privateKey || isProcessing}
                  className="flex-1 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-750 text-white font-extrabold text-base shadow-lg rounded-xl shadow-green-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Decrypting files asynchronously... ({decryptedCount + failedCount}/{totalCount})
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5 mr-2 animate-pulse" />
                      Decrypt Files ({decryptItems.length})
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleClearAll} 
                  variant="outline" 
                  className="sm:w-auto py-6 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl font-bold active:scale-[0.99] transition-all"
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              </div>
            )}

            {/* Decryption Progress Bar */}
            {isProcessing && (
              <div className="space-y-2 mt-4 animate-fade-in bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Asynchronous Decryption Queue: Concurrency of 3</span>
                  <span>{progressPercent}% Complete ({decryptedCount + failedCount} of {totalCount})</span>
                </div>
                <Progress value={progressPercent} className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-450 mt-1">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block animate-ping"></span> Decrypting: {decryptingCount}</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450"><Check className="w-3.5 h-3.5" /> Decrypted: {decryptedCount}</span>
                  {failedCount > 0 && <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3.5 h-3.5" /> Failed: {failedCount}</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery Grid Section */}
        {decryptItems.length > 0 && (
          <Card className="shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/50 dark:border-slate-850/50 transition-all duration-350">
            <CardHeader className="border-b border-slate-100 dark:border-slate-850 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-slate-850 dark:text-slate-150 flex items-center gap-2">
                  <Grid className="w-6 h-6 text-emerald-500" />
                  Google Photos Decrypted Gallery
                </CardTitle>
                <CardDescription className="font-semibold text-slate-500 dark:text-slate-450">
                  Decrypted photos will appear in high-res thumbnail grids. Non-photo files are styled with customizable extensions.
                </CardDescription>
              </div>

              {/* Grid Size Slider */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 self-start md:self-auto min-w-[200px]">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-450 whitespace-nowrap">Grid Column: {gridSize}</span>
                <Slider
                  min={2}
                  max={6}
                  step={1}
                  value={[gridSize]}
                  onValueChange={(val) => setGridSize(val[0])}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800"
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Filter controls and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl self-start">
                  <Button
                    size="sm"
                    variant={filterType === 'all' ? 'default' : 'ghost'}
                    onClick={() => setFilterType('all')}
                    className="font-bold text-xs rounded-lg py-2.5 shadow-sm"
                  >
                    All Files ({decryptItems.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={filterType === 'images' ? 'default' : 'ghost'}
                    onClick={() => setFilterType('images')}
                    className="font-bold text-xs rounded-lg py-2.5 shadow-sm"
                  >
                    Photos ({decryptedPhotos.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={filterType === 'others' ? 'default' : 'ghost'}
                    onClick={() => setFilterType('others')}
                    className="font-bold text-xs rounded-lg py-2.5 shadow-sm"
                  >
                    Documents & Others ({decryptItems.length - decryptedPhotos.length})
                  </Button>
                </div>

                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by file name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Gallery Grid */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-950/20 border-2 border-dashed border-slate-200 dark:border-slate-850 rounded-2xl">
                  <Search className="w-12 h-12 mx-auto mb-3 text-slate-400 animate-bounce" />
                  <p className="text-base font-extrabold text-slate-600 dark:text-slate-400">
                    No matching files found
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-semibold">
                    Try adjusting your filters or query string.
                  </p>
                </div>
              ) : (
                <div className={`grid gap-4 transition-all duration-300 ${getGridColsClass(gridSize)}`}>
                  {filteredItems.map((item) => {
                    // PENDING STATE CARD
                    if (item.status === 'pending') {
                      return (
                        <div 
                          key={item.id} 
                          className="aspect-square flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl text-center group shadow-sm transition-all"
                        >
                          <Unlock className="w-8 h-8 text-slate-350 mb-2 transition-transform duration-350 group-hover:scale-110" />
                          <span className="text-[11px] font-bold text-slate-500 truncate max-w-full">{item.fileName}</span>
                          <span className="text-[9px] text-slate-400 mt-1 font-semibold">Pending Key...</span>
                        </div>
                      );
                    }

                    // DECRYPTING SKELETON STATE CARD
                    if (item.status === 'decrypting') {
                      return (
                        <div 
                          key={item.id} 
                          className="aspect-square flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl text-center shadow-sm relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/20 dark:via-slate-800/10 to-transparent -translate-x-full animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                          <span className="text-[11px] font-extrabold text-slate-655 truncate max-w-full">{item.fileName}</span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-450 mt-1.5 font-extrabold animate-pulse">Decrypting...</span>
                        </div>
                      );
                    }

                    // FAILED DECRYPTION STATE CARD
                    if (item.status === 'failed') {
                      return (
                        <div 
                          key={item.id} 
                          className="aspect-square flex flex-col items-center justify-center bg-red-50/30 dark:bg-red-950/10 border border-red-200 dark:border-red-900 p-4 rounded-2xl text-center relative group shadow-sm"
                        >
                          <AlertCircle className="w-9 h-9 text-red-500 mb-2 animate-bounce" />
                          <span className="text-[11px] font-extrabold text-red-700 dark:text-red-400 truncate max-w-full mb-1">{item.fileName}</span>
                          <span className="text-[9px] text-red-500 font-semibold mb-3 leading-tight">Failed decryption</span>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-8 text-[10px] px-3 font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg active:scale-95"
                            onClick={() => handleRetry(item.id)}
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
                          </Button>
                        </div>
                      );
                    }

                    // DECRYPTED IMAGE CARD
                    if (item.status === 'decrypted' && item.decryptedData?.isImage) {
                      return (
                        <div 
                          key={item.id} 
                          className="aspect-square group relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850/50 shadow-md cursor-pointer transition-all duration-350 hover:scale-[1.03] hover:shadow-xl"
                          onClick={() => openLightbox(item.id)}
                        >
                          <img
                            src={item.decryptedData.url}
                            alt={item.fileName}
                            className="w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-8 h-8 rounded-lg bg-black/45 hover:bg-black/70 text-white border-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(item);
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="text-left text-white drop-shadow-md">
                              <p className="text-xs font-bold truncate max-w-full">
                                {item.fileName}
                              </p>
                              <p className="text-[9px] font-semibold text-slate-300">
                                Image
                              </p>
                            </div>
                          </div>
                          
                          {/* Top corner Decrypted Check */}
                          <div className="absolute top-2.5 left-2.5 bg-emerald-500 text-white rounded-full p-1 shadow-md border border-white/25">
                            <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          </div>
                        </div>
                      );
                    }

                    // DECRYPTED NON-IMAGE CARD
                    return (
                      <div 
                        key={item.id} 
                        className="aspect-square group relative flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl text-center shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-350 cursor-pointer"
                        onClick={() => handleDownload(item)}
                      >
                        <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 group-hover:rotate-1 transition-transform border border-slate-200/30 dark:border-slate-800/30">
                          {getFileIcon(item.fileName)}
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-250 truncate max-w-full px-1">{item.fileName}</span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-1">Ready to download</span>

                        {/* Top corner Decrypted Check */}
                        <div className="absolute top-2.5 left-2.5 bg-emerald-500 text-white rounded-full p-1 shadow-md border border-white/25">
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </div>

                        {/* Hover Overlay for files */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                          <Button
                            size="sm"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-9 rounded-xl shadow-md flex items-center justify-center gap-1.5 animate-fade-in"
                          >
                            <Download className="w-4 h-4" /> Download
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bulk Download Section */}
              {decryptedCount > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <p className="text-sm font-bold text-slate-655 dark:text-slate-400">
                    Successfully decrypted {decryptedCount} of {totalCount} files!
                  </p>
                  <Button 
                    onClick={handleDownloadAll} 
                    className="w-full sm:w-auto py-5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All Decrypted ({decryptedCount})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FULLSCREEN LIGHTBOX GALLERY MODAL */}
        {activeLightboxIndex !== null && decryptedPhotos[activeLightboxIndex] && (() => {
          const activePhoto = decryptedPhotos[activeLightboxIndex];
          return (
            <div 
              className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/98 backdrop-blur-lg animate-fade-in transition-all"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Header Panel */}
              <div className="w-full bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between z-10 text-white select-none">
                <div>
                  <h3 className="text-base font-extrabold truncate max-w-[250px] sm:max-w-md">
                    {activePhoto.fileName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    Photo {activeLightboxIndex + 1} of {decryptedPhotos.length}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-black/45 backdrop-blur-md rounded-xl p-1 border border-white/10">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-9 h-9 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg"
                    onClick={handleZoomOut}
                    disabled={zoom === 1}
                  >
                    <ZoomOut className="w-5 h-5" />
                  </Button>
                  <span className="text-xs font-bold px-2 select-none">{Math.round(zoom * 100)}%</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-9 h-9 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg"
                    onClick={handleZoomIn}
                    disabled={zoom === 4}
                  >
                    <ZoomIn className="w-5 h-5" />
                  </Button>
                  <div className="w-px h-6 bg-white/10 mx-1"></div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-9 h-9 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg"
                    onClick={() => handleDownload(activePhoto)}
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-9 h-9 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg"
                    onClick={closeLightbox}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Main Content Area */}
              <div 
                className="flex-1 w-full flex items-center justify-center relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
                onMouseDown={handleLightboxMouseDown}
                onMouseMove={handleLightboxMouseMove}
                onMouseUp={handleLightboxMouseUp}
              >
                {/* Previous Button */}
                {decryptedPhotos.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevLightbox();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white active:scale-95 transition-all outline-none"
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </button>
                )}

                {/* Main Rendered Image */}
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={activePhoto.decryptedData?.url}
                    alt={activePhoto.fileName}
                    className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200 ease-out select-none pointer-events-none"
                    style={{
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                    }}
                  />
                </div>

                {/* Next Button */}
                {decryptedPhotos.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextLightbox();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white active:scale-95 transition-all outline-none"
                  >
                    <ChevronRight className="w-7 h-7" />
                  </button>
                )}
              </div>

              {/* Footer Panel / Navigation Carousel */}
              {decryptedPhotos.length > 1 && (
                <div className="w-full bg-gradient-to-t from-black/85 to-transparent p-4 z-10 select-none border-t border-white/5">
                  <div className="max-w-2xl mx-auto flex items-center justify-center gap-2.5 overflow-x-auto py-2">
                    {decryptedPhotos.map((photo, i) => (
                      <div
                        key={photo.id}
                        onClick={() => {
                          setActiveLightboxIndex(i);
                          setZoom(1);
                          setPan({ x: 0, y: 0 });
                        }}
                        className={`w-14 h-14 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-200 border-2 ${
                          i === activeLightboxIndex 
                            ? 'border-emerald-500 scale-108 shadow-emerald-500/35 shadow-lg' 
                            : 'border-white/20 opacity-45 hover:opacity-100 hover:border-white/50'
                        }`}
                      >
                        <img
                          src={photo.decryptedData?.url}
                          alt="thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
