// This file handles uploading encrypted files to the server

import type { EncryptedData } from "./encryption"

// Upload an encrypted file to the server
export async function uploadEncryptedFile(
  encryptedData: EncryptedData,
  originalFileName: string,
  publicKey: CryptoKey,
  onProgress?: (progress: number) => void,
): Promise<{ fileId: string }> {
  try {
    // First, get a presigned URL for the upload
    const response = await fetch("/api/files/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: originalFileName,
        fileSize: encryptedData.data.byteLength,
        originalSize: encryptedData.originalSize,
        chunks: encryptedData.chunks,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get upload URL")
    }

    const { uploadUrl, fileId } = await response.json()

    // Upload the encrypted file using the presigned URL
    await uploadToPresignedUrl(uploadUrl, encryptedData.data, onProgress)

    // Upload the IV separately
    await uploadIV(fileId, encryptedData.iv)

    return { fileId }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

// Upload the encrypted file to the presigned URL
async function uploadToPresignedUrl(
  url: string,
  data: ArrayBuffer,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open("PUT", url, true)
    xhr.setRequestHeader("Content-Type", "application/octet-stream")

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`HTTP Error: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error("Network Error"))
    xhr.send(data)
  })
}

// Upload the IV (Initialization Vector) for the encrypted file
async function uploadIV(fileId: string, iv: ArrayBuffer): Promise<void> {
  const response = await fetch(`/api/files/${fileId}/iv`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: iv,
  })

  if (!response.ok) {
    throw new Error("Failed to upload IV")
  }
}

// Download an encrypted file from the server
export async function downloadEncryptedFile(
  fileId: string,
  onProgress?: (progress: number) => void,
): Promise<{ data: ArrayBuffer; iv: ArrayBuffer; fileName: string; chunks: number }> {
  // First, get the file metadata
  const metadataResponse = await fetch(`/api/files/${fileId}/metadata`)

  if (!metadataResponse.ok) {
    throw new Error("File not found or expired")
  }

  const { fileName, downloadUrl, chunks } = await metadataResponse.json()

  // Download the IV
  const ivResponse = await fetch(`/api/files/${fileId}/iv`)

  if (!ivResponse.ok) {
    throw new Error("Failed to download IV")
  }

  const iv = await ivResponse.arrayBuffer()

  // Download the encrypted file
  const fileData = await downloadWithProgress(downloadUrl, onProgress)

  return {
    data: fileData,
    iv,
    fileName,
    chunks,
  }
}

// Download a file with progress tracking
async function downloadWithProgress(url: string, onProgress?: (progress: number) => void): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open("GET", url, true)
    xhr.responseType = "arraybuffer"

    xhr.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response)
      } else {
        reject(new Error(`HTTP Error: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error("Network Error"))
    xhr.send()
  })
}
