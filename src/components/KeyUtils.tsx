/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, ShieldCheck, Download, Copy, Check, RefreshCw, 
  Layers, Lock, HelpCircle, ArrowLeftRight
} from 'lucide-react';
import { generateSecurePassword } from '../utils/cryptoHelpers';

type KeyTab = 'random' | 'pass' | 'nonce' | 'keypair' | 'pemder';

export default function KeyUtils() {
  const [activeTab, setActiveTab] = useState<KeyTab>('random');
  const [copiedText, setCopiedText] = useState(false);

  // Random Key State
  const [randomKeySize, setRandomKeySize] = useState(32); // Bytes
  const [randomKeyFormat, setRandomKeyFormat] = useState<'hex' | 'base64' | 'binary' | 'ascii'>('hex');
  const [randomKeyOutput, setRandomKeyOutput] = useState('');

  // Password Generator State
  const [passLength, setPassLength] = useState(20);
  const [passUpper, setPassUpper] = useState(true);
  const [passLower, setPassLower] = useState(true);
  const [passNumbers, setPassNumbers] = useState(true);
  const [passSymbols, setPassSymbols] = useState(true);
  const [passAvoidAmbiguous, setPassAvoidAmbiguous] = useState(true);
  const [passOutput, setPassOutput] = useState({ password: '', entropyBits: 0, strength: 'weak' as any });

  // Nonce/IV Generator State
  const [ivSize, setIvSize] = useState(12); // standard GCM
  const [ivOutputFormat, setIvOutputFormat] = useState<'hex' | 'base64'>('hex');
  const [ivOutput, setIvOutput] = useState('');

  // RSA/ECC State
  const [asymType, setAsymType] = useState<'rsa' | 'ecc'>('rsa');
  const [rsaBits, setRsaBits] = useState<'2048' | '3072' | '4096'>('2048');
  const [eccCurve, setEccCurve] = useState<'P-256' | 'P-384' | 'P-521'>('P-256');
  const [generatedKeys, setGeneratedKeys] = useState<{ public: string; private: string } | null>(null);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);

  // PEM/DER State
  const [pemInput, setPemInput] = useState('');
  const [derOutput, setDerOutput] = useState('');
  const [pemToDerError, setPemToDerError] = useState('');
  
  const [derInput, setDerInput] = useState('');
  const [pemHeaderType, setPemHeaderType] = useState('PUBLIC KEY');
  const [pemOutput, setPemOutput] = useState('');
  const [derToPemError, setDerToPemError] = useState('');

  const triggerCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // 1. Secure Random Key Builder
  const handleGenerateRandomKey = () => {
    const bytes = new Uint8Array(randomKeySize);
    window.crypto.getRandomValues(bytes);
    
    if (randomKeyFormat === 'hex') {
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      setRandomKeyOutput(hex);
    } else if (randomKeyFormat === 'base64') {
      const b64 = btoa(String.fromCharCode(...bytes));
      setRandomKeyOutput(b64);
    } else if (randomKeyFormat === 'binary') {
      const bin = Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join(' ');
      setRandomKeyOutput(bin);
    } else if (randomKeyFormat === 'ascii') {
      // Printable ASCII ranges between 33 and 126
      const ascii = Array.from(bytes).map(b => String.fromCharCode((b % 94) + 33)).join('');
      setRandomKeyOutput(ascii);
    }
  };

  // 2. High Entropy Password Builder
  const handleGeneratePassword = () => {
    const result = generateSecurePassword(passLength, {
      upper: passUpper,
      lower: passLower,
      number: passNumbers,
      symbol: passSymbols,
      excludeAmbiguous: passAvoidAmbiguous
    });
    setPassOutput(result);
  };

  // 3. IV/Nonce Generator
  const handleGenerateIV = () => {
    const bytes = new Uint8Array(ivSize);
    window.crypto.getRandomValues(bytes);
    if (ivOutputFormat === 'hex') {
      setIvOutput(Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    } else {
      setIvOutput(btoa(String.fromCharCode(...bytes)));
    }
  };

  // 4. Asymmetric Keypair Builder
  const handleGenerateAsymKeys = async () => {
    setIsGeneratingKeys(true);
    setGeneratedKeys(null);
    try {
      if (asymType === 'rsa') {
        const size = parseInt(rsaBits);
        const keyPair = await window.crypto.subtle.generateKey(
          {
            name: "RSA-OAEP",
            modulusLength: size,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
          },
          true,
          ["encrypt", "decrypt"]
        );

        const pubPEM = await exportKeyToPEM(keyPair.publicKey, 'public');
        const privPEM = await exportKeyToPEM(keyPair.privateKey, 'private');
        setGeneratedKeys({ public: pubPEM, private: privPEM });
      } else {
        const keyPair = await window.crypto.subtle.generateKey(
          {
            name: "ECDSA",
            namedCurve: eccCurve,
          },
          true,
          ["sign", "verify"]
        );

        const pubPEM = await exportKeyToPEM(keyPair.publicKey, 'public');
        const privPEM = await exportKeyToPEM(keyPair.privateKey, 'private');
        setGeneratedKeys({ public: pubPEM, private: privPEM });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  async function exportKeyToPEM(key: CryptoKey, type: 'public' | 'private'): Promise<string> {
    const format = type === 'public' ? 'spki' : 'pkcs8';
    const exported = await window.crypto.subtle.exportKey(format, key);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    const formattedBase64 = base64.replace(/(.{64})/g, "$1\n");
    const header = type === 'public' ? '-----BEGIN PUBLIC KEY-----' : '-----BEGIN PRIVATE KEY-----';
    const footer = type === 'public' ? '-----END PUBLIC KEY-----' : '-----END PRIVATE KEY-----';
    return `${header}\n${formattedBase64}\n${footer}`;
  }

  // 5. PEM ↔ DER Conversions
  const handlePemToDer = () => {
    setPemToDerError('');
    setDerOutput('');
    try {
      const cleanPEM = pemInput
        .replace(/-----BEGIN[^-]+-----/g, '')
        .replace(/-----END[^-]+-----/g, '')
        .replace(/\s+/g, '');
      
      if (!cleanPEM) {
        throw new Error("Pasted PEM structure has no valid base64 payload");
      }
      
      const rawBinary = atob(cleanPEM);
      const hexBytes = Array.from(rawBinary)
        .map(c => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
      setDerOutput(hexBytes);
    } catch (err: any) {
      setPemToDerError(err.message || "PEM decoding failed");
    }
  };

  const handleDerToPem = () => {
    setDerToPemError('');
    setPemOutput('');
    try {
      const cleanDER = derInput.replace(/[^0-9a-fA-F]/g, '');
      if (!cleanDER || cleanDER.length % 2 !== 0) {
        throw new Error("DER sequence must be composed of even hexadecimal block digits");
      }

      const binaryBytes = [];
      for (let i = 0; i < cleanDER.length; i += 2) {
        binaryBytes.push(parseInt(cleanDER.substring(i, i + 2), 16));
      }
      const rawString = String.fromCharCode(...binaryBytes);
      const base64 = btoa(rawString);
      const formattedBase64 = base64.replace(/(.{64})/g, "$1\n");
      const header = `-----BEGIN ${pemHeaderType}-----`;
      const footer = `-----END ${pemHeaderType}-----`;
      setPemOutput(`${header}\n${formattedBase64}\n${footer}`);
    } catch (err: any) {
      setDerToPemError(err.message || "DER compilation failed");
    }
  };

  const downloadPEMFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Sub Tabs Switching bar */}
      <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md max-w-2xl mx-auto shadow-lg">
        {[
          { id: 'random', label: 'Random Key', icon: <Key size={13} /> },
          { id: 'pass', label: 'Secure Password', icon: <ShieldCheck size={13} /> },
          { id: 'nonce', label: 'IV/Nonce', icon: <Layers size={13} /> },
          { id: 'keypair', label: 'RSA/ECC Generator', icon: <Lock size={13} /> },
          { id: 'pemder', label: 'PEM ↔ DER Converter', icon: <ArrowLeftRight size={13} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-grow flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium text-xs transition duration-300 cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-semibold shadow-inner' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Secure Random Key Generator */}
        {activeTab === 'random' && (
          <motion.div
            key="random-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Input Options Column */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-5">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Key className="text-teal-400" size={17} />
                Random Key Options
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Byte Capacity ({randomKeySize} bytes)</span>
                  <span className="text-cyan-400 font-mono">{randomKeySize * 8} bits</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={128}
                  step={8}
                  value={randomKeySize}
                  onChange={(e) => setRandomKeySize(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>8 Bytes (64-bit)</span>
                  <span>32 Bytes (256-bit)</span>
                  <span>128 Bytes (1024-bit)</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Output Vector representation</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'hex', name: 'Hex Blocks', desc: '0-9, A-F sequence' },
                    { id: 'base64', name: 'Base64 Block', desc: 'A-Z, a-z alphanumeric' },
                    { id: 'ascii', name: 'Printable ASCII', desc: 'Visual code keys' },
                    { id: 'binary', name: 'Raw binary stream', desc: '0s and 1s array' },
                  ].map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setRandomKeyFormat(format.id as any)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                        randomKeyFormat === format.id 
                          ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <p className="font-semibold">{format.name}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{format.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateRandomKey}
                className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-teal-500/10"
              >
                <RefreshCw size={14} className="animate-spin-once" />
                Generate Random Security Key
              </button>
            </div>

            {/* Output Column */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-300 border-b border-white/10 pb-3">Vector Result</h4>
                {randomKeyOutput ? (
                  <div className="space-y-2">
                    <pre className="p-4 bg-[#0a0f1d]/70 border border-white/10 rounded-xl font-mono text-xs text-teal-300 break-all leading-normal max-h-56 overflow-y-auto select-all pr-12 relative select-text font-bold">
                      {randomKeyOutput}
                      <button
                        onClick={() => triggerCopy(randomKeyOutput)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 p-1.5 rounded bg-white/5 border border-white/5"
                      >
                        {copiedText ? <Check className="text-emerald-400" size={14} /> : <Copy size={14} />}
                      </button>
                    </pre>

                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadPEMFile(randomKeyOutput, `random_key_${randomKeySize}b.${randomKeyFormat === 'hex' ? 'hex' : 'txt'}`)}
                        className="p-1 px-3 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 transition rounded-lg text-[10px] flex items-center gap-1.5 font-bold cursor-pointer"
                      >
                        <Download size={11} /> Download as payload
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <HelpCircle className="mx-auto" size={32} />
                    <p className="text-xs font-semibold text-slate-400">Key Buffer is Vacant</p>
                    <p className="text-[11px] font-sans">Toggle sizing metrics and tap generate to fetch bytes in multiple representation formats.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 text-[9px] text-slate-500 font-mono">
                Entropy validated by browser cryptographic engine window.crypto.getRandomValues.
              </div>
            </div>
          </motion.div>
        )}

        {/* Secure Password Generator with Strength rating */}
        {activeTab === 'pass' && (
          <motion.div
            key="pass-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Parameters column */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="text-teal-400" size={17} />
                Entropy Configuration
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Character Count</span>
                  <span className="text-teal-400 font-mono font-bold">{passLength} symbols</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={passLength}
                  onChange={(e) => setPassLength(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-2.5 pt-2">
                {[
                  { state: passUpper, set: setPassUpper, label: 'Include Uppercase (A-Z)' },
                  { state: passLower, set: setPassLower, label: 'Include Lowercase (a-z)' },
                  { state: passNumbers, set: setPassNumbers, label: 'Include Integers (0-9)' },
                  { state: passSymbols, set: setPassSymbols, label: 'Include Symbols (!@#$%)' },
                  { state: passAvoidAmbiguous, set: setPassAvoidAmbiguous, label: 'Exclude Ambiguous characters (i, l, 1, 0, o, O)' },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={(e) => item.set(e.target.checked)}
                      className="rounded border-white/10 text-teal-400 focus:ring-0 cursor-pointer"
                    />
                    {item.label}
                  </label>
                ))}
              </div>

              <button
                onClick={handleGeneratePassword}
                className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
              >
                Assemble Entropy Key
              </button>
            </div>

            {/* Strength rating and outputs columns */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-300 border-b border-white/10 pb-3">Security Metric Breakdown</h4>
                {passOutput.password ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <pre className="p-4 bg-[#0a0f1d]/70 border border-white/10 rounded-xl font-mono text-sm text-teal-300 break-all leading-normal select-all select-text font-bold pr-12">
                        {passOutput.password}
                        <button
                          onClick={() => triggerCopy(passOutput.password)}
                          className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 p-1.5 rounded bg-white/5 cursor-pointer"
                        >
                          {copiedText ? <Check className="text-emerald-400" size={14} /> : <Copy size={13} />}
                        </button>
                      </pre>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2 text-xs font-sans">
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Bitwise Entropy</span>
                        <h5 className="text-lg font-bold font-mono text-cyan-400">{passOutput.entropyBits} bits</h5>
                      </div>
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Strength Bracket</span>
                        <h5 className={`text-sm font-bold font-mono ${
                          passOutput.strength === 'military' ? 'text-emerald-400' :
                          passOutput.strength === 'strong' ? 'text-cyan-400' :
                          passOutput.strength === 'fair' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {passOutput.strength === 'military' ? 'Military Standard (NSA)' :
                           passOutput.strength === 'strong' ? 'High-Entropy Strong' :
                           passOutput.strength === 'fair' ? 'Standard Fair' : 'Insecure Weak'}
                        </h5>
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#0a0f1d]/50 border border-white/10 rounded-xl text-[11px] text-slate-400 leading-normal flex items-start gap-2 font-sans">
                      <HelpCircle size={14} className="text-teal-400 shrink-0 mt-0.5" />
                      A rating of <span className="text-teal-300 font-semibold font-mono">{passOutput.entropyBits} bits</span> matches an estimated search pool space of <span className="text-teal-300 font-semibold">2^{passOutput.entropyBits}</span> combinations. Crack schedules require massive super-computers operating across millions of GPU years.
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <ShieldCheck className="mx-auto" size={32} />
                    <p className="text-xs font-semibold text-slate-400">Generate Password</p>
                    <p className="text-[11px] font-sans">Define structural limits on checkboxes e.g., integers, uppercase characters and tap Assemble.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 text-[9px] text-slate-500 font-mono">
                Entropy evaluated strictly according to Shannon-Hartley log algorithms.
              </div>
            </div>
          </motion.div>
        )}

        {/* Initialization Nonces & IV configurations */}
        {activeTab === 'nonce' && (
          <motion.div
            key="nonce-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Options */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Layers className="text-teal-400 animate-pulse" size={17} />
                IV/Nonce Parameters
              </h4>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Preset Target Algorithms</label>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    {[
                      { size: 12, label: 'AES-GCM (12B)' },
                      { size: 16, label: 'AES-CBC (16B)' },
                      { size: 8, label: 'Salsa20 (8B)' },
                    ].map((pre) => (
                      <button
                        key={pre.label}
                        onClick={() => setIvSize(pre.size)}
                        className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition ${
                          ivSize === pre.size 
                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' 
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        {pre.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Custom size (bytes): {ivSize}</label>
                  <input
                    type="number"
                    min={4}
                    max={64}
                    value={ivSize}
                    onChange={(e) => setIvSize(Math.max(4, Number(e.target.value)))}
                    className="w-full bg-white/5 border border-white/10 rounded-md p-1.5 font-mono text-[11px] text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Output Format</label>
                  <div className="flex bg-white/5 p-1 rounded-md border border-white/10 text-[11px]">
                    <button
                      onClick={() => setIvOutputFormat('hex')}
                      className={`flex-1 py-1 rounded font-bold cursor-pointer ${ivOutputFormat === 'hex' ? 'bg-teal-500 text-slate-950 shadow-inner' : 'text-slate-400'}`}
                    >
                      Hex Block
                    </button>
                    <button
                      onClick={() => setIvOutputFormat('base64')}
                      className={`flex-1 py-1 rounded font-bold cursor-pointer ${ivOutputFormat === 'base64' ? 'bg-teal-500 text-slate-950 shadow-inner' : 'text-slate-400'}`}
                    >
                      Base64 Format
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateIV}
                className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
              >
                Compile Nonce Bytes
              </button>
            </div>

            {/* Outputs representation */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-300 border-b border-white/10 pb-3">Nonce Vector Result</h4>
                {ivOutput ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <pre className="p-4 bg-[#0a0f1d]/70 border border-white/10 rounded-xl font-mono text-sm text-teal-300 break-all leading-normal select-all select-text font-bold pr-12">
                        {ivOutput}
                        <button
                          onClick={() => triggerCopy(ivOutput)}
                          className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 p-1.5 rounded bg-white/5 cursor-pointer"
                        >
                          {copiedText ? <Check className="text-emerald-400" size={14} /> : <Copy size={13} />}
                        </button>
                      </pre>
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Nonces must never be reused across distinct encryption streams using the same key credentials. Reuse under GCM or ChaCha20 destroys security guarantees instantly, exposing plaintexts to simple XOR-based block analysis.
                    </p>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <Layers className="mx-auto" size={32} />
                    <p className="text-xs font-semibold text-slate-400">Generate IV/Nonce</p>
                    <p className="text-[11px] font-sans">Set target sizes or match algorithms like standard AES GCM (12B) / CBC (16B) and compile Nonce.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 text-[9px] text-slate-500 font-mono">
                Entropy sourced secure browser state buffers.
              </div>
            </div>
          </motion.div>
        )}

        {/* Web Crypto Asymmetric Keypair Generator */}
        {activeTab === 'keypair' && (
          <motion.div
            key="keypair-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Options */}
            <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Lock className="text-teal-400" size={17} />
                Keypair Parameters
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Architecture Base</label>
                  <div className="flex bg-white/5 p-1 rounded-md border border-white/10 text-xs">
                    <button
                      onClick={() => setAsymType('rsa')}
                      className={`flex-1 py-1 rounded font-bold cursor-pointer ${asymType === 'rsa' ? 'bg-teal-500 text-slate-950 shadow-inner' : 'text-slate-400'}`}
                    >
                      RSA
                    </button>
                    <button
                      onClick={() => setAsymType('ecc')}
                      className={`flex-1 py-1 rounded font-bold cursor-pointer ${asymType === 'ecc' ? 'bg-teal-500 text-slate-950 shadow-inner' : 'text-slate-400'}`}
                    >
                      ECC (ECDSA)
                    </button>
                  </div>
                </div>

                {asymType === 'rsa' ? (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">RSA Key Length (Modulus bits)</label>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                      {['2048', '3072', '4096'].map((bits) => (
                        <button
                          key={bits}
                          onClick={() => setRsaBits(bits as any)}
                          className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition ${
                            rsaBits === bits 
                              ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' 
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}
                        >
                          {bits}b
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">ECC Named Curve</label>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                      {['P-256', 'P-384', 'P-521'].map((curve) => (
                        <button
                          key={curve}
                          onClick={() => setEccCurve(curve as any)}
                          className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition ${
                            eccCurve === curve 
                              ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' 
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}
                        >
                          {curve}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerateAsymKeys}
                disabled={isGeneratingKeys}
                className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isGeneratingKeys ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    Calculating Math Matrix...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Generate Keypair
                  </>
                )}
              </button>
            </div>

            {/* Generated results column */}
            <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-300 border-b border-white/10 pb-3">Cryptographic PEM Keypair blocks</h4>
                {generatedKeys ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Public Key Block (SPKI)</span>
                        <div className="flex gap-1">
                          <button onClick={() => triggerCopy(generatedKeys.public)} className="p-1 hover:text-white rounded bg-white/5 cursor-pointer">
                            <Copy size={11} />
                          </button>
                          <button onClick={() => downloadPEMFile(generatedKeys.public, 'public_key.pem')} className="p-1 hover:text-white rounded bg-white/5 cursor-pointer">
                            <Download size={11} />
                          </button>
                        </div>
                      </div>
                      <pre className="p-3 bg-[#0a0f1d]/75 border border-white/10 rounded-xl h-44 overflow-y-auto text-[10px] text-teal-400 leading-normal select-all select-text pr-2 scrollbar-thin">
                        {generatedKeys.public}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Private Key Block (PKCS8)</span>
                        <div className="flex gap-1">
                          <button onClick={() => triggerCopy(generatedKeys.private)} className="p-1 hover:text-white rounded bg-white/5 cursor-pointer">
                            <Copy size={11} />
                          </button>
                          <button onClick={() => downloadPEMFile(generatedKeys.private, 'private_key.pem')} className="p-1 hover:text-white rounded bg-white/5 cursor-pointer">
                            <Download size={11} />
                          </button>
                        </div>
                      </div>
                      <pre className="p-3 bg-[#0a0f1d]/75 border border-white/10 rounded-xl h-44 overflow-y-auto text-[10px] text-teal-400 leading-normal select-all select-text pr-2 scrollbar-thin">
                        {generatedKeys.private}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <Lock className="mx-auto" size={32} />
                    <p className="text-xs font-semibold text-slate-400">Keypair Pipeline is Quiet</p>
                    <p className="text-[11px] font-sans">Symmetric encryption uses identical passphrases. Asymmetric configurations create complementary channels for secure key distribution.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 text-[9px] text-slate-500 font-mono">
                Key generation uses standard non-blocking Web Crypto primes generation blocks within the browser sandbox.
              </div>
            </div>
          </motion.div>
        )}

        {/* PEM ↔ DER Converter */}
        {activeTab === 'pemder' && (
          <motion.div
            key="pemder-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* PEM to DER */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center justify-between border-b border-white/10 pb-2">
                <span>PEM ➔ DER block Hexadecimal</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10">Base64 to Hex</span>
              </h4>

              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">PEM Key input Block</label>
                  <textarea
                    rows={4}
                    value={pemInput}
                    onChange={(e) => setPemInput(e.target.value)}
                    placeholder="Paste unencrypted Public/Private PEM blocks e.g. -----BEGIN PUBLIC KEY-----..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200 text-xs font-mono placeholder-slate-600 outline-none focus:border-teal-500/50 resize-none"
                  />
                </div>

                <button
                  onClick={handlePemToDer}
                  className="w-full h-10 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-xs"
                >
                  <ArrowLeftRight size={13} /> Converter PEM to DER Bytes
                </button>

                {pemToDerError && (
                  <p className="text-[11px] text-rose-400 font-bold font-mono">{pemToDerError}</p>
                )}

                {derOutput && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">DER Hex Bytes sequence</span>
                    <pre className="p-3 bg-[#0a0f1d]/75 border border-white/10 rounded-xl text-[10px] text-teal-400 font-mono break-all font-semibold leading-relaxed max-h-24 overflow-y-auto select-all pr-12 relative select-text">
                      {derOutput}
                      <button
                        onClick={() => triggerCopy(derOutput)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 p-1 rounded bg-white/5 cursor-pointer"
                      >
                        <Copy size={11} />
                      </button>
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* DER to PEM */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center justify-between border-b border-white/10 pb-2">
                <span>DER Hex bytes ➔ PEM envelope</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10">Hex to Base64</span>
              </h4>

              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">DER Raw Hex bytes string</label>
                  <textarea
                    rows={4}
                    value={derInput}
                    onChange={(e) => setDerInput(e.target.value)}
                    placeholder="Enter space or block-delimited hexadecimal DER bytes (e.g., 30 82 01 0a...)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200 text-xs font-mono placeholder-slate-600 outline-none focus:border-teal-500/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Envelope boundaries Header</label>
                    <select
                      value={pemHeaderType}
                      onChange={(e) => setPemHeaderType(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-slate-300 outline-none font-bold cursor-pointer"
                    >
                      <option value="PUBLIC KEY" className="bg-slate-900">PUBLIC KEY</option>
                      <option value="PRIVATE KEY" className="bg-slate-900">PRIVATE KEY</option>
                      <option value="CERTIFICATE" className="bg-slate-900">CERTIFICATE</option>
                      <option value="RSA PRIVATE KEY" className="bg-slate-900">RSA PRIVATE KEY</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleDerToPem}
                      className="w-full h-9 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-xs"
                    >
                      <ArrowLeftRight size={13} /> Compile PEM
                    </button>
                  </div>
                </div>

                {derToPemError && (
                  <p className="text-[11px] text-rose-400 font-bold font-mono">{derToPemError}</p>
                )}

                {pemOutput && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">PEM Content block wrapping</span>
                    <pre className="p-3 bg-[#0a0f1d]/75 border border-white/10 rounded-xl text-[10px] text-teal-400 font-mono break-all font-semibold leading-relaxed max-h-24 overflow-y-auto select-all pr-12 relative select-text">
                      {pemOutput}
                      <button
                        onClick={() => triggerCopy(pemOutput)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 p-1 rounded bg-white/5 cursor-pointer"
                      >
                        <Copy size={11} />
                      </button>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
