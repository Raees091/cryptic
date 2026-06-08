/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeftRight, FileText, FileCode, CheckCircle2, HelpCircle, 
  Copy, Check, ShieldCheck, Share2, UploadCloud, Download, Eye
} from 'lucide-react';
import { 
  textToBinary, binaryToText, textToHex, hexToText, 
  decodeJWT, encodeHTMLEntities, decodeHTMLEntities 
} from '../utils/cryptoHelpers';

type EncodeMode = 'base64' | 'hexbinurl' | 'jwt' | 'html';

export default function EncoderDecoder() {
  const [activeTab, setActiveTab] = useState<EncodeMode>('base64');
  const [copiedText, setCopiedText] = useState(false);

  // General Text Box states
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [errorLog, setErrorLog] = useState('');

  // Base64 File/Image State
  const [b64File, setB64File] = useState<File | null>(null);
  const [b64FileResult, setB64FileResult] = useState('');
  const [b64InputText, setB64InputText] = useState('');
  const [b64OutputText, setB64OutputText] = useState('');
  const [b64IncludePrefix, setB64IncludePrefix] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-tabs for Hex / Binary / URL
  const [hexBinUrlSubTab, setHexBinUrlSubTab] = useState<'hex' | 'bin' | 'url'>('hex');
  const [spacingChar, setSpacingChar] = useState<' ' | ':' | 'none'>(' ');

  // JWT Decoder states
  const [jwtToken, setJwtToken] = useState('');
  const [jwtResult, setJwtResult] = useState<any>(null);

  // HTML Entity States
  const [htmlInputText, setHtmlInputText] = useState('');
  const [htmlOutputText, setHtmlOutputText] = useState('');

  const triggerCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Base64 Text encoding/decoding reactive execution
  useEffect(() => {
    if (!b64InputText) {
      setB64OutputText('');
      return;
    }
    try {
      setErrorLog('');
      const utf8Bytes = new TextEncoder().encode(b64InputText);
      const b64 = btoa(String.fromCharCode(...utf8Bytes));
      setB64OutputText(b64);
    } catch (err: any) {
      setErrorLog(err.message || "Encoding error");
    }
  }, [b64InputText]);

  const handleBase64Decode = () => {
    if (!b64OutputText) return;
    try {
      setErrorLog('');
      const binaryString = atob(b64OutputText.trim());
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const rawText = new TextDecoder().decode(bytes);
      setB64InputText(rawText);
    } catch (err: any) {
      setErrorLog("Failed decoding Base64 payload: Check for invalid standard padding blocks.");
    }
  };

  // Base64 File loader converter
  const processBase64File = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const fullDataUrl = reader.result;
        if (b64IncludePrefix) {
          setB64FileResult(fullDataUrl);
        } else {
          const rawBase64 = fullDataUrl.split(',')[1] || '';
          setB64FileResult(rawBase64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDropB64File = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setB64File(file);
      processBase64File(file);
    }
  };

  const handleB64FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setB64File(file);
      processBase64File(file);
    }
  };

  // Reactive URL | Hex | Binary converter pipeline
  useEffect(() => {
    if (!inputText) {
      setOutputText('');
      setErrorLog('');
      return;
    }

    try {
      setErrorLog('');
      if (hexBinUrlSubTab === 'hex') {
        const delim = spacingChar === 'none' ? '' : spacingChar;
        setOutputText(textToHex(inputText, delim));
      } else if (hexBinUrlSubTab === 'bin') {
        setOutputText(textToBinary(inputText));
      } else if (hexBinUrlSubTab === 'url') {
        setOutputText(encodeURIComponent(inputText));
      }
    } catch (err: any) {
      setErrorLog(err.message || "Failed running compiler");
    }
  }, [inputText, hexBinUrlSubTab, spacingChar]);

  const handleHexBinUrlDecode = () => {
    if (!outputText) return;
    try {
      setErrorLog('');
      if (hexBinUrlSubTab === 'hex') {
        setInputText(hexToText(outputText));
      } else if (hexBinUrlSubTab === 'bin') {
        setInputText(binaryToText(outputText));
      } else if (hexBinUrlSubTab === 'url') {
        setInputText(decodeURIComponent(outputText));
      }
    } catch (err: any) {
      setErrorLog("Compilation error: verify input blocks conform strictly to layout representations.");
    }
  };

  // JWT Decoding reactive pipeline
  useEffect(() => {
    if (!jwtToken) {
      setJwtResult(null);
      return;
    }
    const decoded = decodeJWT(jwtToken);
    setJwtResult(decoded);
  }, [jwtToken]);

  // HTML Entity pipeline
  useEffect(() => {
    if (!htmlInputText) {
      setHtmlOutputText('');
      return;
    }
    setHtmlOutputText(encodeHTMLEntities(htmlInputText));
  }, [htmlInputText]);

  const handleHtmlDecode = () => {
    if (!htmlOutputText) return;
    setHtmlInputText(decodeHTMLEntities(htmlOutputText));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Sub tabs container */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md max-w-lg mx-auto shadow-lg">
        {[
          { id: 'base64', label: 'Base64 Streamer', icon: <ArrowLeftRight size={13} /> },
          { id: 'hexbinurl', label: 'Hex / Bin / URL', icon: <FileText size={13} /> },
          { id: 'jwt', label: 'JWT Claim Inspector', icon: <FileCode size={13} /> },
          { id: 'html', label: 'HTML Entity escape', icon: <Share2 size={13} /> },
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
        {/* Base64 Encoding & File Packing Panel */}
        {activeTab === 'base64' && (
          <motion.div
            key="base64-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Base64 Text block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <FileText className="text-teal-400" size={17} />
                    Asymmetric UTF-8 String Plaintext
                  </h4>
                  <textarea
                    rows={5}
                    value={b64InputText}
                    onChange={(e) => setB64InputText(e.target.value)}
                    placeholder="Enter standard human-readable text string (contains full UTF-8 emoji support)..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200 text-xs placeholder-slate-600 outline-none resize-none font-sans"
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={handleBase64Decode}
                    disabled={!b64OutputText}
                    className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40"
                  >
                    ← Decode Base64 Payload to Left
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">Real-time ASCII stream</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <ArrowLeftRight className="text-teal-400" size={17} />
                    Base64 Representation block
                  </h4>
                  <textarea
                    rows={5}
                    value={b64OutputText}
                    onChange={(e) => setB64OutputText(e.target.value)}
                    placeholder="Pasted standard base64 blocks can be reverse decoded to plaintext using the lower decode triggers..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-teal-300 text-xs font-mono placeholder-slate-600 outline-none resize-none break-all"
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => triggerCopy(b64OutputText)}
                    disabled={!b64OutputText}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    {copiedText ? <Check size={12} /> : <Copy size={12} />}
                    Copy Result Block
                  </button>
                  {errorLog && <span className="text-[10px] text-rose-400 font-bold font-mono text-right max-w-[60%] truncate">{errorLog}</span>}
                </div>
              </div>
            </div>

            {/* Base64 media & file packager drag n drop */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <h4 className="text-sm font-semibold text-slate-300">File-to-Base64 Packer Channel</h4>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropB64File}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-teal-400/50 bg-white/5 p-8 text-center rounded-xl cursor-pointer transition flex flex-col items-center justify-center min-h-[160px]"
                >
                  <input type="file" ref={fileInputRef} onChange={handleB64FileChange} className="hidden" />
                  <UploadCloud className="text-teal-400 mb-2" size={24} />
                  <p className="text-xs text-slate-300 font-semibold mb-1">Drag file or Browse image payload</p>
                  <p className="text-[10px] text-slate-500 font-sans">Encode high-res images, PDFs, or small keys directly</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Include URI Mime Prefix (e.g. data:image/png;base64)</span>
                  <input
                    type="checkbox"
                    checked={b64IncludePrefix}
                    onChange={(e) => {
                      setB64IncludePrefix(e.target.checked);
                      if (b64File) processBase64File(b64File);
                    }}
                    className="rounded border-white/10 text-teal-400 bg-white/5 cursor-pointer"
                  />
                </div>
              </div>

              {/* Base64 file representation outcome */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Embedded File Base64 Code string</span>
                  {b64FileResult ? (
                    <div className="relative">
                      <pre className="p-3 bg-[#0a0f1d]/60 border border-white/10 rounded-xl font-mono text-[10px] text-teal-400 select-all max-h-36 overflow-y-auto leading-normal break-all select-text font-bold pr-12">
                        {b64FileResult}
                      </pre>
                      <button
                        onClick={() => triggerCopy(b64FileResult)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white p-1 rounded bg-white/5 cursor-pointer"
                      >
                        {copiedText ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500">
                      <p className="text-xs font-semibold">Base64 Output Empty</p>
                      <p className="text-[10px] font-sans">Binary data strings will yield complete representation parameters here.</p>
                    </div>
                  )}
                </div>

                {b64FileResult && (
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>MIME Type detected matching input: {b64File?.type || 'Unknown'}</span>
                    <span>Length: {b64FileResult.length.toLocaleString()} symbols</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Real-time Hex / Binary / URL Encoders */}
        {activeTab === 'hexbinurl' && (
          <motion.div
            key="hexbinurl-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Options layout */}
            <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 border-b border-white/10 pb-2">Encoder Pipeline Select</h4>
              
              <div className="flex p-1 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold">
                {[
                  { id: 'hex', label: 'HEX' },
                  { id: 'bin', label: 'BINARY' },
                  { id: 'url', label: 'URL' },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setHexBinUrlSubTab(sub.id as any)}
                    className={`flex-1 py-1.5 rounded cursor-pointer text-center text-[11px] ${hexBinUrlSubTab === sub.id ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {hexBinUrlSubTab === 'hex' && (
                <div className="space-y-2 pt-2 text-xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Spacing Delimiters</label>
                  <div className="flex bg-white/5 border border-white/10 rounded-md p-0.5 text-[11px]">
                    {[
                      { id: ' ', label: 'Space (" ")' },
                      { id: ':', label: 'Colons (":")' },
                      { id: 'none', label: 'Compact' },
                    ].map(del => (
                      <button
                        key={del.id}
                        onClick={() => setSpacingChar(del.id as any)}
                        className={`flex-1 py-1 rounded cursor-pointer text-center ${spacingChar === del.id ? 'bg-teal-500/10 text-teal-300 font-bold' : 'text-slate-400'}`}
                      >
                        {del.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400 leading-normal font-sans pt-2">
                {hexBinUrlSubTab === 'hex' && 'Hexadecimal translations capture raw byte matrices. Perfect for low-level cryptographic signatures verification.'}
                {hexBinUrlSubTab === 'bin' && 'Binary representations show space-separated 8-bit stream arrays representing literal UTF-8 byte definitions.'}
                {hexBinUrlSubTab === 'url' && 'URL compilers translate space and special punctuation components into browser accessible URI percent formats.'}
              </p>
            </div>

            {/* Input Output block */}
            <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">ASCII Plaintext</label>
                  <textarea
                    rows={6}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter plain text characters here..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200 text-xs font-mono placeholder-slate-600 outline-none resize-none"
                  />
                  <button
                    onClick={handleHexBinUrlDecode}
                    disabled={!outputText}
                    className="w-full py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 font-semibold rounded-lg text-[10px] cursor-pointer disabled:opacity-40"
                  >
                    ← Reverse Decode Represented Block To Plaintext
                  </button>
                </div>

                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Formatted Compiler Output</label>
                  <textarea
                    rows={6}
                    value={outputText}
                    onChange={(e) => setOutputText(e.target.value)}
                    placeholder="Output structures are derived instantly above..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-teal-300 text-xs placeholder-slate-600 outline-none resize-none break-all"
                  />
                  <button
                    onClick={() => triggerCopy(outputText)}
                    disabled={!outputText}
                    className="w-full py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-lg text-[10px] flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    <Copy size={11} /> Copy Compiler Result
                  </button>
                </div>
              </div>

              {errorLog && (
                <p className="text-[11px] text-rose-400 font-bold font-mono text-center">{errorLog}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* JSON Web Token Claims Inspector */}
        {activeTab === 'jwt' && (
          <motion.div
            key="jwt-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Token entry column */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <FileCode className="text-teal-400 animate-pulse" size={17} />
                JWT Payload Vector
              </h4>
              <textarea
                rows={7}
                value={jwtToken}
                onChange={(e) => setJwtToken(e.target.value)}
                placeholder="Paste JSON Web Token string starting with 'eyJ...' (dots represent header, payload, signature delimiters)..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-cyan-300 text-xs font-mono placeholder-slate-600 outline-none resize-none break-all"
              />
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                JWTs are decoded in Javascript using base64url word transformations. Decoders display exact claims structures. Note: We do not store signature key secrets, checking parameters only.
              </p>
            </div>

            {/* Claims outputs Column */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-300 border-b border-white/10 pb-3">JWT Structured Claims</h4>
                {jwtResult ? (
                  jwtResult.valid ? (
                    <div className="space-y-4 text-xs font-mono">
                      {/* Header block */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Header Metadata (Algorithms)</span>
                        <pre className="p-3 bg-[#0a0f1d]/60 border border-white/10 rounded-xl text-[11px] text-amber-300 max-h-24 overflow-y-auto leading-relaxed font-semibold">
                          {JSON.stringify(jwtResult.header, null, 2)}
                        </pre>
                      </div>

                      {/* Payload claims */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Payload JSON Claims set</span>
                        <pre className="p-3 bg-[#0a0f1d]/60 border border-white/10 rounded-xl text-[11px] text-teal-300 max-h-48 overflow-y-auto leading-relaxed font-semibold scrollbar-thin">
                          {JSON.stringify(jwtResult.payload, null, 2)}
                        </pre>
                      </div>

                      {/* Expiration warning flags */}
                      {(() => {
                        const payload = jwtResult.payload;
                        if (payload && typeof payload.exp === 'number') {
                          const expMs = payload.exp * 1000;
                          const isExpired = Date.now() > expMs;
                          return (
                            <div className={`p-3 rounded-lg border flex items-center justify-between font-sans ${isExpired ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                              <span className="text-[11px] font-semibold flex items-center gap-1">
                                <ShieldCheck size={13} />
                                Expiration status: {isExpired ? 'TOKEN EXPIRED' : 'ACTIVE CLAIMS SECURE'}
                              </span>
                              <span className="text-[10px] font-mono font-bold">
                                {new Date(expMs).toLocaleDateString()} {new Date(expMs).toLocaleTimeString()}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-mono font-semibold">
                      Parsing Error: {jwtResult.error}
                    </div>
                  )
                ) : (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <FileCode className="mx-auto" size={32} />
                    <p className="text-xs font-semibold text-slate-400">Claims Inspection Pipeline Silent</p>
                    <p className="text-[11px] font-sans">Input a valid standard dot segment JWT code string to parse structural dictionaries instantly.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 text-[9px] text-slate-500 font-mono">
                Decoded parameters exist only in private local storage context.
              </div>
            </div>
          </motion.div>
        )}

        {/* HTML Entity Escapers */}
        {activeTab === 'html' && (
          <motion.div
            key="html-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Plaintext card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <FileText className="text-teal-400" size={17} />
                  Raw String Payload
                </h4>
                <textarea
                  rows={6}
                  value={htmlInputText}
                  onChange={(e) => setHtmlInputText(e.target.value)}
                  placeholder="Paste markup text that contains unsafe HTML brackets like <script>alert(1);</script>..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200 text-xs font-mono placeholder-slate-600 outline-none resize-none"
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleHtmlDecode}
                  disabled={!htmlOutputText}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40"
                >
                  ← Unescape HTML Entities Left
                </button>
                <span className="text-[10px] text-slate-500 font-mono">XSS sanitization</span>
              </div>
            </div>

            {/* Entity Encoded outcome card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3 font-mono">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <FileCode className="text-teal-400" size={17} />
                  HTML Entity Encoded block
                </h4>
                <textarea
                  rows={6}
                  value={htmlOutputText}
                  onChange={(e) => setHtmlOutputText(e.target.value)}
                  placeholder="Sanitized entities appear here in real time..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-teal-300 text-xs placeholder-slate-600 outline-none resize-none"
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => triggerCopy(htmlOutputText)}
                  disabled={!htmlOutputText}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  {copiedText ? <Check size={12} /> : <Copy size={12} />}
                  Copy Encoded Entities
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
