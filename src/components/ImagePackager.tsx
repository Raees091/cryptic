/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileImage, Lock, Unlock, Download, UploadCloud, Eye, EyeOff, ShieldAlert, CheckCircle2, 
  Settings, FolderArchive, ArrowRightLeft, RefreshCw, Layers
} from 'lucide-react';
import { encryptAESGCM, decryptAESGCM, bytesToBase64 } from '../utils/crypto';

export default function ImagePackager() {
  const [activeMode, setActiveMode] = useState<'wrap' | 'unwrap'>('wrap');

  // Wrap State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState<string>('');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [saltStrength, setSaltStrength] = useState<number>(100000); // Iterations
  const [zipFileName, setZipFileName] = useState<string>('secure-image-package');
  const [folderName, setFolderName] = useState<string>('secure_contents');
  const [includeReadme, setIncludeReadme] = useState<boolean>(true);
  const [authNote, setAuthNote] = useState<string>('This package is protected using military-grade AES-256 GCM encryption.');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [packSuccess, setPackSuccess] = useState<boolean>(false);

  // Unwrap State
  const [selectedEncryptedFile, setSelectedEncryptedFile] = useState<File | null>(null);
  const [decryptPassphrase, setDecryptPassphrase] = useState<string>('');
  const [showDecryptPassphrase, setShowDecryptPassphrase] = useState<boolean>(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  const [unwrappedImage, setUnwrappedImage] = useState<{
    name: string;
    size: string;
    url: string;
    blob: Blob;
    readmeContent?: string;
  } | null>(null);

  const wrapInputRef = useRef<HTMLInputElement>(null);
  const unwrapInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setPackSuccess(false);
      // Auto fill zip name placeholder
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setZipFileName(`secure_${baseName.replace(/\s+/g, '_')}`);
    }
  };

  const clearWrap = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setPassphrase('');
    setPackSuccess(false);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropWrap = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        setImagePreviewUrl(URL.createObjectURL(file));
        setPackSuccess(false);
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setZipFileName(`secure_${baseName.replace(/\s+/g, '_')}`);
      }
    }
  };

  const handleDropUnwrap = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedEncryptedFile(file);
      setDecryptionError(null);
      setUnwrappedImage(null);
    }
  };

  // core function: Zip + AES GCM Encrypt
  const handlePackAndEncrypt = async () => {
    if (!selectedImage || !passphrase) return;
    setIsProcessing(true);
    setPackSuccess(false);

    try {
      // 1. Read image as Uint8Array
      const arrayBuffer = await selectedImage.arrayBuffer();
      const imageBytes = new Uint8Array(arrayBuffer);

      // 2. Add to Zip via JSZip
      const zip = new JSZip();
      const rootFolder = zip.folder(folderName || 'secure_contents');
      
      if (rootFolder) {
        // Place original image file inside zip folder
        rootFolder.file(selectedImage.name, imageBytes);
        
        // Optionally put security read-me info inside zip
        if (includeReadme) {
          const readmeText = `----------------------------------------
SECURE CRYPTOGRAPHIC ENVELOPE METADATA
----------------------------------------
- Original File: ${selectedImage.name}
- Size: ${(selectedImage.size / 1024).toFixed(2)} KB
- Encrypted Epoch: ${new Date().toISOString()}
- Cipher Specification: AES-256-GCM (Galois/Counter Mode)
- Derivation Protocol: PBKDF2 with SHA-256 Core
- Salt Iterations Selected: ${saltStrength.toLocaleString()}

Package Administrator Note:
${authNote || 'A proprietary client-side encryption protocol was used to build this container file.'}
----------------------------------------`;
          rootFolder.file('SECURITY_MANIFEST.txt', readmeText);
        }
      }

      // 3. Compress ZIP to typed array
      const zipBytes = await zip.generateAsync({ type: 'uint8array' });

      // 4. Encrypt zip bytes using Web Crypto GCM
      const encryptedObj = await encryptAESGCM(zipBytes, passphrase, saltStrength);

      // 5. Trigger download of the encrypted envelope
      const blob = new Blob([encryptedObj.combined], { type: 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${zipFileName || 'encrypted_package'}.enc.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setPackSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert('Encryption engine error. Please verify input variables.');
    } finally {
      setIsProcessing(false);
    }
  };

  // core function: Decrypt AES GCM + Unzip & Restore
  const handleDecryptAndRestore = async () => {
    if (!selectedEncryptedFile || !decryptPassphrase) return;
    setIsProcessing(true);
    setDecryptionError(null);
    setUnwrappedImage(null);

    try {
      // 1. Read encrypted container as bytes
      const arrayBuffer = await selectedEncryptedFile.arrayBuffer();
      const encryptedBytes = new Uint8Array(arrayBuffer);

      // 2. Decrypt using GCM
      const decryptedZipBytes = await decryptAESGCM(encryptedBytes, decryptPassphrase, saltStrength);

      // 3. Unzip via JSZip
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(decryptedZipBytes);
      
      // 4. Search files inside zip
      let imageFile: JSZip.JSZipObject | null = null;
      let readmeFile: JSZip.JSZipObject | null = null;

      loadedZip.forEach((relativePath, fileInfo) => {
        // Exclude the folders themselves, look only for files
        if (!fileInfo.dir) {
          const lowerPath = relativePath.toLowerCase();
          if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg') || 
              lowerPath.endsWith('.png') || lowerPath.endsWith('.gif') || 
              lowerPath.endsWith('.webp') || lowerPath.endsWith('.svg')) {
            imageFile = fileInfo;
          } else if (lowerPath.endsWith('security_manifest.txt')) {
            readmeFile = fileInfo;
          }
        }
      });

      if (!imageFile) {
        throw new Error('Container package opened successfully, but no valid original image payload was found inside.');
      }

      // 5. Extract original files
      const imgBytes = await (imageFile as JSZip.JSZipObject).async('uint8array');
      const originalFileName = (imageFile as JSZip.JSZipObject).name.split('/').pop() || 'decrypted_image';
      
      let readmeContent = '';
      if (readmeFile) {
        readmeContent = await (readmeFile as JSZip.JSZipObject).async('string');
      }

      // Detect visual content-type
      const ext = originalFileName.split('.').pop()?.toLowerCase();
      let mimeType = 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'svg') mimeType = 'image/svg+xml';

      const restoredBlob = new Blob([imgBytes], { type: mimeType });
      const restoredUrl = URL.createObjectURL(restoredBlob);

      setUnwrappedImage({
        name: originalFileName,
        size: (restoredBlob.size / 1024).toFixed(2),
        url: restoredUrl,
        blob: restoredBlob,
        readmeContent
      });

    } catch (err: any) {
      console.error(err);
      setDecryptionError(
        err.message?.includes('decryption failed') || err.message?.includes('tag')
          ? 'Authentication failed: Incorrect password or corrupted container integrity.'
          : `De-packaging failed: ${err.message || 'Verification mismatch.'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerDownloadUnwrapped = () => {
    if (!unwrappedImage) return;
    const link = document.createElement('a');
    link.href = unwrappedImage.url;
    link.download = unwrappedImage.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md max-w-sm mx-auto shadow-md">
        <button
          onClick={() => { setActiveMode('wrap'); setDecryptionError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 cursor-pointer ${
            activeMode === 'wrap' 
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-semibold shadow-inner' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock size={15} />
          Wrap Image
        </button>
        <button
          onClick={() => { setActiveMode('unwrap'); setDecryptionError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 cursor-pointer ${
            activeMode === 'unwrap' 
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-semibold shadow-inner' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Unlock size={15} />
          Unwrap Package
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeMode === 'wrap' ? (
          <motion.div
            key="wrap"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Side: Upload zone */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDropWrap}
                className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-white/10 hover:border-teal-500 bg-white/5 backdrop-blur-md transition-colors duration-300 rounded-2xl p-6 text-center cursor-pointer min-h-[320px] relative overflow-hidden group shadow-2xl"
                onClick={() => wrapInputRef.current?.click()}
              >
                <input
                  type="file"
                  id="imageWrapInput"
                  ref={wrapInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {imagePreviewUrl ? (
                  <div className="absolute inset-0 flex flex-col">
                    <img
                      src={imagePreviewUrl}
                      alt="Selected"
                      className="w-full h-full object-cover opacity-40 blur-[2px]"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-4 flex flex-col items-center">
                      <FileImage className="text-teal-400 mb-1" size={28} />
                      <p className="text-slate-100 font-medium text-sm truncate max-w-full">
                        {selectedImage?.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {selectedImage && (selectedImage.size / 1024).toFixed(1)} KB ({selectedImage?.type})
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearWrap();
                        }}
                        className="mt-3 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-md text-xs transition duration-200"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-4 group-hover:scale-110 transition duration-300">
                      <FileImage className="text-teal-400 group-hover:rotate-6 transition duration-300" size={32} />
                    </div>
                    <h3 className="text-slate-200 font-semibold mb-1">Drag and drop original image</h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-xs leading-relaxed">
                      Supports high-resolution PNG, JPG, JPEG, GIF, SVG, or WebP. Local client-only computation guarantees private security.
                    </p>
                    <span className="px-4 py-2 bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 font-medium text-xs rounded-xl shadow-sm hover:text-white transition duration-200">
                      Browse Files
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Options and Action */}
            <div className="lg:col-span-6 space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <FolderArchive className="text-teal-400" size={18} />
                Safety Package Configuration
              </h3>

              <div className="space-y-4">
                {/* Custom Passphrase */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Envelope Passphrase
                  </label>
                  <div className="relative">
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      value={passphrase}
                      id="imgPass"
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Input highly secure packaging password..."
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/30 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-600 outline-none transition duration-300 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
                    >
                      {showPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Advanced Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-teal-400 transition cursor-pointer"
                >
                  <Settings size={13} className={`transform transition duration-300 ${isAdvancedOpen ? 'rotate-90' : ''}`} />
                  {isAdvancedOpen ? 'Hide Advanced Settings' : 'Reveal Advanced Package Options'}
                </button>

                {isAdvancedOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden border-t border-white/10 pt-3"
                  >
                    {/* Zip Metadata */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                          Output Zip Filename
                        </label>
                        <input
                          type="text"
                          value={zipFileName}
                          id="zipFilename"
                          onChange={(e) => setZipFileName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-300 text-xs placeholder-slate-700 outline-none focus:border-teal-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                          Internal Nested Folder
                        </label>
                        <input
                          type="text"
                          value={folderName}
                          id="folderName"
                          onChange={(e) => setFolderName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-300 text-xs placeholder-slate-700 outline-none focus:border-teal-600"
                        />
                      </div>
                    </div>

                    {/* KDF Iterations strength */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        PBKDF2 Iteration Counts (Security Strength)
                      </label>
                      <select
                        value={saltStrength}
                        id="saltStrengthSelect"
                        onChange={(e) => setSaltStrength(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-teal-600"
                      >
                        <option value={100000} className="bg-slate-900">100,000 Iterations (Secure - Fast)</option>
                        <option value={300000} className="bg-slate-900">300,000 Iterations (Recommended Standard)</option>
                        <option value={600000} className="bg-slate-900">600,000 Iterations (High Security - Military-Grade)</option>
                      </select>
                    </div>

                    {/* Security manifest check */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeReadme}
                          id="includeReadmeCheck"
                          onChange={(e) => setIncludeReadme(e.target.checked)}
                          className="rounded border-white/10 text-teal-500 outline-none focus:ring-0 cursor-pointer"
                        />
                        Append SECURITY_MANIFEST.txt to ZIP
                      </label>
                      {includeReadme && (
                        <textarea
                          rows={2}
                          value={authNote}
                          id="authNoteInput"
                          onChange={(e) => setAuthNote(e.target.value)}
                          placeholder="Introduce custom administrator note inside the envelope..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-slate-400 text-xs outline-none focus:border-teal-600 resize-none font-mono placeholder-slate-700"
                        />
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Secure wrapping action */}
                <button
                  type="button"
                  disabled={!selectedImage || !passphrase || isProcessing}
                  id="packNowBtn"
                  onClick={handlePackAndEncrypt}
                  className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin text-slate-950" />
                      Compressing & Encrypting ZIP...
                    </>
                  ) : (
                    <>
                      <Layers size={16} />
                      Pack, Encrypt and Download ZIP
                    </>
                  )}
                </button>
              </div>

              {/* Pack success alert */}
              {packSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3.5 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="mt-0.5" />
                  <div>
                    <span className="font-bold">Cryptographic Wrap Succeeded!</span>
                    <p className="text-xs text-slate-400 mt-1">
                      Your original image has been base64 compiled, compressed inside an internal ZIP structure with a security manifest, fully encrypted using AES-256-GCM, and downloaded safely to your local machine.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="unwrap"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Side: Upload encrypted package info */}
            <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDropUnwrap}
                className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-white/10 hover:border-teal-500 bg-white/5 backdrop-blur-md transition-colors duration-300 rounded-2xl p-6 text-center cursor-pointer min-h-[320px] relative overflow-hidden group shadow-2xl"
                onClick={() => unwrapInputRef.current?.click()}
              >
                <input
                  type="file"
                  id="encryptedUnwrapInput"
                  ref={unwrapInputRef}
                  accept=".zip,.enc,.bin,.octet-stream"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedEncryptedFile(e.target.files[0]);
                      setDecryptionError(null);
                      setUnwrappedImage(null);
                    }
                  }}
                  className="hidden"
                />

                {selectedEncryptedFile ? (
                  <div className="flex flex-col items-center p-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-4 scale-110 shadow-lg shadow-teal-500/5 animate-pulse">
                      <FolderArchive className="text-teal-400" size={32} />
                    </div>
                    <p className="text-slate-100 font-semibold max-w-sm truncate text-sm">
                      {selectedEncryptedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(selectedEncryptedFile.size / 1024).toFixed(1)} KB (Encrypted Container)
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEncryptedFile(null);
                        setUnwrappedImage(null);
                      }}
                      className="mt-4 px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 text-slate-300 rounded-md text-xs transition duration-200"
                    >
                      Clear File
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-4 group-hover:scale-110 transition duration-300">
                      <ArrowRightLeft className="text-cyan-400 group-hover:rotate-180 transition duration-500" size={32} />
                    </div>
                    <h3 className="text-slate-200 font-semibold mb-1">Upload encrypted .zip package</h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-xs leading-relaxed">
                      Select or drop your encrypted package (`.enc.zip`). The browser will decode and extract original contents locally.
                    </p>
                    <span className="px-4 py-2 bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 font-medium text-xs rounded-xl shadow-sm hover:text-white transition duration-200">
                      Browse Files
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Password Input + Preview */}
            <div className="lg:col-span-6 space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Unlock className="text-teal-400" size={18} />
                Extract Package Contents
              </h3>

              {!unwrappedImage ? (
                <div className="space-y-4">
                  {/* Password entry */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Decrypt Passphrase
                    </label>
                    <div className="relative">
                      <input
                        type={showDecryptPassphrase ? 'text' : 'password'}
                        value={decryptPassphrase}
                        id="unwrapPass"
                        onChange={(e) => setDecryptPassphrase(e.target.value)}
                        placeholder="Enter decryption passphrase..."
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/30 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-600 outline-none transition duration-300 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDecryptPassphrase(!showDecryptPassphrase)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
                      >
                        {showDecryptPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* KDF Select match */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Salt Iterations used (Must match original wrap value)
                    </label>
                    <select
                      value={saltStrength}
                      id="unwrapIterations"
                      onChange={(e) => setSaltStrength(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-teal-600"
                    >
                      <option value={100000} className="bg-slate-900">100,000 Iterations (Secure - Fast)</option>
                      <option value={300000} className="bg-slate-900">300,000 Iterations (Recommended Standard)</option>
                      <option value={600000} className="bg-slate-900">600,000 Iterations (High Security - Military-Grade)</option>
                    </select>
                  </div>

                  {/* Decrypt action */}
                  <button
                    type="button"
                    disabled={!selectedEncryptedFile || !decryptPassphrase || isProcessing}
                    id="unwrapNowBtn"
                    onClick={handleDecryptAndRestore}
                    className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed select-none hover:shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin text-slate-950" />
                        Validating Key & Unwrapping ZIP...
                      </>
                    ) : (
                      <>
                        <Unlock size={16} />
                        Decrypt & Extract Image
                      </>
                    )}
                  </button>

                  {/* Decryption Error */}
                  {decryptionError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
                      <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">Cryptographic Match Failed</span>
                        <p className="text-slate-400 mt-1 leading-relaxed">
                          {decryptionError}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Previewing unwrapped content */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3.5 rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span className="font-bold">Original Image Restored!</span>
                  </div>

                  <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                    {/* Visual Preview */}
                    <div className="h-44 bg-[#0a0f1d]/50 border-b border-white/10 flex items-center justify-center relative group overflow-hidden">
                      <img
                        src={unwrappedImage.url}
                        alt="Restored"
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    </div>
                    {/* Meta info */}
                    <div className="p-3.5 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Extracted File:</span>
                        <span className="text-slate-300 font-semibold">{unwrappedImage.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Original Size:</span>
                        <span className="text-slate-300 font-semibold">{unwrappedImage.size} KB</span>
                      </div>
                    </div>
                  </div>

                  {unwrappedImage.readmeContent && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Security Manifest Details:</span>
                      <pre className="p-3 bg-white/5 border border-white/10 rounded-xl font-mono text-[10px] text-teal-400/80 leading-normal max-h-24 overflow-y-auto">
                        {unwrappedImage.readmeContent}
                      </pre>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setUnwrappedImage(null)}
                      className="flex-1 h-10 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-lg text-xs transition duration-200 cursor-pointer"
                    >
                      Clear & Back
                    </button>
                    <button
                      onClick={triggerDownloadUnwrapped}
                      className="flex-1 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer"
                    >
                      <Download size={14} />
                      Download Image
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
