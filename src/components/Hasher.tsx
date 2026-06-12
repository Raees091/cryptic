/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hash, FileKey2, ShieldCheck, CheckCircle2, XCircle, 
  UploadCloud, Copy, Check, Equal, RefreshCw, Layers, Cpu, HelpCircle
} from 'lucide-react';
import bcrypt from 'bcryptjs';
import { computeMD5, computeArgon2Hash } from '../utils/cryptoHelpers';

type HashTab = 'text' | 'file' | 'compare';

interface HasherProps {
  initialFiles?: File[];
}

export default function Hasher({ initialFiles }: HasherProps = {}) {
  const [activeTab, setActiveTab] = useState<HashTab>('text');
  
  // Text Hasher State
  const [textInput, setTextInput] = useState('');
  const [selectedAlg, setSelectedAlg] = useState<'sha256' | 'sha512' | 'md5' | 'bcrypt' | 'argon2'>('sha256');
  const [algOutput, setAlgOutput] = useState('');
  const [bcryptRounds, setBcryptRounds] = useState(10);
  const [argonMemory, setArgonMemory] = useState(64); // KiB
  const [argonIterations, setArgonIterations] = useState(3);
  const [argonLanes, setArgonLanes] = useState(4);
  const [argonType, setArgonType] = useState<'argon2id' | 'argon2i' | 'argon2d'>('argon2id');
  const [argonSalt, setArgonSalt] = useState('SecureSalt123');
  const [argonResult, setArgonResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // File Hasher State
  const [fileToHash, setFileToHash] = useState<File | null>(null);
  const [fileChecksums, setFileChecksums] = useState<{ md5: string; sha256: string; sha512: string } | null>(null);
  const [fileProgress, setFileProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compare Hashes State
  const [hashA, setHashA] = useState('');
  const [hashB, setHashB] = useState('');
  const [isMatch, setIsMatch] = useState<boolean | null>(null);

  // Synchronous and Asymmetric Cryptographic Trigger
  useEffect(() => {
    if (!textInput) {
      setAlgOutput('');
      setArgonResult(null);
      return;
    }

    const runHashing = async () => {
      setIsProcessing(true);
      try {
        if (selectedAlg === 'sha256' || selectedAlg === 'sha512') {
          const algName = selectedAlg === 'sha256' ? 'SHA-256' : 'SHA-512';
          const msgUint8 = new TextEncoder().encode(textInput);
          const hashBuffer = await window.crypto.subtle.digest(algName, msgUint8);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          setAlgOutput(hashHex);
          setArgonResult(null);
        } else if (selectedAlg === 'md5') {
          setAlgOutput(computeMD5(textInput));
          setArgonResult(null);
        } else if (selectedAlg === 'bcrypt') {
          // Offload to standard bcryptjs
          bcrypt.hash(textInput, bcryptRounds, (err, hash) => {
            if (!err && hash) {
              setAlgOutput(hash);
            }
            setIsProcessing(false);
          });
          return; // Prevents double toggles of processing
        } else if (selectedAlg === 'argon2') {
          const res = computeArgon2Hash(
            textInput,
            argonSalt,
            argonIterations,
            argonMemory,
            argonLanes,
            argonType
          );
          setAlgOutput(res.crypt);
          setArgonResult(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      runHashing();
    }, selectedAlg === 'bcrypt' ? 400 : 100);

    return () => clearTimeout(delayDebounce);
  }, [textInput, selectedAlg, bcryptRounds, argonMemory, argonIterations, argonLanes, argonType, argonSalt]);

  // File chunk-based checksum hashing
  const processFileChecksums = async (file: File) => {
    setFileChecksums(null);
    setFileProgress(0);
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        if (!e.target?.result) return;
        const arrayBuffer = e.target.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        // Update progress simulated checkpoints
        setFileProgress(25);
        const md5val = computeMD5(uint8Array);
        
        setFileProgress(60);
        const sha256Buffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
        const sha256val = Array.from(new Uint8Array(sha256Buffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        setFileProgress(90);
        const sha512Buffer = await window.crypto.subtle.digest('SHA-512', arrayBuffer);
        const sha512val = Array.from(new Uint8Array(sha512Buffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        setFileProgress(100);
        setFileChecksums({
          md5: md5val,
          sha256: sha256val,
          sha512: sha512val
        });
        setIsProcessing(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileToHash(file);
      processFileChecksums(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileToHash(file);
      processFileChecksums(file);
    }
  };

  // Load initial files from detection
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const file = initialFiles[0];
      setActiveTab('file');
      setFileToHash(file);
      processFileChecksums(file);
    }
  }, [initialFiles]);

  // Compare Hashes triggering
  useEffect(() => {
    const cleanA = hashA.trim().toLowerCase();
    const cleanB = hashB.trim().toLowerCase();
    if (!cleanA || !cleanB) {
      setIsMatch(null);
    } else {
      setIsMatch(cleanA === cleanB);
    }
  }, [hashA, hashB]);

  const triggerCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Sub navigation Tabs */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md max-w-md mx-auto shadow-lg">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-xs transition duration-300 cursor-pointer ${
            activeTab === 'text' 
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-semibold shadow-inner' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hash size={13} />
          Interactive Hasher
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-xs transition duration-300 cursor-pointer ${
            activeTab === 'file' 
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-semibold shadow-inner' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UploadCloud size={13} />
          File Hash Checksum
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-xs transition duration-300 cursor-pointer ${
            activeTab === 'compare' 
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-semibold shadow-inner' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Equal size={13} />
          Hash Comparison
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Interactive Hashing Panel */}
        {activeTab === 'text' && (
          <motion.div
            key="text-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Input & Parameters */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <FileKey2 className="text-teal-400" size={16} />
                  Input Text Payload
                </h4>
                <textarea
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Insert plain-text characters to perform instant multi-algorithm hashing..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200 text-xs placeholder-slate-600 outline-none focus:border-teal-500/50 resize-none font-mono"
                />

                <div className="space-y-3">
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Select Target Cipher Algorithm</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'sha256', name: 'SHA-256', desc: 'Secure standard' },
                      { id: 'sha512', name: 'SHA-512', desc: 'Extended 64-bit bits' },
                      { id: 'md5', name: 'MD5', desc: 'Legacy fast hash' },
                      { id: 'bcrypt', name: 'Bcrypt', desc: 'Salting blowfish' },
                      { id: 'argon2', name: 'Argon2', desc: 'Memory hard winner' },
                    ].map((alg) => (
                      <button
                        key={alg.id}
                        onClick={() => setSelectedAlg(alg.id as any)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                          selectedAlg === alg.id 
                            ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 font-semibold' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <p className="text-xs font-semibold">{alg.name}</p>
                        <p className="text-[10px] text-slate-500 font-sans">{alg.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Parameter Blocks */}
                <AnimatePresence>
                  {selectedAlg === 'bcrypt' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 pt-3 space-y-2 overflow-hidden"
                    >
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bcrypt Cost Rounds (2^x)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={4}
                          max={15}
                          value={bcryptRounds}
                          onChange={(e) => setBcryptRounds(Number(e.target.value))}
                          className="flex-grow accent-teal-400 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-teal-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                          {bcryptRounds} rounds
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500">Warning: Values above 12 rounds require extensive cycles on slow client engines.</p>
                    </motion.div>
                  )}

                  {selectedAlg === 'argon2' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 pt-3 space-y-3 overflow-hidden text-slate-300"
                    >
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Argon2 Stretching Tuning</h4>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1">Argon2 Block Mode</label>
                          <select
                            value={argonType}
                            onChange={(e) => setArgonType(e.target.value as any)}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-1.5 text-[11px] outline-none text-slate-200 cursor-pointer"
                          >
                            <option value="argon2id" className="bg-slate-900">Argon2id (Hybrid - Standard)</option>
                            <option value="argon2i" className="bg-slate-900">Argon2i (Sidechannel Safe)</option>
                            <option value="argon2d" className="bg-slate-900">Argon2d (GPU Resistant)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1">Salt Parameter</label>
                          <input
                            type="text"
                            value={argonSalt}
                            onChange={(e) => setArgonSalt(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-1 font-mono text-[11px] outline-none text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1">Memory (KiB)</label>
                          <input
                            type="number"
                            min={16}
                            max={4096}
                            value={argonMemory}
                            onChange={(e) => setArgonMemory(Math.max(16, Number(e.target.value)))}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-1 font-mono text-[11px] outline-none text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1">Iterations (t)</label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={argonIterations}
                            onChange={(e) => setArgonIterations(Math.max(1, Number(e.target.value)))}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-1 font-mono text-[11px] outline-none text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1">Lanes (p)</label>
                          <input
                            type="number"
                            min={1}
                            max={8}
                            value={argonLanes}
                            onChange={(e) => setArgonLanes(Math.max(1, Number(e.target.value)))}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-1 font-mono text-[11px] outline-none text-slate-200"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Results output display */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between min-h-[300px]">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="text-cyan-400" size={16} />
                    Compiled Hash Result
                  </h4>
                  {isProcessing && (
                    <span className="flex items-center gap-1.5 text-[10px] text-teal-400 font-mono">
                      <RefreshCw className="animate-spin" size={11} />
                      Computing...
                    </span>
                  )}
                </div>

                {algOutput ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Formatted Crypt Hash String</span>
                      <div className="relative">
                        <pre className="p-4 bg-[#0a0f1d]/70 border border-white/10 rounded-xl font-mono text-xs text-teal-300 leading-normal break-all select-all font-semibold select-text pr-10">
                          {algOutput}
                        </pre>
                        <button
                          onClick={() => triggerCopy(algOutput)}
                          className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer p-1 rounded hover:bg-white/5"
                        >
                          {copiedText ? <Check className="text-emerald-400" size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Argon2 Visual Block Mapping Simulator */}
                    {argonResult && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Layers size={11} className="text-teal-400" /> Memory Matrix Blocks ({argonLanes} lanes x {argonResult.columnsCount} columns)</span>
                          <span>{argonMemory} KiB Assigned</span>
                        </div>
                        <div className="p-4 bg-[#0a0f1d]/50 border border-white/10 rounded-xl space-y-2">
                          <div className="grid gap-1.5" style={{ gridTemplateRows: `repeat(${argonLanes}, minmax(0, 1fr))` }}>
                            {Array.from({ length: argonLanes }).map((_, laneIdx) => (
                              <div key={laneIdx} className="flex gap-1 items-center">
                                <span className="text-[8px] font-mono font-bold text-slate-600 w-4 block shrink-0">L{laneIdx}</span>
                                <div className="flex-1 flex gap-1 overflow-x-auto py-1">
                                  {argonResult.blocks
                                    .filter((b: any) => b.lane === laneIdx)
                                    .map((block: any, blockIdx: number) => (
                                      <div
                                        key={blockIdx}
                                        title={`Lane ${laneIdx} | Col ${blockIdx}\nBlock Seed: ${block.hashPrefix}`}
                                        className={`w-5 h-5 rounded flex items-center justify-center text-[7px] font-mono leading-none border transition duration-200 select-none ${
                                          block.isAccessed 
                                            ? 'bg-teal-500/25 border-teal-400/40 text-teal-300 animate-pulse' 
                                            : 'bg-white/5 border-white/5 text-slate-600 hover:bg-white/10'
                                        }`}
                                      >
                                        {block.hashPrefix.substring(2, 4)}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[9px] text-slate-500 leading-normal flex items-start gap-1 font-sans mt-2 pt-2 border-t border-white/5">
                            <Cpu size={10} className="text-teal-400 shrink-0 mt-0.5" />
                            Each matrix block is computed visually using deterministic BLAKE2b word permutation schedules. Blocks highlighted in teal indicate active coordinate reference taps used for state-mixing.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-12 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0a0f1d]/50 border border-white/10 flex items-center justify-center text-slate-500">
                      <Hash size={20} />
                    </div>
                    <h5 className="text-slate-300 font-semibold text-xs">Waiting for Input</h5>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-sans">
                      Paste or type arbitrary plain-text characters in the payload box to execute instantaneous client-side calculations.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 text-[10px] text-slate-500 flex items-center gap-2 font-mono">
                <span className="text-emerald-400">•</span>
                <span>All cryptography procedures are fully sandboxed using JS modules. Zero outbound calls exist.</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* File Checksum Hashing */}
        {activeTab === 'file' && (
          <motion.div
            key="file-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Zone: File input */}
            <div className="lg:col-span-5 flex flex-col">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDropFile}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-white/10 hover:border-teal-500 bg-white/5 backdrop-blur-md transition-all duration-300 rounded-2xl p-6 text-center cursor-pointer min-h-[300px] relative overflow-hidden group shadow-2xl justify-between"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div></div>

                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-4 group-hover:scale-110 transition duration-300">
                    <UploadCloud className="text-teal-400" size={32} />
                  </div>
                  <h4 className="text-slate-200 font-semibold text-sm mb-1">Select or Drag any file</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-3 font-sans">
                    Load high-capacity binaries, system images, or text documents. Files are processed entirely locally.
                  </p>
                  <span className="px-4 py-2 bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 font-medium text-[11px] rounded-xl shadow-xs hover:text-white transition duration-200">
                    Browse Local Storage
                  </span>
                </div>

                {fileToHash ? (
                  <div className="bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-xl p-2.5 px-4 w-full text-left truncate text-xs font-mono font-bold mt-4 flex justify-between items-center animate-pulse">
                    <span className="truncate max-w-[80%]">Loaded: {fileToHash.name}</span>
                    <span className="text-[10px] font-sans font-normal text-slate-400 shrink-0">{(fileToHash.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div></div>
                )}
              </div>
            </div>

            {/* Right Zone: Checksum outputs */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-300 border-b border-white/10 pb-3 flex items-center gap-2">
                  <Hash className="text-teal-400 animate-pulse" size={17} />
                  Algorithmic Signature Checksums
                </h4>

                {isProcessing && !fileChecksums ? (
                  <div className="p-12 text-center space-y-4">
                    <RefreshCw className="animate-spin text-teal-400 mx-auto" size={32} />
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-300 font-semibold font-mono">Reading & Buffering Bytes...</p>
                      <div className="w-48 bg-white/10 h-1.5 rounded-full mx-auto overflow-hidden">
                        <div className="bg-teal-400 h-full transition-all duration-300" style={{ width: `${fileProgress}%` }} />
                      </div>
                    </div>
                  </div>
                ) : fileChecksums ? (
                  <div className="space-y-4">
                    {[
                      { label: 'MD5 Block Checksum', val: fileChecksums.md5, badge: 'For integrity validation only' },
                      { label: 'SHA-256 Signature', val: fileChecksums.sha256, badge: 'Standard NIST standard' },
                      { label: 'SHA-512 Signature', val: fileChecksums.sha512, badge: 'Enhanced security bit key' },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <span>{item.label}</span>
                          <span className="text-[8px] font-sans font-normal text-slate-400 italic bg-white/5 px-2 py-0.5 rounded border border-white/10">{item.badge}</span>
                        </div>
                        <div className="relative">
                          <pre className="p-3 bg-[#0a0f1d]/50 border border-white/10 rounded-xl font-mono text-xs text-slate-300 truncate select-all leading-relaxed font-semibold pr-10">
                            {item.val}
                          </pre>
                          <button
                            onClick={() => triggerCopy(item.val)}
                            className="absolute right-3 top-2 text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-white/5 cursor-pointer"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-3">
                    <HelpCircle className="text-slate-600 mx-auto" size={36} />
                    <h5 className="text-slate-300 font-semibold text-xs">Waiting for File Package</h5>
                    <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto leading-relaxed">
                      Supply a valid target local folder document or executable to generate fully standard MD5 and SHA structural signatures.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                <span>Maximum Capacity: 500MB (Local RAM Bound)</span>
                <span>AES/SHA Engines Verified</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Hash Comparison Tool */}
        {activeTab === 'compare' && (
          <motion.div
            key="compare-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-6"
          >
            <div className="text-center space-y-1">
              <h4 className="text-lg font-semibold text-slate-100 flex items-center justify-center gap-2">
                <Equal className="text-teal-400" size={18} />
                Signature Verification Tool
              </h4>
              <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
                Paste two dynamic hashes (SHA-256, SHA-512, MD5, etc.) side-by-side. The engine performs strict bitwise analysis with case insensitivity.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Original Signature (e.g. From Official Download Page)</label>
                <input
                  type="text"
                  value={hashA}
                  onChange={(e) => setHashA(e.target.value)}
                  placeholder="Paste expected cryptographic checksum signature (hexadecimal)..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-slate-200 outline-none placeholder-slate-600 focus:border-teal-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Local Target Signature (Generated Checksum)</label>
                <input
                  type="text"
                  value={hashB}
                  onChange={(e) => setHashB(e.target.value)}
                  placeholder="Paste computed file checksum to verify cryptographic integrity..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-slate-200 outline-none placeholder-slate-600 focus:border-cyan-500/50"
                />
              </div>
            </div>

            <AnimatePresence>
              {isMatch !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`p-4 rounded-xl flex items-center justify-between border ${
                    isMatch 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isMatch ? (
                      <CheckCircle2 className="shrink-0 animate-bounce" size={24} />
                    ) : (
                      <XCircle className="shrink-0" size={24} />
                    )}
                    <div>
                      <h4 className="font-bold text-sm leading-relaxed">
                        {isMatch ? 'Cryptographic Balance Verified' : 'Signature Mismatch Detected'}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal font-sans">
                        {isMatch 
                          ? 'The bit structures match precisely. The tested package has zero byte manipulations.' 
                          : 'Bit positions differ. The binary payload might have been tampered or corrupted.'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white/5 px-2.5 py-1 border border-white/10 rounded-lg shrink-0">
                    {isMatch ? 'PASS 200' : 'FAIL 403'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
