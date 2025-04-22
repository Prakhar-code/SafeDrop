"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Download, Shield, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { downloadEncryptedFile } from "@/lib/upload"
import { decryptFile, importKeyFromBase64 } from "@/lib/encryption"

export default function DownloadPage() {
  const params = useParams()
  const fileId = params.fileId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [fileInfo, setFileInfo] = useState<{
    name: string
    size: number
  } | null>(null)

  // Get the decryption key from the URL fragment
  const [decryptionKey, setDecryptionKey] = useState<string | null>(null)

  useEffect(() => {
    // Extract the key from the URL fragment
    if (typeof window !== "undefined") {
      const fragment = window.location.hash.substring(1)
      if (fragment) {
        setDecryptionKey(fragment)
        // Remove the key from the URL for security
        history.replaceState(null, "", window.location.pathname)
      }
    }

    // Fetch file metadata
    const fetchFileInfo = async () => {
      try {
        const response = await fetch(`/api/files/${fileId}/metadata`)

        if (!response.ok) {
          throw new Error(
            response.status === 404 ? "File not found or has expired" : "Failed to fetch file information",
          )
        }

        const data = await response.json()
        setFileInfo({
          name: data.fileName,
          size: data.fileSize,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setIsLoading(false)
      }
    }

    fetchFileInfo()
  }, [fileId])

  const handleDownload = async () => {
    if (!decryptionKey) {
      setError("No decryption key found. The link may be incomplete.")
      return
    }

    try {
      setError("")
      setIsDownloading(true)
      setProgress(0)

      // Download the encrypted file
      const { data, iv, fileName, chunks } = await downloadEncryptedFile(fileId, (downloadProgress) => {
        setProgress(downloadProgress * 50) // First 50% is download
      })

      setIsDownloading(false)
      setIsDecrypting(true)
      setProgress(50)

      // Import the key from the URL fragment
      const key = await importKeyFromBase64(decryptionKey)

      // Decrypt the file
      const decryptedData = await decryptFile(data, iv, key, chunks)

      setProgress(100)

      // Create a download link for the decrypted file
      const blob = new Blob([decryptedData])
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setIsDecrypting(false)
    } catch (err) {
      setError("Error downloading or decrypting file: " + (err instanceof Error ? err.message : String(err)))
      setIsDownloading(false)
      setIsDecrypting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bold sm:text-5xl">
            Safe<span className="text-emerald-400">Drop</span>
          </h1>
          <p className="text-lg text-gray-300">Secure File Download</p>
        </header>

        <div className="mx-auto max-w-md rounded-lg bg-gray-800 p-6 shadow-lg">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent"></div>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="mb-6 text-center">
                <Shield className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
                <h2 className="mb-2 text-xl font-bold">Encrypted File Ready</h2>
                {fileInfo && (
                  <p className="text-gray-300">
                    {fileInfo.name} ({(fileInfo.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {!decryptionKey && (
                <Alert className="mb-6 border-amber-500 bg-amber-500/10 text-amber-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Missing Decryption Key</AlertTitle>
                  <AlertDescription>
                    This link is missing the decryption key. You need the complete link to decrypt the file.
                  </AlertDescription>
                </Alert>
              )}

              {(isDownloading || isDecrypting) && (
                <div className="mb-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{isDownloading ? "Downloading..." : "Decrypting..."}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleDownload}
                disabled={isDownloading || isDecrypting || !decryptionKey}
              >
                <Download className="mr-2 h-4 w-4" />
                Download & Decrypt
              </Button>

              <div className="mt-6 rounded-lg bg-gray-700 p-4 text-sm">
                <p className="mb-2 font-medium text-emerald-300">End-to-End Encryption</p>
                <p className="text-gray-300">
                  This file is encrypted and can only be decrypted with the correct key. The decryption happens in your
                  browser - we never see the unencrypted content.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
