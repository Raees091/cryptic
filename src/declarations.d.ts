/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare module '@noble/ciphers/chacha.js' {
  export function chacha20poly1305(
    key: Uint8Array,
    nonce: Uint8Array
  ): {
    encrypt(plaintext: Uint8Array, associatedData?: Uint8Array): Uint8Array;
    decrypt(ciphertext: Uint8Array, associatedData?: Uint8Array): Uint8Array;
  };
}
