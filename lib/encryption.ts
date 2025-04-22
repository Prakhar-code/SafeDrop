// This file handles all encryption/decryption operations using the Web Crypto API

// Generate AES and RSA keys for encryption
export async function generateKeys() {
  // Generate AES-256 key for file encryption
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"],
  )

  // Generate RSA key pair for secure key exchange
  const rsaKeyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"],
  )

  return { aesKey, rsaKeyPair }
}

// Encrypt a file using AES-256-GCM
export async function encryptFile(file: File, key: CryptoKey): Promise<EncryptedData> {
  // Generate a random IV (Initialization Vector)
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  // Read the file as an ArrayBuffer
  const fileBuffer = await readFileAsArrayBuffer(file)

  // Split the file into chunks if it's large
  const chunkSize = 5 * 1024 * 1024 // 5MB chunks
  const chunks: ArrayBuffer[] = []

  for (let i = 0; i < fileBuffer.byteLength; i += chunkSize) {
    const chunk = fileBuffer.slice(i, Math.min(i + chunkSize, fileBuffer.byteLength))
    chunks.push(chunk)
  }

  // Encrypt each chunk
  const encryptedChunks: ArrayBuffer[] = []

  for (let i = 0; i < chunks.length; i++) {
    // For each chunk, we need a unique IV derived from the original
    const chunkIv = new Uint8Array(iv)
    // Modify the last byte to make the IV unique per chunk
    chunkIv[chunkIv.length - 1] = chunkIv[chunkIv.length - 1] ^ i

    const encryptedChunk = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: chunkIv,
      },
      key,
      chunks[i],
    )

    encryptedChunks.push(encryptedChunk)
  }

  // Combine all encrypted chunks
  const totalLength = encryptedChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
  const encryptedData = new Uint8Array(totalLength)

  let offset = 0
  for (const chunk of encryptedChunks) {
    encryptedData.set(new Uint8Array(chunk), offset)
    offset += chunk.byteLength
  }

  return {
    data: encryptedData.buffer,
    iv: iv.buffer,
    originalName: file.name,
    originalSize: file.size,
    chunks: encryptedChunks.length,
  }
}

// Decrypt a file using AES-256-GCM
export async function decryptFile(
  encryptedData: ArrayBuffer,
  iv: ArrayBuffer,
  key: CryptoKey,
  chunks = 1,
): Promise<ArrayBuffer> {
  const encryptedArray = new Uint8Array(encryptedData)
  const ivArray = new Uint8Array(iv)

  // If the file wasn't chunked, decrypt it directly
  if (chunks === 1) {
    return window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivArray,
      },
      key,
      encryptedData,
    )
  }

  // Calculate approximate chunk size
  const chunkSize = Math.ceil(encryptedArray.length / chunks)
  const decryptedChunks: ArrayBuffer[] = []

  // Decrypt each chunk
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, encryptedArray.length)
    const chunk = encryptedArray.slice(start, end)

    // For each chunk, we need a unique IV derived from the original
    const chunkIv = new Uint8Array(ivArray)
    // Modify the last byte to make the IV unique per chunk (same as in encryption)
    chunkIv[chunkIv.length - 1] = chunkIv[chunkIv.length - 1] ^ i

    const decryptedChunk = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: chunkIv,
      },
      key,
      chunk,
    )

    decryptedChunks.push(decryptedChunk)
  }

  // Combine all decrypted chunks
  const totalLength = decryptedChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
  const decryptedData = new Uint8Array(totalLength)

  let offset = 0
  for (const chunk of decryptedChunks) {
    decryptedData.set(new Uint8Array(chunk), offset)
    offset += chunk.byteLength
  }

  return decryptedData.buffer
}

// Encrypt the AES key with RSA for secure key exchange
export async function encryptKey(aesKey: CryptoKey, publicKey: CryptoKey): Promise<ArrayBuffer> {
  // Export the AES key to raw format
  const exportedKey = await window.crypto.subtle.exportKey("raw", aesKey)

  // Encrypt the exported key with the RSA public key
  return window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    exportedKey,
  )
}

// Decrypt the AES key with RSA private key
export async function decryptKey(encryptedKey: ArrayBuffer, privateKey: CryptoKey): Promise<CryptoKey> {
  // Decrypt the AES key with the RSA private key
  const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedKey,
  )

  // Import the decrypted key as an AES key
  return window.crypto.subtle.importKey(
    "raw",
    decryptedKeyBuffer,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  )
}

// Import an AES key from base64 string (from URL fragment)
export async function importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  // Convert base64 to array buffer
  const binaryString = atob(base64Key)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Import the key
  return window.crypto.subtle.importKey(
    "raw",
    bytes.buffer,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  )
}

// Helper function to read a file as ArrayBuffer
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

// Types
export interface EncryptedData {
  data: ArrayBuffer
  iv: ArrayBuffer
  originalName: string
  originalSize: number
  chunks: number
}
