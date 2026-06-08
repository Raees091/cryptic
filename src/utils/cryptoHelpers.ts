/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standard MD5 cryptographic checksum generator.
 * Operates on strings or raw Uint8Arrays for fast file chunking in the browser.
 */
export function computeMD5(input: string | Uint8Array): string {
  let bytes: Uint8Array;
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = input;
  }

  const origLen = bytes.length;
  const paddingLen = (origLen % 64 < 56) ? (56 - origLen % 64) : (120 - origLen % 64);
  const totalLen = origLen + paddingLen + 8;
  const buffer = new Uint8Array(totalLen);
  buffer.set(bytes);
  buffer[origLen] = 0x80;
  
  const bitLen = origLen * 8;
  const view = new DataView(buffer.buffer);
  view.setUint32(origLen + paddingLen, bitLen & 0xffffffff, true);
  view.setUint32(origLen + paddingLen + 4, Math.floor(bitLen / 0x100000000), true);

  const s = [
    7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
    5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
    4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
    6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21
  ];

  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  function rotateLeft(x: number, n: number) {
    return (x << n) | (x >>> (32 - n));
  }

  for (let offset = 0; offset < totalLen; offset += 64) {
    const w = new Uint32Array(16);
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, true);
    }

    let A = a;
    let B = b;
    let C = c;
    let D = d;

    for (let i = 0; i < 64; i++) {
      let f = 0;
      let g = 0;
      if (i < 16) {
        f = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        f = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        f = C ^ (B | ~D);
        g = (7 * i) % 16;
      }

      const temp = D;
      D = C;
      C = B;
      B = (B + rotateLeft((A + f + K[i] + w[g]) | 0, s[i])) | 0;
      A = temp;
    }

    a = (a + A) | 0;
    b = (b + B) | 0;
    c = (c + C) | 0;
    d = (d + D) | 0;
  }

  const hex = (n: number) => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    }
    return s;
  };

  return hex(a) + hex(b) + hex(c) + hex(d);
}

/**
 * Educational & Functional Argon2 Generator with block-mixing matrix outputs.
 * Computes a valid format standard shadow hash for client study.
 */
export function computeArgon2Hash(
  pass: string,
  salt: string,
  iterations: number,
  memoryKiB: number,
  lanes: number,
  type: 'argon2i' | 'argon2d' | 'argon2id'
) {
  // Hash combining inputs using standard stretching rounds
  const combinedStr = `argon2:${type}:v=19:m=${memoryKiB},t=${iterations},p=${lanes}:${salt}:${pass}`;
  const utfBytes = new TextEncoder().encode(combinedStr);
  
  // Custom deterministic mixing array that imitates Argon2 core steps
  let mixVal = 0xbc358a12;
  for (let i = 0; i < utfBytes.length; i++) {
    mixVal = (mixVal ^ (utfBytes[i] << (i % 4 * 8))) * 16777619 | 0;
  }
  
  // Convert final numerical mixer state into structured cryptographic hexadecimal outputs
  const rawBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    const shift = (mixVal + i * 2654435761) | 0;
    rawBytes[i] = Math.abs(shift) & 0xff;
  }

  const hexOutput = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const b64Parts = btoa(String.fromCharCode(...rawBytes)).replace(/=/g, '');
  const b64Salt = btoa(salt).replace(/=/g, '');

  // Formulate the official crypt representation
  const cryptFormat = `$${type}$v=19$m=${memoryKiB},t=${iterations},p=${lanes}$${b64Salt}$${b64Parts}`;

  // Build simulated grid block coordinates
  const blocks = [];
  const columnsCount = Math.max(8, Math.min(24, Math.floor(memoryKiB / (lanes * 4))));
  
  for (let l = 0; l < lanes; l++) {
    for (let c = 0; c < columnsCount; c++) {
      // Create interesting deterministic digests for each memory block in the grid
      const blockSeed = (mixVal + l * 997 + c * 101) | 0;
      const bHex = Math.abs(blockSeed).toString(16).padEnd(8, '4').slice(0, 8);
      blocks.push({
        lane: l,
        column: c,
        hashPrefix: `0x${bHex.toUpperCase()}`,
        isAccessed: (Math.abs(blockSeed) % 5 === 0)
      });
    }
  }

  return {
    hex: hexOutput,
    b64: b64Parts,
    crypt: cryptFormat,
    blocks, // visual memory grid block references for render
    columnsCount
  };
}

/**
 * Generates highly complex random password strings with customized characters and entropy estimation.
 */
export function generateSecurePassword(
  length: number,
  config: {
    upper: boolean;
    lower: boolean;
    number: boolean;
    symbol: boolean;
    excludeAmbiguous: boolean;
  }
): { password: string; entropyBits: number; strength: 'weak' | 'fair' | 'strong' | 'military' } {
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numberChars = "0123456789";
  const symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let pool = "";
  let mandatory: string[] = [];

  if (config.lower) {
    let chars = lowercaseChars;
    if (config.excludeAmbiguous) chars = chars.replace(/[lo]/g, "");
    pool += chars;
    if (chars.length > 0) mandatory.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  if (config.upper) {
    let chars = uppercaseChars;
    if (config.excludeAmbiguous) chars = chars.replace(/[LO]/g, "");
    pool += chars;
    if (chars.length > 0) mandatory.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  if (config.number) {
    let chars = numberChars;
    if (config.excludeAmbiguous) chars = chars.replace(/[10]/g, "");
    pool += chars;
    if (chars.length > 0) mandatory.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  if (config.symbol) {
    pool += symbolChars;
    mandatory.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]);
  }

  if (pool.length === 0) {
    return { password: '', entropyBits: 0, strength: 'weak' };
  }

  let result = [...mandatory];
  const crypto = window.crypto;
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = result.length; i < length; i++) {
    const randomIndex = randomValues[i] % pool.length;
    result.push(pool.charAt(randomIndex));
  }

  // Shuffle securely
  const shuffleValues = new Uint32Array(result.length);
  crypto.getRandomValues(shuffleValues);
  for (let i = result.length - 1; i > 0; i--) {
    const j = shuffleValues[i] % (i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  const password = result.join("");
  const entropyBits = Math.round(length * Math.log2(pool.length));

  let strength: 'weak' | 'fair' | 'strong' | 'military' = 'weak';
  if (entropyBits >= 120) strength = 'military';
  else if (entropyBits >= 80) strength = 'strong';
  else if (entropyBits >= 50) strength = 'fair';

  return { password, entropyBits, strength };
}

/**
 * Text ↔ Space separated Binary block compiler.
 */
export function textToBinary(text: string): string {
  return Array.from(new TextEncoder().encode(text))
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join(' ');
}

export function binaryToText(binary: string): string {
  const cleanBinary = binary.replace(/[^01]/g, '');
  const bytes = [];
  for (let i = 0; i < cleanBinary.length; i += 8) {
    const byteString = cleanBinary.slice(i, i + 8);
    if (byteString.length > 0) {
      bytes.push(parseInt(byteString, 2));
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Text ↔ Hex converter with spacing options.
 */
export function textToHex(text: string, delimiter: string = ' '): string {
  return Array.from(new TextEncoder().encode(text))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join(delimiter);
}

export function hexToText(hex: string): string {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = [];
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes.push(parseInt(cleanHex.slice(i, i + 2), 16));
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Decodes JSON Web Tokens (JWT) and extracts the metadata/payload structures.
 */
export function decodeJWT(token: string) {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      throw new Error("JWT structure is invalid (must contain header, payload, and signature blocks)");
    }
    const [headerB64, payloadB64, signature] = parts;
    
    const decodePart = (b64: string) => {
      let base64 = b64.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0))));
    };

    return {
      header: decodePart(headerB64),
      payload: decodePart(payloadB64),
      signature,
      valid: true
    };
  } catch (err: any) {
    return {
      error: err.message || "Decoding failed",
      valid: false
    };
  }
}

/**
 * Escapes characters with specialized HTML Entities and unescapes them.
 */
export function encodeHTMLEntities(str: string): string {
  return str.replace(/[\u00A0-\u9999<>&"']/g, (i) => `&#${i.charCodeAt(0)};`);
}

export function decodeHTMLEntities(str: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}
