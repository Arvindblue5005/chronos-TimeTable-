/**
 * Zero-Knowledge End-to-End Encryption Engine using native Web Crypto API.
 * Uses PBKDF2 (100,000 iterations of SHA-256) + AES-GCM-256 with unique random IV.
 * Plaintext never leaves the client device.
 */

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derive AES-GCM 256-bit key from passphrase and salt using PBKDF2
 */
async function deriveEncryptionKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPackage {
  ciphertext: string; // Base64
  iv: string;         // Base64
  salt: string;       // Base64
}

/**
 * Encrypt arbitrary JavaScript data structure to Base64 ciphertext
 */
export async function encryptData<T>(data: T, passphrase: string): Promise<EncryptedPackage> {
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Encryption passphrase cannot be empty');
  }

  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(jsonString);

  // Generate 16 bytes salt for PBKDF2
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  // Generate 12 bytes IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveEncryptionKey(passphrase, salt);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    plaintextBytes
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
  };
}

/**
 * Decrypt Base64 ciphertext back to original JavaScript data structure
 */
export async function decryptData<T>(
  encryptedPkg: EncryptedPackage,
  passphrase: string
): Promise<T> {
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Encryption passphrase cannot be empty');
  }

  const saltBuffer = base64ToBuffer(encryptedPkg.salt);
  const ivBuffer = base64ToBuffer(encryptedPkg.iv);
  const ciphertextBuffer = base64ToBuffer(encryptedPkg.ciphertext);

  const key = await deriveEncryptionKey(passphrase, new Uint8Array(saltBuffer));

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer),
      },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  } catch (err) {
    throw new Error('Decryption failed: invalid passphrase or corrupted encrypted payload.');
  }
}

/**
 * Generates an alphanumeric Vault ID
 */
export function generateVaultId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = 'ch-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a human-friendly secure passphrase
 */
export function generateSecurePassphrase(): string {
  const words = [
    'aurora', 'beacon', 'cipher', 'delta', 'echo', 'flux', 'glacier',
    'horizon', 'ignite', 'jasper', 'kinetic', 'lumen', 'matrix', 'nexus',
    'orbit', 'pulsar', 'quantum', 'radiant', 'solstice', 'tempo', 'umbra',
    'vector', 'zenith', 'prism', 'vortex', 'chrono', 'stride', 'axiom'
  ];
  const selected: string[] = [];
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * words.length);
    selected.push(words[idx]);
  }
  const num = Math.floor(100 + Math.random() * 900);
  return `${selected.join('-')}-${num}`;
}
