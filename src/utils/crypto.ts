/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { chacha20poly1305 } from '@noble/ciphers/chacha.js';

// --- ENCODING UTILITIES ---

/**
 * Convert string to Uint8Array (UTF-8 encoding)
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to string (UTF-8 decoding)
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Convert ArrayBuffer/Uint8Array to Base64 string
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// --- PBKDF2 DERIVATION FOR WEB CRYPTO ---

/**
 * Derives an AES key or raw key bytes from a passphrase using PBKDF2.
 */
async function deriveRawKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations: number
): Promise<ArrayBuffer> {
  const importTimerLabel = 'deriveKey';
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);

  // Import key material (the raw passphrase)
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  // Derive raw bits (256 bits = 32 bytes)
  const rawKeyMaterial = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    baseKey,
    256 // Key length (in bits)
  );

  return rawKeyMaterial;
}

/**
 * Derives a CryptoKey for AES encryption from passphrase, salt, and iterations.
 */
async function deriveCryptokey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
  algorithm: 'AES-GCM' | 'AES-CBC'
): Promise<CryptoKey> {
  const rawKeyBytes = await deriveRawKeyFromPassphrase(passphrase, salt, iterations);
  return window.crypto.subtle.importKey(
    'raw',
    rawKeyBytes,
    { name: algorithm },
    false,
    ['encrypt', 'decrypt']
  );
}

// --- CORE CRYPTO OPERATIONS ---

export interface EncResult {
  combined: Uint8Array;
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
}

/**
 * Encrypt bytes using AES-GCM (PBKDF2 derivative)
 * Returns concatenated payload: [Salt (16B)] + [IV (12B)] + [Ciphertext (Var)]
 */
export async function encryptAESGCM(
  data: Uint8Array,
  passphrase: string,
  iterations = 100000
): Promise<EncResult> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await deriveCryptokey(passphrase, salt, iterations, 'AES-GCM');

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128 // 16 bytes auth tag
    },
    cryptoKey,
    data
  );

  const ciphertext = new Uint8Array(ciphertextBuffer);

  // Combine [Salt (16)] + [IV (12)] + [Ciphertext]
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertext, salt.length + iv.length);

  return { combined, salt, iv, ciphertext };
}

/**
 * Decrypt bytes using AES-GCM (PBKDF2 derivative)
 * Expects concatenated payload: [Salt (16B)] + [IV (12B)] + [Ciphertext (Var)]
 */
export async function decryptAESGCM(
  combinedData: Uint8Array,
  passphrase: string,
  iterations = 100000
): Promise<Uint8Array> {
  if (combinedData.length < 28) {
    throw new Error('Invalid ciphertext: package is truncated or corrupted.');
  }

  const salt = combinedData.slice(0, 16);
  const iv = combinedData.slice(16, 28);
  const ciphertext = combinedData.slice(28);

  const cryptoKey = await deriveCryptokey(passphrase, salt, iterations, 'AES-GCM');

  const plaintextBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    },
    cryptoKey,
    ciphertext
  );

  return new Uint8Array(plaintextBuffer);
}

/**
 * Encrypt bytes using AES-CBC (PBKDF2 derivative)
 * Returns concatenated payload: [Salt (16B)] + [IV (16B)] + [Ciphertext (Var)]
 */
export async function encryptAESCBC(
  data: Uint8Array,
  passphrase: string,
  iterations = 100000
): Promise<EncResult> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(16)); // AES-CBC requires 16-byte IV

  const cryptoKey = await deriveCryptokey(passphrase, salt, iterations, 'AES-CBC');

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-CBC',
      iv: iv
    },
    cryptoKey,
    data
  );

  const ciphertext = new Uint8Array(ciphertextBuffer);

  // Combine [Salt (16)] + [IV (16)] + [Ciphertext]
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertext, salt.length + iv.length);

  return { combined, salt, iv, ciphertext };
}

/**
 * Decrypt bytes using AES-CBC (PBKDF2 derivative)
 * Expects concatenated payload: [Salt (16B)] + [IV (16B)] + [Ciphertext (Var)]
 */
export async function decryptAESCBC(
  combinedData: Uint8Array,
  passphrase: string,
  iterations = 100000
): Promise<Uint8Array> {
  if (combinedData.length < 32) {
    throw new Error('Invalid ciphertext: package is truncated or corrupted.');
  }

  const salt = combinedData.slice(0, 16);
  const iv = combinedData.slice(16, 32);
  const ciphertext = combinedData.slice(32);

  const cryptoKey = await deriveCryptokey(passphrase, salt, iterations, 'AES-CBC');

  const plaintextBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-CBC',
      iv: iv
    },
    cryptoKey,
    ciphertext
  );

  return new Uint8Array(plaintextBuffer);
}

/**
 * Encrypt bytes using ChaCha20-Poly1305 (PBKDF2 derived key)
 * Returns concatenated payload: [Salt (16B)] + [IV/Nonce (12B)] + [Ciphertext + Tag (Var)]
 */
export async function encryptChaCha(
  data: Uint8Array,
  passphrase: string,
  iterations = 100000
): Promise<EncResult> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const nonce = window.crypto.getRandomValues(new Uint8Array(12));

  // Derive key bytes (32 bytes = 256 bits)
  const rawKeyBytesBuffer = await deriveRawKeyFromPassphrase(passphrase, salt, iterations);
  const rawKeyBytes = new Uint8Array(rawKeyBytesBuffer);

  // Initialize ChaCha20-Poly1305 cipher
  const c = chacha20poly1305(rawKeyBytes, nonce);
  const ciphertext = c.encrypt(data);

  // Combine [Salt (16)] + [Nonce (12)] + [Ciphertext]
  const combined = new Uint8Array(salt.length + nonce.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(nonce, salt.length);
  combined.set(ciphertext, salt.length + nonce.length);

  return { combined, salt, iv: nonce, ciphertext };
}

/**
 * Decrypt bytes using ChaCha20-Poly1305
 * Expects concatenated payload: [Salt (16B)] + [IV/Nonce (12B)] + [Ciphertext + Tag (Var)]
 */
export async function decryptChaCha(
  combinedData: Uint8Array,
  passphrase: string,
  iterations = 100000
): Promise<Uint8Array> {
  if (combinedData.length < 28) {
    throw new Error('Invalid ciphertext: package is truncated or corrupted.');
  }

  const salt = combinedData.slice(0, 16);
  const nonce = combinedData.slice(16, 28);
  const ciphertext = combinedData.slice(28);

  // Derive key bytes (32 bytes = 256 bits)
  const rawKeyBytesBuffer = await deriveRawKeyFromPassphrase(passphrase, salt, iterations);
  const rawKeyBytes = new Uint8Array(rawKeyBytesBuffer);

  const c = chacha20poly1305(rawKeyBytes, nonce);
  const decrypted = c.decrypt(ciphertext);

  return decrypted;
}

// --- CONVENIENCE HELPER FOR ANY SYMMETRIC DECISION ---

/**
 * Multi-protocol encrypt text cleanly with PBKDF2
 */
export async function encryptText(
  text: string,
  passphrase: string,
  mode: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305',
  iterations = 100000
): Promise<Uint8Array> {
  const dataBytes = stringToBytes(text);
  switch (mode) {
    case 'aes-256-gcm':
      return (await encryptAESGCM(dataBytes, passphrase, iterations)).combined;
    case 'aes-256-cbc':
      return (await encryptAESCBC(dataBytes, passphrase, iterations)).combined;
    case 'chacha20-poly1305':
      return (await encryptChaCha(dataBytes, passphrase, iterations)).combined;
  }
}

/**
 * Multi-protocol decrypt text cleanly with PBKDF2
 */
export async function decryptText(
  combinedData: Uint8Array,
  passphrase: string,
  mode: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305',
  iterations = 100000
): Promise<string> {
  let plaintextBytes: Uint8Array;
  switch (mode) {
    case 'aes-256-gcm':
      plaintextBytes = await decryptAESGCM(combinedData, passphrase, iterations);
      break;
    case 'aes-256-cbc':
      plaintextBytes = await decryptAESCBC(combinedData, passphrase, iterations);
      break;
    case 'chacha20-poly1305':
      plaintextBytes = await decryptChaCha(combinedData, passphrase, iterations);
      break;
  }
  return bytesToString(plaintextBytes);
}
