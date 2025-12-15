export interface EncryptionKeys {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedFile {
  fileName: string;
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
}

export async function generateKeyPair(): Promise<EncryptionKeys> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKey = await window.crypto.subtle.exportKey(
    'spki',
    keyPair.publicKey
  );
  const privateKey = await window.crypto.subtle.exportKey(
    'pkcs8',
    keyPair.privateKey
  );

  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey),
  };
}

export async function encryptFile(
  file: File,
  publicKeyPem: string
): Promise<EncryptedFile> {
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const fileBuffer = await file.arrayBuffer();
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    fileBuffer
  );

  const exportedAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    base64ToArrayBuffer(publicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    exportedAesKey
  );

  return {
    fileName: file.name,
    encryptedContent: arrayBufferToBase64(encryptedContent),
    encryptedKey: arrayBufferToBase64(encryptedKey),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptFile(
  encryptedFile: EncryptedFile,
  privateKeyPem: string
): Promise<{ blob: Blob; fileName: string }> {
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    base64ToArrayBuffer(privateKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );

  const decryptedAesKey = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToArrayBuffer(encryptedFile.encryptedKey)
  );

  const aesKey = await window.crypto.subtle.importKey(
    'raw',
    decryptedAesKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const iv = base64ToArrayBuffer(encryptedFile.iv);
  const encryptedContent = base64ToArrayBuffer(encryptedFile.encryptedContent);

  const decryptedContent = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encryptedContent
  );

  const blob = new Blob([decryptedContent]);
  return { blob, fileName: encryptedFile.fileName };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function downloadFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadEncryptedFile(encryptedFile: EncryptedFile): void {
  const data = JSON.stringify(encryptedFile, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  downloadFile(blob, `${encryptedFile.fileName}.encrypted.json`);
}
