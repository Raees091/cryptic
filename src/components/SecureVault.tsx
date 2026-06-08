/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, ShieldAlert, Lock, Unlock, Plus, Trash2, Search, Eye, EyeOff, Save,
  CheckCircle2, FolderKey, FileText, Calendar, NotebookPen, RefreshCw, KeyRound, Copy, Check
} from 'lucide-react';
import { encryptAESGCM, decryptAESGCM, stringToBytes, bytesToString, bytesToBase64, base64ToBytes } from '../utils/crypto';
import { SecureNote } from '../types';

export default function SecureVault() {
  const [vaultPassword, setVaultPassword] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [hasExistingVault, setHasExistingVault] = useState<boolean>(false);
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Notes state
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [decryptedBodies, setDecryptedBodies] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // New Note state
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Copy success indicator
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  useEffect(() => {
    // Check if there are notes already stored in localStorage
    const savedNotes = localStorage.getItem('__cryptic_vault_notes');
    if (savedNotes) {
      setHasExistingVault(true);
    }
  }, []);

  // Unlock the vault using PBKDF2 GCM validation
  const handleUnlockAndLoad = async () => {
    if (!vaultPassword) return;
    setUnlockError(null);

    try {
      const storedNotesStr = localStorage.getItem('__cryptic_vault_notes');
      if (storedNotesStr) {
        const encryptedNotesList = JSON.parse(storedNotesStr) as SecureNote[];
        
        // Let's attempt to decrypt the first note to verify if password is valid
        if (encryptedNotesList.length > 0) {
          const firstNote = encryptedNotesList[0];
          const encryptedBytes = base64ToBytes(firstNote.encryptedContent);
          
          // If decryption fails, this catches
          await decryptAESGCM(encryptedBytes, vaultPassword, 100000);
        }

        setNotes(encryptedNotesList);
      } else {
        // Vault is empty. Set storage to empty array to initialize
        localStorage.setItem('__cryptic_vault_notes', JSON.stringify([]));
        setNotes([]);
      }

      setIsUnlocked(true);
    } catch (err: any) {
      console.error(err);
      setUnlockError('Incorrect master key: Authentication signature failed GCM validation.');
    }
  };

  // Lock vault - Clear memory credentials
  const handleLockVault = () => {
    setIsUnlocked(false);
    setVaultPassword('');
    setNotes([]);
    setDecryptedBodies({});
    setSelectedNoteId(null);
  };

  // Add new secure note with instant AES-250-GCM encryption
  const handleCreateNote = async () => {
    if (!newNoteTitle || !newNoteContent || !vaultPassword) return;
    setIsSaving(true);

    try {
      // 1. Encrypt note body using aes-256-gcm & master vault key
      const bodyBytes = stringToBytes(newNoteContent);
      const encResult = await encryptAESGCM(bodyBytes, vaultPassword, 100000);
      const encB64 = bytesToBase64(encResult.combined);

      // 2. Build secure note envelope structure
      const newNote: SecureNote = {
        id: crypto.randomUUID(),
        title: newNoteTitle,
        encryptedContent: encB64,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 3. Save to state and localStorage
      const updatedNotes = [newNote, ...notes];
      localStorage.setItem('__cryptic_vault_notes', JSON.stringify(updatedNotes));
      
      // Update local memory state
      setNotes(updatedNotes);
      setDecryptedBodies(prev => ({
        ...prev,
        [newNote.id]: newNoteContent
      }));

      // Reset input state
      setNewNoteTitle('');
      setNewNoteContent('');
      setSelectedNoteId(newNote.id);
      setHasExistingVault(true);
    } catch (err) {
      console.error(err);
      alert('Encryption logic failure. Vault is currently in a frozen state.');
    } finally {
      setIsSaving(false);
    }
  };

  // Decrypt selected note on demand (lazy decryption logic)
  const decryptNoteOnDemand = async (noteId: string) => {
    const targetNote = notes.find(n => n.id === noteId);
    if (!targetNote || decryptedBodies[noteId]) {
      setSelectedNoteId(noteId);
      return; // Already cached in memory state
    }

    try {
      const encryptedBytes = base64ToBytes(targetNote.encryptedContent);
      const plainBytes = await decryptAESGCM(encryptedBytes, vaultPassword, 100000);
      const plainText = bytesToString(plainBytes);

      setDecryptedBodies(prev => ({
        ...prev,
        [noteId]: plainText
      }));
      setSelectedNoteId(noteId);
    } catch (err: any) {
      console.error(err);
      alert('Decryption failed for note. Internal ciphertext is corrupted.');
    }
  };

  // Delete note from vault and update localStorage
  const handleDeleteNote = (noteId: string) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this secure note? This action is irreversible.')) {
      return;
    }
    const updated = notes.filter(n => n.id !== noteId);
    localStorage.setItem('__cryptic_vault_notes', JSON.stringify(updated));
    setNotes(updated);

    // clean caches
    const updatedDecrypted = { ...decryptedBodies };
    delete updatedDecrypted[noteId];
    setDecryptedBodies(updatedDecrypted);

    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
    if (updated.length === 0) {
      setHasExistingVault(false);
    }
  };

  const copyNoteText = (noteId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccessId(noteId);
    setTimeout(() => setCopySuccessId(null), 1500);
  };

  // Filter notes by search query
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Vault entry portal */}
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div
            key="vault-locked"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto text-center py-12 p-8 bg-white/5 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 mx-auto shadow-xl shadow-teal-500/10">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[22px] flex items-center justify-center">
                <FolderKey className="text-teal-400 font-extrabold animate-pulse" size={32} />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-100 tracking-tight">
                {hasExistingVault ? 'Unlock Vault' : 'Initialize Note Vault'}
              </h3>
              <p className="text-xs text-slate-500 px-2 leading-relaxed font-sans">
                {hasExistingVault 
                  ? 'Your vault contains locally saved cryptographic documents. Input private master decryption key.'
                  : 'Establish a new key database with client-side credential persistence. Set highly secure Master Key.'}
              </p>
            </div>

            <div className="space-y-4 font-sans">
              <div className="relative">
                <input
                  type={showPasswordInput ? 'text' : 'password'}
                  value={vaultPassword}
                  id="vaultMasterPassword"
                  onChange={(e) => setVaultPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUnlockAndLoad();
                  }}
                  placeholder="Master Passphrase / PIN Key..."
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/30 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-600 outline-none transition duration-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPasswordInput ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleUnlockAndLoad}
                disabled={!vaultPassword}
                id="unlockVaultBtn"
                className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold rounded-xl transition duration-300 shadow-md select-none active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {hasExistingVault ? 'Decrypt & Unlock Vault' : 'Initialize New Vault'}
              </button>

              {unlockError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex items-start gap-2 text-left">
                  <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="vault-unlocked"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Left Nav: Note search and creations list */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="text-teal-400" size={18} />
                  <span className="text-xs font-mono font-bold text-teal-400 tracking-wider uppercase">Vault Active</span>
                </div>
                <button
                  onClick={handleLockVault}
                  className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 text-xs rounded-lg transition duration-200 cursor-pointer"
                >
                  Lock Vault
                </button>
              </div>

              {/* Note creator block */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg space-y-3.5 backdrop-blur-xl">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <NotebookPen className="text-cyan-400" size={16} />
                  Create Secure Credentials
                </h4>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={newNoteTitle}
                    id="newNoteTitle"
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Credential Reference or Title (e.g. Bank Account)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs placeholder-slate-600 outline-none focus:border-teal-500"
                  />
                  <textarea
                    rows={3}
                    value={newNoteContent}
                    id="newNoteContent"
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Enter highly sensitive values (e.g., card numbers, recovery seeds, API codes etc.) which will be instantly encrypted..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-slate-200 text-xs placeholder-slate-600 outline-none focus:border-teal-500 resize-none font-mono"
                  />
                  <button
                    onClick={handleCreateNote}
                    disabled={!newNoteTitle || !newNoteContent || isSaving}
                    id="saveNoteBtn"
                    className="w-full h-9 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition duration-200 disabled:opacity-40 cursor-pointer"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={13} /> : <Plus size={13} />}
                    Encrypt & Save to Disk
                  </button>
                </div>
              </div>

              {/* Search note bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-600" />
                <input
                  type="text"
                  value={searchQuery}
                  id="searchQuery"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Identify envelope references..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-9 py-2.5 text-slate-300 text-xs placeholder-slate-600 outline-none focus:border-cyan-600 transition"
                />
              </div>

              {/* Secure Notes index list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredNotes.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-600 italic">No credentials found in database.</p>
                ) : (
                  filteredNotes.map(n => {
                    const isSelected = selectedNoteId === n.id;
                    return (
                      <div
                        key={n.id}
                        onClick={() => decryptNoteOnDemand(n.id)}
                        className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex justify-between items-start ${
                          isSelected 
                            ? 'bg-white/10 border-white/20 shadow-inner' 
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1 truncate max-w-[80%]">
                          <p className="text-slate-200 font-medium text-xs truncate">{n.title}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Calendar size={10} />
                            <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                            <span className="text-emerald-400 font-mono font-medium">AES-256</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(n.id);
                          }}
                          className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition duration-200 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel: Content viewer and decrypted states */}
            <div className="md:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[380px]">
              {selectedNoteId && notes.find(n => n.id === selectedNoteId) ? (
                (() => {
                  const activeNote = notes.find(n => n.id === selectedNoteId)!;
                  const rawDecrypted = decryptedBodies[activeNote.id];
                  
                  return (
                    <div className="space-y-5 h-full flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <div className="space-y-0.5">
                            <h3 className="font-bold text-slate-100 text-base">{activeNote.title}</h3>
                            <p className="text-[10px] text-slate-500 font-mono">UUID: {activeNote.id}</p>
                          </div>
                          <span className="px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono text-[9px] rounded-full uppercase">
                            Authenticated GCM Mode
                          </span>
                        </div>

                        {/* Ciphertext view */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Encrypted Blob (Stored in LocalStorage)</span>
                          <pre className="p-3 bg-[#0a0f1d]/50 border border-white/10 rounded-xl font-mono text-[9px] text-[#A0AEC0] truncate select-all leading-normal max-h-12 overflow-y-hidden shadow-inner">
                            {activeNote.encryptedContent}
                          </pre>
                        </div>

                        {/* Decrypted plaintext */}
                        <div className="space-y-1.5 flex-1 flex flex-col">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-[#E2E8F0] uppercase tracking-wide">Decrypted Result</span>
                            {rawDecrypted && (
                              <button
                                onClick={() => copyNoteText(activeNote.id, rawDecrypted)}
                                className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 focus:outline-none cursor-pointer"
                              >
                                {copySuccessId === activeNote.id ? (
                                  <>
                                    <Check size={11} className="text-emerald-400" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    Copy Value
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          
                          <div className="flex-1 min-h-[140px] bg-[#0a0f1d]/50 border border-white/10 rounded-xl p-4 font-mono text-xs text-slate-200 select-text whitespace-pre-wrap leading-relaxed shadow-inner">
                            {rawDecrypted || 'Decrypting value...'}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 text-[10px] text-slate-500 flex items-center gap-2">
                        <Lock size={10} className="text-teal-400" />
                        <span>Decrypted credentials exist only in volatile Javascript memory state. Note will automatically compile and lock upon closing the page.</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0a0f1d]/50 border border-white/10 flex items-center justify-center text-slate-500">
                    <FileText size={20} />
                  </div>
                  <h4 className="text-slate-300 font-semibold text-sm">No Document Selected</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-sans">
                    Select a credential record from the left navigation rail, or fill out the creation module to compile a brand new encrypted record.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
