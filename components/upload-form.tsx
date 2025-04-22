"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Lock, Copy, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { encryptFile, generateKeys } from "@/lib/encryption"
import { uploadEncryptedFile } from "@/lib/upload"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [shareLink, setShareLink] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setError("")
      setIsEncrypting(true)
      setProgress(10)

      // Generate encryption keys
      const { aesKey, rsaKeyPair } = await generateKeys()

      // Encrypt the file
      const encryptedData = await encryptFile(file, aesKey)
      setProgress(40)
      setIsEncrypting(false)
      setIsUploading(true)

      // Upload the encrypted file
      const { fileId } = await uploadEncryptedFile(encryptedData, file.name, rsaKeyPair.publicKey, (uploadProgress) => {
        setProgress(40 + Math.floor(uploadProgress * 0.5))
      })

      // Create share link with encryption key embedded in the fragment
      const keyString = await exportKeyToBase64(aesKey)
      const shareUrl = `${window.location.origin}/download/${fileId}#${keyString}`

      setShareLink(shareUrl)
      setProgress(100)
      setIsUploading(false)
    } catch (err) {
      setError("Error processing file: " + (err instanceof Error ? err.message : String(err)))
      setIsEncrypting(false)
      setIsUploading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
  }

  const resetForm = () => {
    setFile(null)
    setShareLink("")
    setProgress(0)
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Helper function to export key as base64
  const exportKeyToBase64 = async (key: CryptoKey) => {
    const exported = await window.crypto.subtle.exportKey("raw", key)
    return btoa(String.fromCharCode(...new Uint8Array(exported)))
  }

  return (
    <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
      {!shareLink ? (
        <>
          <div
            className={`mb-6 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              isDragging ? "border-emerald-400 bg-gray-700" : "border-gray-600 hover:border-gray-500"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
            <Upload className="mb-2 h-10 w-10 text-gray-400" />
            <p className="mb-1 text-center text-lg font-medium">Drag & drop your file here</p>
            <p className="text-center text-sm text-gray-400">or click to browse</p>
          </div>

          {file && (
            <div className="mb-6 rounded-lg bg-gray-700 p-4">
              <div className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-emerald-400" />
                <div className="flex-1 truncate">{file.name}</div>
                <div className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            </div>
          )}

          {(isEncrypting || isUploading) && (
            <div className="mb-6">
              <div className="mb-2 flex justify-between text-sm">
                <span>{isEncrypting ? "Encrypting..." : "Uploading..."}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button className="w-full" onClick={handleUpload} disabled={!file || isEncrypting || isUploading}>
            <Lock className="mr-2 h-4 w-4" />
            Encrypt & Upload
          </Button>
        </>
      ) : (
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <h3 className="mb-2 text-xl font-bold">File Encrypted & Uploaded!</h3>
          <p className="mb-6 text-gray-300">
            Your file is encrypted and ready to share. The link below contains the decryption key.
          </p>

          <div className="mb-6 overflow-hidden rounded-lg bg-gray-700 p-3">
            <p className="truncate text-sm text-emerald-300">{shareLink}</p>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
            <Button className="flex-1" onClick={copyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button variant="outline" className="flex-1" onClick={resetForm}>
              Upload Another File
            </Button>
          </div>

          <div className="mt-6 rounded-lg bg-gray-700 p-4 text-left text-sm">
            <p className="mb-2 font-medium text-amber-300">Security Note:</p>
            <p className="text-gray-300">
              The link contains the decryption key in the URL fragment (#). It is never sent to our servers and stays in
              your browser. Once the link expires or is used, the file cannot be recovered.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
