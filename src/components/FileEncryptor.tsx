/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Lock, Unlock, Download, UploadCloud, Eye, EyeOff, ShieldAlert, CheckCircle2, 
  Settings, Key, Copy, Check, FileCode, RefreshCw, FileQuestion
} from 'lucide-react';
import { 
  encryptAESGCM, decryptAESGCM, 
  encryptAESCBC, decryptAESCBC, 
  encryptChaCha, decryptChaCha, 
  stringToBytes, bytesToString 
} from '../utils/crypto';

interface FileEncryptorProps {
  initialFiles?: File[];
}

export default function FileEncryptor({ initialFiles }: FileEncryptorProps = {}) {
  const [activeTab, setActiveTab] = useState<'encrypt' | 'decrypt'>('encrypt');

  // Encryption state
  const [rawText, setRawText] = useState<string>('');
  const [draggedFile, setDraggedFile] = useState<{ name: string; size: number; content: string } | null>(null);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [algorithm, setAlgorithm] = useState<'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305'>('aes-256-gcm');
  const [iterations, setIterations] = useState<number>(100000);
  const [fileSuffix, setFileSuffix] = useState<string>('enc');
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [encSuccess, setEncSuccess] = useState<boolean>(false);

  // Decryption state
  const [decryptFile, setDecryptFile] = useState<File | null>(null);
  const [decryptPassword, setDecryptPassword] = useState<string>('');
  const [showDecryptPassword, setShowDecryptPassword] = useState<boolean>(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  const [decryptedPayload, setDecryptedPayload] = useState<{
    text: string;
    isMarkdown: boolean;
    name: string;
  } | null>(null);

  const [copied, setCopied] = useState<boolean>(false);

  const encFileRef = useRef<HTMLInputElement>(null);
  const decFileRef = useRef<HTMLInputElement>(null);

  // Parse initial files when passed from active detection
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const file = initialFiles[0];
      const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || '' : '';
      if (['enc', 'aes'].includes(ext)) {
        setActiveTab('decrypt');
        setDecryptFile(file);
        setDecryptionError(null);
        setDecryptedPayload(null);
      } else {
        setActiveTab('encrypt');
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string || '';
          setDraggedFile({
            name: file.name,
            size: file.size,
            content: text
          });
          setRawText(text);
          setEncSuccess(false);
        };
        reader.readAsText(file);
      }
    }
  }, [initialFiles]);

  // Parse text files on drop/select
  const handleFileSelectForEncryption = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string || '';
        setDraggedFile({
          name: file.name,
          size: file.size,
          content: text
        });
        setRawText(text); // Load into buffer
        setEncSuccess(false);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropEncrypt = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string || '';
        setDraggedFile({
          name: file.name,
          size: file.size,
          content: text
        });
        setRawText(text);
        setEncSuccess(false);
      };
      reader.readAsText(file);
    }
  };

  const handleDropDecrypt = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setDecryptFile(file);
      setDecryptionError(null);
      setDecryptedPayload(null);
    }
  };

  const clearEncInput = () => {
    setDraggedFile(null);
    setRawText('');
    setEncSuccess(false);
  };

  // Perform Symmetric client-side Encryption
  const handleEncrypt = async () => {
    const textToEncrypt = rawText;
    if (!textToEncrypt || !password) return;
    setIsProcessing(true);
    setEncSuccess(false);

    try {
      const rawBytes = stringToBytes(textToEncrypt);
      let combinedBytes: Uint8Array;

      // Direct encryption router
      if (algorithm === 'aes-256-gcm') {
        const res = await encryptAESGCM(rawBytes, password, iterations);
        combinedBytes = res.combined;
      } else if (algorithm === 'aes-256-cbc') {
        const res = await encryptAESCBC(rawBytes, password, iterations);
        combinedBytes = res.combined;
      } else {
        const res = await encryptChaCha(rawBytes, password, iterations);
        combinedBytes = res.combined;
      }

      // Handle download of crypt file
      const blob = new Blob([combinedBytes], { type: 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Construct nice download name
      const baseName = draggedFile 
        ? draggedFile.name.substring(0, draggedFile.name.lastIndexOf('.')) || draggedFile.name
        : 'secure_note';
      const fileExt = draggedFile ? draggedFile.name.split('.').pop() || 'txt' : 'txt';

      link.download = `${baseName}.${fileExt}.${fileSuffix}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setEncSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert('Encryption logic failure: ' + (err.message || 'Verification mismatch.'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Perform Symmetric client-side Decryption
  const handleDecrypt = async () => {
    if (!decryptFile || !decryptPassword) return;
    setIsProcessing(true);
    setDecryptionError(null);
    setDecryptedPayload(null);

    try {
      // 1. Read input encrypted container
      const arrayBuffer = await decryptFile.arrayBuffer();
      const combinedBytes = new Uint8Array(arrayBuffer);

      // 2. Decrypt based on algorithm matching
      let plaintextBytes: Uint8Array;

      if (algorithm === 'aes-256-gcm') {
        plaintextBytes = await decryptAESGCM(combinedBytes, decryptPassword, iterations);
      } else if (algorithm === 'aes-256-cbc') {
        plaintextBytes = await decryptAESCBC(combinedBytes, decryptPassword, iterations);
      } else {
        plaintextBytes = await decryptChaCha(combinedBytes, decryptPassword, iterations);
      }

      const plainText = bytesToString(plaintextBytes);

      // Construct name
      let originalName = decryptFile.name.replace(new RegExp(`\\.${fileSuffix}$`, 'i'), '');
      if (originalName === decryptFile.name) {
        originalName = originalName.replace(/\.enc$/i, '').replace(/\.encrypted$/i, '');
      }

      // Check if it's potentially Markdown based on suffix or headers
      const lowerName = originalName.toLowerCase();
      const isMarkdown = lowerName.endsWith('.md') || lowerName.endsWith('.markdown') || plainText.startsWith('# ') || plainText.includes('\n# ');

      setDecryptedPayload({
        text: plainText,
        isMarkdown,
        name: originalName
      });

    } catch (err: any) {
      console.error(err);
      setDecryptionError(
        err.message?.includes('decryption failed') || err.message?.includes('tag') || err.message?.includes('mac')
          ? 'Decryption mismatch: Invalid secret key, salt iteration variance, or modified file envelope.'
          : 'Failed to decrypt package file bytes. Ensure correct cryptographic parameters.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!decryptedPayload) return;
    navigator.clipboard.writeText(decryptedPayload.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadDecryptedResult = () => {
    if (!decryptedPayload) return;
    const blob = new Blob([decryptedPayload.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = decryptedPayload.name || 'decrypted_plain.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md max-w-sm mx-auto shadow-lg">
        <button
          onClick={() => { setActiveTab('encrypt'); setDecryptionError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 cursor-pointer ${
            activeTab === 'encrypt' 
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-semibold shadow-inner' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock size={15} />
          Encrypt File/Text
        </button>
        <button
          onClick={() => { setActiveTab('decrypt'); setDecryptionError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 cursor-pointer ${
            activeTab === 'decrypt' 
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-semibold shadow-inner' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Unlock size={15} />
          Decrypt File
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'encrypt' ? (
          <motion.div
            key="encrypt"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: Input text or file upload */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDropEncrypt}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-2xl relative backdrop-blur-md"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Text Document Source
                  </span>
                  {draggedFile && (
                    <span className="text-[11px] text-teal-400 bg-teal-500/10 px-2.5 py-1 border border-teal-500/20 rounded-full font-medium animate-pulse">
                      Loaded: {draggedFile.name}
                    </span>
                  )}
                </div>

                <textarea
                  value={rawText}
                  id="rawEncryptTextarea"
                  onChange={(e) => {
                    setRawText(e.target.value);
                    setEncSuccess(false);
                  }}
                  placeholder="Paste Markdown blocks, private credentials, or write secure documentation text here. Alternatively, drag and drop any .txt/.md file below..."
                  className="w-full flex-1 min-h-[180px] md:min-h-[220px] bg-white/5 border border-white/10 rounded-xl p-3.5 text-slate-200 text-sm placeholder-slate-600 outline-none focus:border-teal-500/50 transition duration-300 font-mono resize-none leading-relaxed"
                />

                <div 
                  className="mt-4 border border-dashed border-white/10 bg-white/5 hover:border-teal-500/45 rounded-xl p-4 text-center cursor-pointer transition flex items-center justify-center gap-3 group"
                  onClick={() => encFileRef.current?.click()}
                >
                  <input
                    type="file"
                    id="plaintextFileInput"
                    ref={encFileRef}
                    accept=".txt,.md,.markdown,.json,.html"
                    onChange={handleFileSelectForEncryption}
                    className="hidden"
                  />
                  <UploadCloud size={20} className="text-slate-500 group-hover:text-teal-400 transition mb-0.5" />
                  <div>
                    <p className="text-slate-300 font-medium text-xs">
                      Drag text file here or <span className="text-teal-400 hover:underline">browse local file</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Supports .txt, .md, .markdown, .json</p>
                  </div>
                </div>

                {rawText && (
                  <button
                    onClick={clearEncInput}
                    className="absolute top-4 right-4 text-[10px] bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 py-1 px-2.5 rounded-md cursor-pointer"
                  >
                    Clear Input
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Parameters and Actions */}
            <div className="lg:col-span-5 space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Key className="text-teal-400 animate-pulse" size={18} />
                  Symmetric Parameters
                </h3>

                {/* Password field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Encryption Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      id="symmetricPass"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Input highly secure cryptographic key password..."
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/30 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-600 outline-none transition duration-300 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Advanced parameters trigger */}
                <button
                  type="button"
                  onClick={() => setIsAdvanced(!isAdvanced)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-teal-400 transition cursor-pointer"
                >
                  <Settings size={13} className={`transform transition duration-300 ${isAdvanced ? 'rotate-90' : ''}`} />
                  {isAdvanced ? 'Hide Advanced Config' : 'Reveal Advanced Cryptography Parameters'}
                </button>

                {isAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 pt-3 border-t border-white/10 overflow-hidden"
                  >
                    {/* Cipher Select */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        Symmetric Algorithm Protocol
                      </label>
                      <select
                        value={algorithm}
                        id="algorithmSelect"
                        onChange={(e) => setAlgorithm(e.target.value as any)}
                        className="w-full bg-white/5 border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-teal-600 font-sans"
                      >
                        <option value="aes-256-gcm" className="bg-slate-900">AES-256 GCM (Authenticated - Recommended)</option>
                        <option value="aes-256-cbc" className="bg-slate-900">AES-256 CBC (Standard Padding Matching)</option>
                        <option value="chacha20-poly1305" className="bg-slate-900">ChaCha20-Poly1305 (Fast Stream Cipher)</option>
                      </select>
                    </div>

                    {/* Salt iteration size */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        Key Derivation (PBKDF2 SHA-256 Iterations)
                      </label>
                      <select
                        value={iterations}
                        id="iterationsSelect"
                        onChange={(e) => setIterations(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-teal-600 font-sans"
                      >
                        <option value={100000} className="bg-slate-900">100,000 Iterations (Secure - Standard)</option>
                        <option value={300000} className="bg-slate-900">300,000 Iterations (Recommended Extended)</option>
                        <option value={600000} className="bg-slate-900">600,000 Iterations (Paranoid - Extreme Entropy)</option>
                      </select>
                    </div>

                    {/* Suffix filename */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        Download File Suffix
                      </label>
                      <input
                        type="text"
                        value={fileSuffix}
                        id="fileSuffixInput"
                        onChange={(e) => setFileSuffix(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-300 text-xs placeholder-slate-700 outline-none focus:border-teal-600 font-mono"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="space-y-4 pt-4 lg:pt-0">
                <button
                  type="button"
                  disabled={!rawText || !password || isProcessing}
                  id="encryptNowBtn"
                  onClick={handleEncrypt}
                  className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin text-slate-950" />
                      Performing PBKDF2 & Cryptographic Wrap...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Encrypt and Download Encrypted File
                    </>
                  )}
                </button>

                {encSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">File Encryption Succeeded!</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        A dynamic random 16-byte salt has been generated. The key has been derived, and the ciphertext (containing iv parameter headers) has been downcompiled into a clean package and saved to disk.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="decrypt"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: Drag & Drop encrypted file */}
            <div className="lg:col-span-5 flex flex-col space-y-4 justify-between">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDropDecrypt}
                className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-white/10 hover:border-teal-500 bg-white/5 backdrop-blur-md transition-colors duration-300 rounded-2xl p-6 text-center cursor-pointer min-h-[280px] relative overflow-hidden group shadow-2xl"
                onClick={() => decFileRef.current?.click()}
              >
                <input
                  type="file"
                  id="encryptedFileInput"
                  ref={decFileRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setDecryptFile(e.target.files[0]);
                      setDecryptionError(null);
                      setDecryptedPayload(null);
                    }
                  }}
                  className="hidden"
                />

                {decryptFile ? (
                  <div className="flex flex-col items-center p-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-4 scale-110 shadow-lg animate-pulse">
                      <FileCode className="text-teal-400" size={32} />
                    </div>
                    <p className="text-slate-100 font-semibold max-w-sm truncate text-sm">
                      {decryptFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(decryptFile.size / 1024).toFixed(1)} KB (Payload container)
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDecryptFile(null);
                        setDecryptedPayload(null);
                      }}
                      className="mt-4 px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 rounded-lg text-xs transition duration-200"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-4 group-hover:scale-110 transition duration-300">
                      <FileQuestion className="text-cyan-400" size={32} />
                    </div>
                    <h3 className="text-slate-200 font-semibold mb-1">Drag encrypted package here</h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-xs leading-relaxed">
                      Select or drop your encrypted container file (e.g. `.enc`, `.encrypted`) to restore the original document.
                    </p>
                    <span className="px-4 py-2 bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 font-medium text-xs rounded-xl shadow-sm hover:text-white transition duration-200">
                      Browse Files
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Password input or Results View */}
            <div className="lg:col-span-7 space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Unlock className="text-teal-400" size={18} />
                Decryption and Restoration Panel
              </h3>

              {!decryptedPayload ? (
                <div className="space-y-4">
                  {/* Password Decrypt field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Decryption Passphrase
                    </label>
                    <div className="relative">
                      <input
                        type={showDecryptPassword ? 'text' : 'password'}
                        value={decryptPassword}
                        id="decryptionKeyInput"
                        onChange={(e) => setDecryptPassword(e.target.value)}
                        placeholder="Input matches password parameter..."
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/30 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-600 outline-none transition duration-300 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDecryptPassword(!showDecryptPassword)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
                      >
                        {showDecryptPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Crypt matching parameter sets */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                        Selected Decryption Cipher
                      </label>
                      <select
                        value={algorithm}
                        id="decryptAlgorithmSelect"
                        onChange={(e) => setAlgorithm(e.target.value as any)}
                        className="w-full bg-white/5 border border-white/10 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none font-sans"
                      >
                        <option value="aes-256-gcm" className="bg-slate-900">AES-256 GCM</option>
                        <option value="aes-256-cbc" className="bg-slate-900">AES-256 CBC</option>
                        <option value="chacha20-poly1305" className="bg-slate-900">ChaCha20-Poly1305</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                        Salt Iteration Match
                      </label>
                      <select
                        value={iterations}
                        id="decryptIterationsSelect"
                        onChange={(e) => setIterations(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none font-sans"
                      >
                        <option value={100000} className="bg-slate-900">100,000 Iterations</option>
                        <option value={300000} className="bg-slate-900">300,000 Iterations</option>
                        <option value={600000} className="bg-slate-900">600,000 Iterations</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!decryptFile || !decryptPassword || isProcessing}
                    id="decryptNowBtn"
                    onClick={handleDecrypt}
                    className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin text-slate-950" />
                        Decrypting, validating MAC...
                      </>
                    ) : (
                      <>
                        <Unlock size={16} />
                        Validate, Decrypt & Open File
                      </>
                    )}
                  </button>

                  {/* Decryption Failure block */}
                  {decryptionError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
                      <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">Cryptographic Error</span>
                        <p className="text-slate-400 mt-1 leading-relaxed">
                          {decryptionError}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 px-4 rounded-xl">
                     <div className="flex items-center gap-2">
                       <CheckCircle2 size={15} />
                       <span className="font-semibold">Decryption Validated</span>
                     </div>
                     <span className="text-[10px] text-slate-400 font-mono">Size: {decryptedPayload.text.length} characters</span>
                  </div>

                  {/* Document inspector container */}
                  <div className="border border-white/10 rounded-xl bg-white/5 flex flex-col h-72">
                    <div className="bg-white/5 border-b border-white/10 px-4 py-2 flex justify-between items-center">
                      <span className="text-xs font-mono text-teal-400 font-medium truncate max-w-[200px]">
                        {decryptedPayload.name}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={copyToClipboard}
                          className="p-1 px-2.5 text-slate-300 hover:text-white border border-white/10 bg-white/5 rounded-md text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {copied ? <Check size={12} className="text-emerald-400 animate-bounce" /> : <Copy size={12} />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          onClick={downloadDecryptedResult}
                          className="p-1 px-2.5 text-slate-950 hover:bg-teal-400 bg-teal-500 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition cursor-pointer"
                        >
                          <Download size={12} />
                          Download
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 flex-1 overflow-y-auto text-slate-300 font-mono text-xs leading-relaxed select-text whitespace-pre-wrap bg-[#0a0f1d]/50">
                      {decryptedPayload.isMarkdown ? (
                        <div className="font-sans text-sm select-text text-slate-300 prose prose-invert max-w-none">
                          {/* Simple clean inline Markdown renderer */}
                          {decryptedPayload.text.split('\n').map((line, idx) => {
                            if (line.startsWith('# ')) {
                              return <h1 key={idx} className="text-slate-100 font-bold text-xl mb-3 mt-4 border-b border-white/10 pb-1">{line.replace('# ', '')}</h1>;
                            } else if (line.startsWith('## ')) {
                              return <h2 key={idx} className="text-teal-400 font-semibold text-lg mb-2 mt-3">{line.replace('## ', '')}</h2>;
                            } else if (line.startsWith('### ')) {
                              return <h3 key={idx} className="text-slate-200 font-medium text-base mb-2 mt-3">{line.replace('### ', '')}</h3>;
                            } else if (line.startsWith('- ') || line.startsWith('* ')) {
                              return <li key={idx} className="ml-4 list-disc text-slate-300 my-0.5">{line.substring(2)}</li>;
                            } else if (line.startsWith('> ')) {
                              return <blockquote key={idx} className="border-l-2 border-teal-500/50 pl-3 italic text-slate-400 my-2 bg-teal-500/5 p-1 px-2 rounded">{line.replace('> ', '')}</blockquote>;
                            } else if (line.trim() === '') {
                              return <div key={idx} className="h-2" />;
                            }
                            return <p key={idx} className="my-1.5 leading-relaxed">{line}</p>;
                          })}
                        </div>
                      ) : (
                        decryptedPayload.text
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setDecryptedPayload(null)}
                    className="w-full h-10 border border-white/10 hover:border-white/20 bg-white/5 text-slate-300 font-medium rounded-lg text-xs transition duration-200 cursor-pointer"
                  >
                    Clear Decryption Buffer & Return
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
