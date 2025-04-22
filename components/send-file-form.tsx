"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, Lock, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { encryptFile, generateKeys } from "@/lib/encryption"
import { uploadEncryptedFile } from "@/lib/upload"
import { createFileShare } from "@/lib/actions/file-actions"
import { useToast } from "@/hooks/use-toast"

interface SendFileFormProps {
  recipientId: string
  recipientName: string
}

export default function SendFileForm({ recipientId, recipientName }: SendFileFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

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

      // Export the key for sharing
      const keyString = await exportKeyToBase64(aesKey)

      // Create file share record
      await createFileShare({
        fileId,
        recipientId,
        fileName: file.name,
        fileSize: file.size,
        encryptionKey: keyString,
      })

      setProgress(100)
      setIsUploading(false)

      toast({
        title: "File sent successfully",
        description: `Your file has been securely sent to ${recipientName}`,
      })

      // Navigate back to connections
      router.push("/dashboard/connections")
      router.refresh()
    } catch (err) {
      setError("Error processing file: " + (err instanceof Error ? err.message : String(err)))
      setIsEncrypting(false)
      setIsUploading(false)
    }
  }

  // Helper function to export key as base64
  const exportKeyToBase64 = async (key: CryptoKey) => {
    const exported = await window.crypto.subtle.exportKey("raw", key)
    return btoa(String.fromCharCode(...new Uint8Array(exported)))
  }

  return (
    <div>
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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button className="w-full" onClick={handleUpload} disabled={!file || isEncrypting || isUploading}>
        {isEncrypting || isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEncrypting ? "Encrypting..." : "Sending..."}
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Encrypt & Send
          </>
        )}
      </Button>

      <div className="mt-6 rounded-lg bg-gray-700 p-4 text-sm">
        <p className="mb-2 font-medium text-emerald-300">End-to-End Encryption</p>
        <p className="text-gray-300">
          Your file will be encrypted before upload and can only be decrypted by {recipientName}. The encryption key is
          securely shared through your established connection.
        </p>
      </div>
    </div>
  )
}
