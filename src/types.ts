/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CryptoCategory = 'symmetric' | 'package' | 'vault' | 'learn';

export interface CryptoTool {
  id: string;
  name: string;
  description: string;
  category: CryptoCategory;
  icon: string;
  featured: boolean;
}

export interface EncryptedPayload {
  cipherTextB64: string;
  ivB64: string;
  saltB64: string;
  iterations: number;
  mode: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
}

export interface SecureNote {
  id: string;
  title: string;
  encryptedContent: string; // Base64 of encrypted structure
  createdAt: string;
  updatedAt: string;
}

export type ThemeType = 'royal-dark' | 'slate-cyber' | 'glassy-light';
