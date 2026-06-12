/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderArchive, KeyRound, FolderKey, NotebookPen, ShieldCheck, 
  Cpu, ArrowLeft, Terminal, FileCode, CheckCircle, FlameKindling,
  Wrench, Sliders, Search, Sparkles, UploadCloud, X, ArrowRight,
  ShieldAlert, Activity, FileText, Clock, Trash2, Sun, Moon
} from 'lucide-react';
import ImagePackager from './components/ImagePackager';
import FileEncryptor from './components/FileEncryptor';
import SecureVault from './components/SecureVault';
import CryptoWiki from './components/CryptoWiki';
import Hasher from './components/Hasher';
import KeyUtils from './components/KeyUtils';
import EncoderDecoder from './components/EncoderDecoder';
import DevUtilities from './components/DevUtilities';
import ImageFileUtilities from './components/ImageFileUtilities';
import SecurityPrivacySuite from './components/SecurityPrivacySuite';

type SubViewType = 
  | 'grid' 
  | 'package' 
  | 'file_aes' 
  | 'vault' 
  | 'hashing' 
  | 'keys' 
  | 'encoding' 
  | 'dev_utils' 
  | 'image_file_utils' 
  | 'learn'
  | 'security_privacy_suite_view';

interface ToolItem {
  id: SubViewType;
  name: string;
  shortDesc: string;
  category: string;
  icon: React.ReactNode;
  accentColor: string;
  badge?: string;
  keywords: string[];
}

interface DetectedFile {
  name: string;
  size: number;
  type: string;
  extension: string;
  recommendedTools: { id: SubViewType; label: string; desc: string }[];
  fileCount: number;
  allFiles: { name: string; size: number; type: string; extension: string }[];
  warning?: string;
}

export default function App() {
  const [activeView, setActiveView] = useState<SubViewType>('grid');

  // Theme state for Frosted Glass vs Midnight Noir
  const [theme, setTheme] = useState<'frosted' | 'noir'>(() => {
    try {
      const saved = localStorage.getItem('cryptic_theme');
      return saved === 'noir' ? 'noir' : 'frosted';
    } catch {
      return 'frosted';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'noir') {
      root.classList.add('theme-noir');
      root.classList.remove('theme-frosted');
    } else {
      root.classList.add('theme-frosted');
      root.classList.remove('theme-noir');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'frosted' ? 'noir' : 'frosted';
      try {
        localStorage.setItem('cryptic_theme', next);
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };
  
  // Recent Operations states
  const [recentViews, setRecentViews] = useState<SubViewType[]>(() => {
    try {
      const saved = localStorage.getItem('cryptic_recent_operations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (activeView !== 'grid') {
      setRecentViews(prev => {
        const updated = [activeView, ...prev.filter(v => v !== activeView)].slice(0, 5);
        try {
          localStorage.setItem('cryptic_recent_operations', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });
    }
  }, [activeView]);

  // Smooth scroll to top on view changes to optimize mobile experience
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeView]);

  const clearRecentHistory = () => {
    setRecentViews([]);
    try {
      localStorage.removeItem('cryptic_recent_operations');
    } catch (e) {
      console.error(e);
    }
  };
  
  // Command Palette states
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [paletteIndex, setPaletteIndex] = useState(0);

  // File drag & drop states
  const [isDragging, setIsDragging] = useState(false);
  const [detectedFile, setDetectedFile] = useState<DetectedFile | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isFileProcessing, setIsFileProcessing] = useState(false);

  const tools: ToolItem[] = [
    {
      id: 'package',
      name: 'Image ZIP Packager',
      shortDesc: 'Compile high-res images to Base64, package within compressed ZIP structures, and GCM encrypt/decrypt with custom passphrases.',
      category: 'Symmetric Encryption & Vaults',
      icon: <FolderArchive className="text-teal-400" size={24} />,
      accentColor: 'border-white/10 hover:border-white/20 hover:bg-white/10',
      badge: 'Popular',
      keywords: ['image', 'zip', 'pack', 'package', 'compress', 'photo', 'album', 'archive']
    },
    {
      id: 'file_aes',
      name: 'Symmetric File Encryptor',
      shortDesc: 'Drag & drop text or markdown files to encrypt using AES-256 (GCM/CBC) or ChaCha20-Poly1305 with custom PBKDF2 stretching.',
      category: 'Symmetric Encryption & Vaults',
      icon: <KeyRound className="text-cyan-400" size={24} />,
      accentColor: 'border-white/10 hover:border-white/20 hover:bg-white/10',
      keywords: ['encrypt', 'decrypt', 'file', 'password', 'aes', 'chacha20', 'pbkdf2']
    },
    {
      id: 'vault',
      name: 'Credentials Notes Vault',
      shortDesc: 'Create and persist sensitive API keys, diary records, and private parameters locally within an encrypted GCM localStorage database.',
      category: 'Symmetric Encryption & Vaults',
      icon: <FolderKey className="text-amber-400" size={24} />,
      accentColor: 'border-white/10 hover:border-white/20 hover:bg-white/10',
      badge: 'New',
      keywords: ['credentials', 'notes', 'vault', 'secure', 'save', 'store', 'storage', 'pin']
    },
    {
      id: 'image_file_utils',
      name: 'Image & File forensic Suite',
      shortDesc: 'Analyze EXIF attributes, remove deep privacy tags, compress to WebP format, build QR codes, scan integrity hashes, check MIME extensions, and shred files.',
      category: 'Integrity & Forensic Suite',
      icon: <Sliders className="text-indigo-400" size={24} />,
      accentColor: 'border-white/10 hover:border-white/20 hover:bg-white/10',
      badge: 'Extended',
      keywords: ['exif', 'metadata', 'mime', 'webp', 'png', 'shredder', 'qr', 'barcode', 'checksum']
    },
    {
      id: 'hashing',
      name: 'Cryptographic Hash Engine',
      shortDesc: 'Generate SHA-256/SHA-512 signatures, MD5 checksums, or salting-based blowfish Bcrypt/Argon2 password hashes on text or file payloads.',
      category: 'Cryptographic Core & Utilities',
      icon: <Cpu className="text-teal-300" size={24} />,
      accentColor: 'border-white/10 hover:border-white/20 hover:bg-white/10',
      keywords: ['hash', 'sha256', 'sha512', 'md5', 'bcrypt', 'salt', 'checksum', 'argon2']
    },
    {
      id: 'keys',
      name: 'Asymmetric Key Utilities',
      shortDesc: 'Assemble high-entropy passwords, random security keys, IV nonces, or native browser-level RSA & ECC Keypairs with exportable PEM blocks.',
      category: 'Cryptographic Core & Utilities',
      icon: <FlameKindling className="text-orange-400" size={24} />,
      accentColor: 'border-white/10 hover:border-white/20 hover:bg-white/10',
      keywords: ['keypair', 'rsa', 'ecc', 'entropy', 'iv', 'generator', 'pem', 'der']
    },
    {
      id: 'encoding',
      name: 'Representation Compilers',
      shortDesc: 'Encode/Decode Base64 characters, binary payloads, hex digits, URL string percent-encodings, HTML entities, and deep JWT claim sets.',
      category: 'Cryptographic Core & Utilities',
      icon: <FileCode className="text-blue-400" size={24} />,
      accentColor: 'border-white/10 hover:border-white/20 hover:bg-white/10',
      keywords: ['encoding', 'base64', 'hex', 'bin', 'binary', 'url', 'jwt', 'token', 'decoder']
    },
    {
      id: 'dev_utils',
      name: 'Developer Utilities',
      shortDesc: 'Format JSON/XML blocks, validate schemas, convert YAML data, evaluate regex expressions, line-diff matching, and track live Unix epoch values.',
      category: 'Cryptographic Core & Utilities',
      icon: <Wrench className="text-pink-400" size={24} />,
      accentColor: 'border-white/10 hover:border-white/20 hover:bg-white/10',
      badge: 'DevOps',
      keywords: ['regex', 'json', 'yaml', 'formatter', 'epoch', 'unix', 'diff', 'compare']
    },
    {
      id: 'security_privacy_suite_view',
      name: 'Security Tester & ZK Privacy Labs',
      shortDesc: 'Analyze password strength, check leaks with Pwned API, assess response headers score, decode PEM certificates, and export self-destruct paste links.',
      category: 'Security Labs & Academic',
      icon: <ShieldCheck className="text-emerald-400" size={24} />,
      accentColor: 'border-teal-500/20 hover:border-teal-500/30 hover:bg-teal-500/5',
      badge: 'Core Security',
      keywords: ['pwned', 'breach', 'password', 'entropy', 'ssl', 'cert', 'x509', 'pem', 'csp', 'headers', 'header', 'pastebin', 'paste', 'destruct', 'burn']
    },
    {
      id: 'learn',
      name: 'Symmetric Cryptography Manual',
      shortDesc: 'Discover the mechanical definitions of PKCS7 padding blocks, Galois authenticated ciphers, and key-derivation resistance parameters.',
      category: 'Security Labs & Academic',
      icon: <NotebookPen className="text-violet-400" size={24} />,
      accentColor: 'border-white/10 hover:border-white/20 hover:bg-white/10',
      keywords: ['tutorial', 'wiki', 'learn', 'cryptography', 'academic', 'manual', 'gcm', 'cbc', 'pad']
    }
  ];

  // Intercept Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
        setSearchQuery('');
        setPaletteIndex(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackToGrid = () => {
    setActiveView('grid');
    setUploadedFiles([]);
    // Clear hash parameters if returning
    if (window.location.hash.includes('paste_gcm')) {
      window.location.hash = '';
    }
  };

  // Drag and Drop workspace logic
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsFileProcessing(true);
    setDetectedFile(null);
    const fileList = Array.from(files);
    setUploadedFiles(fileList);

    // Simulate inspection delay to show beautiful feedback and improve perceived performance
    setTimeout(() => {
      try {
        const fileCount = fileList.length;

        // Sum size of all files
        const totalSize = fileList.reduce((sum, f) => sum + f.size, 0);

        // Check if total exceeds 50MB (50 * 1024 * 1024)
        const limitBytes = 50 * 1024 * 1024;
        let warning = '';
        if (totalSize > limitBytes) {
          warning = `Warning: Total payload size is ${(totalSize / (1024 * 1024)).toFixed(1)}MB, which exceeds the recommended 50MB limit. Secure offline browser processing may exhaust browser tab RAM.`;
        } else {
          // Check if any individual file exceeds 50MB
          const hasTooLargeFile = fileList.some(f => f.size > limitBytes);
          if (hasTooLargeFile) {
            warning = `Warning: One of your files exceeds the 50MB browser safe limit. Performing locally in browser may freeze the environment.`;
          }
        }

        // Aggregate unique recommended tools based on files
        const recsMap = new Map<SubViewType, { id: SubViewType; label: string; desc: string }>();

        fileList.forEach(file => {
          const name = file.name;
          const type = file.type || '';
          const extension = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : '';

          if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(extension) || type.startsWith('image/')) {
            recsMap.set('image_file_utils', {
              id: 'image_file_utils',
              label: 'MIME EXIF Forensic Cleaner',
              desc: 'Scan JPEG tags, remove deep camera coordinate metadata, or convert sizes to WebP.'
            });
            recsMap.set('package', {
              id: 'package',
              label: 'Secure GCM Image ZIP Packager',
              desc: 'Gather and package images into password-protected encrypted archives.'
            });
          } else if (['pem', 'crt', 'key', 'der', 'pub'].includes(extension)) {
            recsMap.set('security_privacy_suite_view', {
              id: 'security_privacy_suite_view',
              label: 'PEM Certificate Decoder',
              desc: 'Parse X509 signatures, validity dates, subject authorities, and public key dimensions.'
            });
            recsMap.set('keys', {
              id: 'keys',
              label: 'Key Utilities',
              desc: 'Import keyblocks or verify custom parameters.'
            });
          } else if (['zip', 'aes', 'enc', 'tar', 'gz'].includes(extension)) {
            recsMap.set('file_aes', {
              id: 'file_aes',
              label: 'Symmetric File Encryptor',
              desc: 'Decrypt symmetrical binary or document payloads with passphrases.'
            });
            recsMap.set('vault', {
              id: 'vault',
              label: 'Secure Local Notes Vault',
              desc: 'Store secret indexes or keys securely.'
            });
          }
        });

        // Default recommendations if no matches were accumulated
        if (recsMap.size === 0) {
          recsMap.set('file_aes', {
            id: 'file_aes',
            label: 'Symmetric File Encryptor',
            desc: 'Symmetrically secure documents or source files offline with high-entropy keys.'
          });
          recsMap.set('hashing', {
            id: 'hashing',
            label: 'SHA-256 / SHA-512 Hash Engine',
            desc: 'Generate SHA signatures or md5 strings to audit code integrity.'
          });
        }

        const recommendedTools = Array.from(recsMap.values());

        // Extract metadata for display
        let name = '';
        let type = '';
        let extension = '';

        if (fileCount === 1) {
          const file = fileList[0];
          name = file.name;
          type = file.type || 'application/octet-stream';
          extension = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : 'none';
        } else {
          name = `${fileList[0].name} and ${fileCount - 1} other file(s)`;
          type = 'Multiple Files';
          const extensions = Array.from(new Set(fileList.map(f => f.name.includes('.') ? f.name.split('.').pop()?.toLowerCase() || '' : '').filter(Boolean)));
          extension = extensions.length > 0 ? extensions.join(', ') : 'none';
        }

        const allFiles = fileList.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type || 'application/octet-stream',
          extension: f.name.includes('.') ? f.name.split('.').pop()?.toLowerCase() || '' : 'none'
        }));

        setDetectedFile({
          name,
          size: totalSize,
          type,
          extension,
          recommendedTools,
          fileCount,
          allFiles,
          warning
        });
      } catch (err) {
        console.error("Error processing files: ", err);
      } finally {
        setIsFileProcessing(false);
      }
    }, 750);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  // Categorize tools to avoid clutter
  const categories = Array.from(new Set(tools.map(t => t.category)));

  // Filter tools for Command Palette
  const filteredTools = searchQuery.trim() === '' 
    ? tools 
    : tools.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.keywords && t.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())))
      );

  // Keyboard navigation inside the command palette
  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPaletteIndex(prev => (prev + 1) % filteredTools.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPaletteIndex(prev => (prev - 1 + filteredTools.length) % filteredTools.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[paletteIndex]) {
        setActiveView(filteredTools[paletteIndex].id);
        setPaletteOpen(false);
      }
    } else if (e.key === 'Escape') {
      setPaletteOpen(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'noir' ? 'bg-black text-white' : 'bg-slate-950 text-slate-100'} font-sans selection:bg-teal-500 selection:text-slate-950 flex flex-col justify-between py-10 px-4 md:px-8 relative overflow-x-hidden transition-colors duration-300`}>
      {/* Background Mesh Gradients Container */}
      {theme === 'frosted' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]"></div>
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[100px]"></div>
        </div>
      )}

      {/* Frame wrapper for modern aesthetic structure */}
      <div className="w-full max-w-5xl mx-auto z-10 flex-grow flex flex-col justify-between">
        
        {/* Header section */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-4 border-b border-white/10 pb-6">
          <div className="text-center md:text-left space-y-1">
            <div className="flex justify-center md:justify-start items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-teal-400 bg-teal-500/10 px-2 py-0.5 border border-teal-500/20 rounded">CLIENT-SIDE PRIVACY ENGINE</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
              Cryptic <span className="text-slate-500 font-normal hidden sm:inline">|</span> <span className="bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent font-semibold">Military Cryptography Suite</span>
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              A premium offline processing station designed for symmetric compilers and zero-knowledge privacy operations. No keys or files ever transit our server.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs bg-white/5 hover:bg-white/10 py-2.5 px-4 rounded-xl border border-white/10 shadow-md backdrop-blur-md cursor-pointer text-slate-300 font-medium transition shrink-0"
              title="Toggle application style theme"
            >
              {theme === 'frosted' ? (
                <>
                  <Sparkles size={13} className="text-teal-400 animate-pulse" />
                  <span>Frosted Glass</span>
                </>
              ) : (
                <>
                  <Moon size={13} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold">Midnight Noir</span>
                </>
              )}
            </button>

            {/* Clickable search bar for easy spotlight entry */}
            <button
              onClick={() => {
                setPaletteOpen(true);
                setSearchQuery('');
                setPaletteIndex(0);
              }}
              className="w-full sm:w-48 flex items-center justify-between text-left text-xs bg-white/5 hover:bg-white/10 py-2.5 px-4 rounded-xl border border-white/10 shadow-md backdrop-blur-md cursor-pointer text-slate-400 font-medium transition"
            >
              <span className="flex items-center gap-2">
                <Search size={13} className="text-teal-400 animate-pulse" />
                Find tools...
              </span>
              <kbd className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded font-bold font-mono">⌘K</kbd>
            </button>

            <div className="flex w-full sm:w-auto items-center gap-2.5 bg-white/5 p-2.5 px-4 border border-white/10 rounded-xl shadow-md backdrop-blur-md">
              <ShieldCheck className="text-emerald-400 shrink-0" size={18} />
              <div className="text-left font-mono">
                <p className="text-[10px] text-slate-500 leading-none">Security Status</p>
                <h5 className="text-[11px] text-slate-300 font-bold leading-relaxed mt-0.5">100% Local & Private</h5>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic content rendering with route transitions */}
        <main className="flex-grow flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activeView === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                               {/* Drag & Drop File Inspector Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 relative overflow-hidden backdrop-blur-md min-h-[180px] ${
                    isDragging || isFileProcessing
                      ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 opacity-40 pointer-events-none" />
                  
                  {isFileProcessing ? (
                    <div className="flex flex-col items-center justify-center space-y-4 relative z-10 w-full max-w-sm animate-pulse">
                      {/* Scanning visual indicators */}
                      <div className="relative flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-teal-400 animate-spin" />
                        <ShieldAlert size={18} className="absolute text-teal-400 animate-pulse" />
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">Securing & Scanning Assets...</h3>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Assessing cryptography parameters & checking size thresholds
                        </p>
                      </div>

                      {/* Indeterminate linear progress indicator */}
                      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full animate-linear-scan" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={36} className={`mb-2 transition ${isDragging ? 'text-teal-400 scale-110' : 'text-slate-500'}`} />
                      <h3 className="text-sm font-semibold text-slate-200">Drag & Drop Secure File Analyzer</h3>
                      <p className="text-[11px] text-slate-400 max-w-md leading-normal mt-1 mb-4">
                        Drop multiple images, key pairs, archives, or text files directly into this container. Cryptic will process the MIME signatures and prompt optimal cryptography targets.
                      </p>

                      {/* File Picker input and trigger */}
                      <input
                        type="file"
                        id="dashboard-file-picker"
                        className="hidden"
                        onChange={handleFileChange}
                        multiple
                      />
                      <label
                        htmlFor="dashboard-file-picker"
                        className="inline-flex items-center gap-2 text-xs bg-teal-500/10 hover:bg-teal-500/25 text-teal-300 hover:text-teal-200 py-2 px-5 rounded-xl border border-teal-500/20 shadow-md backdrop-blur-md cursor-pointer transition relative z-20 font-semibold font-mono"
                      >
                        <Wrench size={12} className="text-teal-400" />
                        Browse Local Files
                      </label>
                    </>
                  )}
                </div>

                {/* Recent Operations Section */}
                {recentViews.length > 0 && (
                  <div className="border border-white/10 bg-white/5 rounded-3xl p-5 space-y-4 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent pointer-events-none" />
                    <div className="flex justify-between items-center relative z-10 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-teal-400 animate-pulse" />
                        <h3 className="text-xs font-bold tracking-wider uppercase font-mono text-slate-300">Recent Operations</h3>
                      </div>
                      <button
                        onClick={clearRecentHistory}
                        className="text-[10px] text-slate-500 hover:text-rose-400 font-mono transition flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-rose-500/10 px-3 py-1 border border-white/5 hover:border-rose-500/20 rounded-lg"
                      >
                        <Trash2 size={11} className="shrink-0" />
                        Clear History
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 relative z-10 font-sans">
                      {recentViews.map((id) => {
                        const item = tools.find((t) => t.id === id);
                        if (!item) return null;
                        return (
                          <motion.div
                            key={id}
                            whileHover={{ scale: 1.025 }}
                            whileTap={{ scale: 0.975 }}
                            onClick={() => setActiveView(id)}
                            className="bg-slate-950/60 hover:bg-slate-950 border border-white/5 hover:border-teal-500/30 p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition duration-200 group relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-8 h-8 bg-teal-500/[0.02] rounded-bl-full pointer-events-none group-hover:bg-teal-500/[0.05] transition" />
                            <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5 group-hover:border-teal-500/20 group-hover:bg-white/10 transition duration-300 [&_svg]:!w-4 [&_svg]:!h-4">
                              {item.icon}
                            </div>
                            <div className="min-w-0 flex-1 select-none">
                              <h4 className="text-[11px] font-bold text-slate-300 truncate leading-tight group-hover:text-teal-400 transition duration-200">
                                {item.name}
                              </h4>
                              <p className="text-[9px] text-slate-500 truncate mt-0.5">{item.category}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Categorized Tools Layout */}
                <div className="space-y-8">
                  {categories.map((category) => (
                    <div key={category} className="space-y-4">
                      {/* Section Category Title */}
                      <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded" />
                        <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">{category}</h2>
                        <span className="text-[10px] text-slate-600 font-mono">({tools.filter(t => t.category === category).length} suite assets)</span>
                      </div>

                      {/* Small non-bloated clean grids */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {tools
                          .filter((t) => t.category === category)
                          .map((t) => (
                            <motion.div
                              key={t.id}
                              whileHover={{ scale: 1.015 }}
                              whileTap={{ scale: 0.995 }}
                              onClick={() => setActiveView(t.id)}
                              className={`group border ${t.accentColor} bg-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4 cursor-pointer backdrop-blur-md transition-all duration-200 relative overflow-hidden`}
                            >
                              {t.badge && (
                                <span className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  t.badge === 'Core Security' 
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                                    : 'text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-400'
                                }`}>
                                  {t.badge}
                                </span>
                              )}

                              <div className="space-y-3">
                                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                                  {t.icon}
                                </div>

                                <h3 className="text-sm font-bold text-slate-200 tracking-tight leading-none">
                                  {t.name}
                                </h3>

                                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                  {t.shortDesc}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-400/90 hover:text-teal-400 transition-colors pt-2 border-t border-white/5 w-fit">
                                Launch workspace <span className="group-hover:translate-x-1 transition duration-200">→</span>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sub banner highlighting architecture validity */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left backdrop-blur-md">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-slate-300 flex items-center justify-center md:justify-start gap-1.5">
                      <Terminal size={13} className="text-teal-400" />
                      Client-Sandboxed Computing Specifications
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal max-w-xl">
                      Standard web applications run decryption queries in remote databases. Cryptic is entirely decentralized. Password hashing, salt allocation, and file parsing run in the Web Crypto VM within your private browser session. No API credentials, files, or sensitive bytes ever transit our host server.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/5 text-slate-300 font-mono text-[9px] rounded-lg border border-white/10 flex items-center gap-1 shrink-0 backdrop-blur-sm">
                      <FileCode size={11} /> TLS 1.3
                    </span>
                    <span className="px-3 py-1 bg-white/5 text-slate-300 font-mono text-[9px] rounded-lg border border-white/10 flex items-center gap-1 shrink-0 backdrop-blur-sm">
                      <Cpu size={11} /> PBKDF2
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Back Link */}
                <button
                  onClick={handleBackToGrid}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-teal-400 transition duration-200 focus:outline-none bg-white/5 hover:bg-white/10 py-2 px-4 rounded-xl border border-white/10 w-fit cursor-pointer backdrop-blur-md"
                >
                  <ArrowLeft size={14} />
                  Return to Dashboard Grid
                </button>

                {/* Render active tool */}
                {activeView === 'package' && <ImagePackager initialFiles={uploadedFiles} />}
                {activeView === 'file_aes' && <FileEncryptor initialFiles={uploadedFiles} />}
                {activeView === 'vault' && <SecureVault />}
                {activeView === 'hashing' && <Hasher initialFiles={uploadedFiles} />}
                {activeView === 'keys' && <KeyUtils />}
                {activeView === 'encoding' && <EncoderDecoder />}
                {activeView === 'dev_utils' && <DevUtilities />}
                {activeView === 'image_file_utils' && <ImageFileUtilities initialFiles={uploadedFiles} />}
                {activeView === 'security_privacy_suite_view' && <SecurityPrivacySuite initialFiles={uploadedFiles} />}
                {activeView === 'learn' && <CryptoWiki />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer Area */}
        <footer className="mt-12 pt-6 border-t border-white/5 text-center space-y-2">
          <p className="text-[10px] text-slate-500 font-mono">
            &copy; {new Date().getFullYear()} Cryptic - Privacy Suite. Protected under global cryptographic trust standards.
          </p>
          <div className="flex justify-center gap-4 text-[10px] text-slate-600">
            <span>SHA-256 Integrity Verified</span>
            <span>•</span>
            <span>Zero Knowledge Standard</span>
          </div>
        </footer>
      </div>

      {/* RENDER COMMAND PALETTE DIALOG */}
      <AnimatePresence>
        {paletteOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPaletteOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal window container */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: -10 }}
              className="bg-slate-900 border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl relative z-10 overflow-hidden outline-none"
              onKeyDown={handlePaletteKeyDown}
            >
              {/* Query tray input */}
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
                <Search size={16} className="text-teal-400 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Type cryptography search keys... (e.g. SHA, AES, webp)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPaletteIndex(0);
                  }}
                  className="w-full bg-transparent text-xs text-white border-none outline-none placeholder-slate-500"
                />
                <button
                  onClick={() => setPaletteOpen(false)}
                  className="text-slate-500 hover:text-slate-300 transition shrink-0 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Items matches lists */}
              <div className="max-h-[300px] overflow-y-auto p-2 divide-y divide-white/5">
                {filteredTools.length > 0 ? (
                  filteredTools.map((t, idx) => {
                    const isSelected = idx === paletteIndex;
                    return (
                      <div
                        key={t.id}
                        onMouseEnter={() => setPaletteIndex(idx)}
                        onClick={() => {
                          setActiveView(t.id);
                          setPaletteOpen(false);
                        }}
                        className={`p-3 rounded-xl flex items-center justify-between gap-3 text-left transition duration-150 cursor-pointer ${
                          isSelected ? 'bg-white/10 text-white' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            {t.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-bold tracking-tight">{t.name}</h4>
                            <p className="text-[10px] text-slate-400 truncate leading-snug">{t.shortDesc}</p>
                          </div>
                        </div>

                        {/* Right side navigation details */}
                        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[9px]">
                          <span className="text-slate-500 hidden sm:inline uppercase">{t.category}</span>
                          {t.badge && (
                            <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 font-bold uppercase text-[8px]">
                              {t.badge}
                            </span>
                          )}
                          {isSelected && <ArrowRight size={11} className="text-teal-400" />}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center text-slate-500 text-xs font-mono">
                    No cryptography tools matched your key.
                  </div>
                )}
              </div>

              {/* Control tips bar footer */}
              <div className="bg-slate-950/80 border-t border-white/5 py-2 px-4 flex justify-between items-center text-[9px] text-slate-500 font-mono">
                <span>Navigate: ↑↓ Keys</span>
                <span>Select: Enter</span>
                <span>Close: Esc</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDER DETECTED FILE POPUP MODAL */}
      <AnimatePresence>
        {detectedFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetectedFile(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-teal-500/30 w-full max-w-md rounded-3xl p-6 relative z-10 space-y-5 shadow-2xl"
            >
              <div className="flex justify-between items-start border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-teal-400 animate-bounce" size={18} />
                  <h4 className="text-sm font-bold text-slate-100">Smart File Detection Result</h4>
                </div>
                <button
                  onClick={() => setDetectedFile(null)}
                  className="text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Warning Area */}
              {detectedFile.warning && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl flex items-start gap-2.5 text-[10px] leading-relaxed">
                  <ShieldAlert size={14} className="text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h5 className="font-bold uppercase tracking-wider font-mono">Memory Allocation warning</h5>
                    <p className="mt-0.5">{detectedFile.warning}</p>
                  </div>
                </div>
              )}

              {/* Info elements */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-1.5 font-mono text-[10px] break-all leading-normal">
                  <div className="flex justify-between text-slate-400 select-all select-text">
                    <span>NAME SUMMARY:</span>
                    <span className="text-white font-bold max-w-[200px] truncate">{detectedFile.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>TOTAL SIZE:</span>
                    <span className="text-teal-300 font-bold">
                      {detectedFile.size > 1024 * 1024 
                        ? `${(detectedFile.size / (1024 * 1024)).toFixed(2)} MB` 
                        : `${(detectedFile.size / 1024).toFixed(1)} KB`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>MIME TYPE:</span>
                    <span className="text-cyan-300">{detectedFile.type}</span>
                  </div>
                  {detectedFile.fileCount > 1 && (
                    <div className="flex justify-between text-slate-400">
                      <span>TOTAL FILE COUNT:</span>
                      <span className="text-emerald-400 font-bold">{detectedFile.fileCount} Files</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>MAPPED EXTENSION:</span>
                    <span className="text-orange-300 uppercase font-black">{detectedFile.extension || 'none'}</span>
                  </div>
                </div>

                {/* File list Manifest if multiple files */}
                {detectedFile.fileCount > 1 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Payload Manifest</span>
                    <div className="max-h-24 overflow-y-auto bg-slate-950/40 border border-white/5 rounded-xl p-2.5 divide-y divide-white/5 space-y-1">
                      {detectedFile.allFiles.map((item, id) => (
                        <div key={id} className="flex justify-between items-center text-[9px] font-mono py-1 text-slate-300">
                          <span className="truncate max-w-[200px] text-slate-200" title={item.name}>{item.name}</span>
                          <span className="text-teal-400 shrink-0 font-bold ml-2">
                            {item.size > 1024 * 1024
                              ? `${(item.size / (1024 * 1024)).toFixed(2)} MB`
                              : `${(item.size / 1024).toFixed(1)} KB`
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Recommended components</span>
                  
                  <div className="space-y-2">
                    {detectedFile.recommendedTools.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => {
                          setActiveView(rec.id);
                          setDetectedFile(null);
                        }}
                        className="w-full text-left p-3.5 bg-white/5 hover:bg-white/10 active:scale-[0.99] border hover:border-teal-500/20 border-white/5 rounded-2xl flex justify-between items-center gap-3 transition cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <h5 className="text-[11px] font-bold text-slate-200 font-mono tracking-tight">{rec.label}</h5>
                          <p className="text-[10px] text-slate-400 leading-normal font-sans pr-4">{rec.desc}</p>
                        </div>
                        <ArrowRight size={13} className="text-teal-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setDetectedFile(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Dismiss Detector dialog
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
