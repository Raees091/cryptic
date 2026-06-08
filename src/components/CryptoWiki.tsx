/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Cpu, Database, Eye, Zap, Key } from 'lucide-react';

export default function CryptoWiki() {
  const articles = [
    {
      title: 'AES-256 GCM',
      subtitle: 'Galois/Counter Mode (AEAD)',
      icon: <Shield size={18} className="text-teal-400" />,
      desc: 'Advanced Encryption Standard using Galois/Counter Mode is the pinnacle of modern symmetric encryption. GCM is an Authenticated Encryption with Associated Data (AEAD) formulation, meaning it doesn\'t just hide file contents—it also appends an authentication tag. If even a single bit of the file is flipped or tampered with on disk, decryption instantly fails.',
      bullets: [
        'Authenticated encryption prevents bit-flipping attacks',
        'Parallelizable computation supports extremely rapid encryption / decryption speeds',
        'Industry standard: adopted by TLS 1.3, SSH, and secure military communications'
      ]
    },
    {
      title: 'AES-256 CBC',
      subtitle: 'Cipher Block Chaining',
      icon: <Lock size={18} className="text-cyan-400" />,
      desc: 'CBC is a classic block cipher mode that links blocks sequentially. Each plain text block is XORed with the preceding cipher text block before encryption. It requires standard PKCS7 alignment padding to ensure files fit perfectly into 16-byte block boundaries. Unlike GCM, it has no native authentication tag unless linked to an external HMAC scheme.',
      bullets: [
        'Requires an initialization vector (IV) of exactly 16 bytes',
        'Sequential architecture means it cannot be parallelized easily',
        'Prone to padding oracle attacks if decrypted plaintext error messages leak details'
      ]
    },
    {
      title: 'ChaCha20-Poly1305',
      subtitle: 'Modern Stream Cipher AEAD',
      icon: <Zap size={18} className="text-amber-400" />,
      desc: 'ChaCha20-Poly1305 is a cutting-edge stream cipher designed by Daniel J. Bernstein. It couples the ChaCha20 stream cipher with the Poly1305 message authenticator to achieve high-security AEAD properties. Traditionally, it is substantially faster than AES on portable consumer processors (like phones or smartwatches) which lack specialized AES hardware acceleration pipelines.',
      bullets: [
        'Uses a 256-bit secret key and 96-bit (12-byte) unique nonces',
        'Exceptionally robust against side-channel cache-timing attacks',
        'Widespread implementation in modern security layers such as WireGuard VPN and SSH'
      ]
    },
    {
      title: 'PBKDF2 Key Derivation',
      subtitle: 'Password-Based Key Derivation Function 2',
      icon: <Key size={18} className="text-indigo-400" />,
      desc: 'An encryption algorithm requires a random, high-entropy 256-bit key. Human passwords, however, are low-entropy string statements. PBKDF2 acts as a cryptographic key stretcher: it takes the raw password, appends a random salt (to block pre-computed rainbow table shortcuts), and spins a SHA-256 hash function hundreds of thousands of times recursively. This massive computational loop makes brute-force dictionary attacks impossibly expensive for attackers.',
      bullets: [
        'Combines password inputs with randomized 128-bit salts',
        'Configurable loop iteration sizes (e.g., standard 100k, extra-strong 600k)',
        'Effectively mitigates CPU/GPU-driven parallel brute-force crackers'
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h3 className="text-2xl font-bold text-slate-100 tracking-tight">Symmetric Cryptography Manual</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-sans">
          Symmetric cryptography utilizes the same shared secret passphrase both to encrypt original plaintext files and to restore/decrypt them. Examine the mechanical definitions below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((art, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl hover:border-white/20 transition-all duration-300 backdrop-blur-xl"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  {art.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 tracking-tight leading-none">{art.title}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">{art.subtitle}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                {art.desc}
              </p>
            </div>

            <div className="border-t border-white/10 pt-3.5 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Key Architectural Properties</span>
              <ul className="space-y-1.5">
                {art.bullets.map((b, bIdx) => (
                  <li key={bIdx} className="text-[11px] text-slate-300 flex items-start gap-2">
                    <span className="text-teal-400 mt-1 shrink-0">•</span>
                    <span className="leading-normal">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
