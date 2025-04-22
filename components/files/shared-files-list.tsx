"use client"

import { useState } from "react"
import { Download, FileText, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { downloadEncryptedFile } from "@/lib/upload"
import { decryptFile, importKeyFromBase64 } from "@/lib/encryption"
import { getSharedFiles, markFileAsDownloaded } from "@/lib/actions/file-actions"
import type { SharedFile } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface SharedFilesListProps {
  initialFiles: SharedFile[]
}

export default function SharedFilesList({ initialFiles }: SharedFilesListProps) {
  const [files, setFiles] = useState<SharedFile[]>(initialFiles)
  const [isLoading, setIsLoading] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const { toast } = useToast()

  const refreshFiles = async () => {
    setIsLoading(true)
    try {
      const updatedFiles = await getSharedFiles()
      setFiles(updatedFiles)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh files",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (file: SharedFile) => {
    setDownloadingFile(file.id)
    setDownloadProgress(0)

    try {
      // Download the encrypted file
      const { data, iv, fileName, chunks } = await downloadEncryptedFile(file.fileId, (progress) => {
        setDownloadProgress(progress * 50) // First 50% is download
      })

      setDownloadProgress(50)

      // Import the key from the stored encryption key
      const key = await importKeyFromBase64(file.encryptionKey)

      // Decrypt the file
      const decryptedData = await decryptFile(data, iv, key, chunks)

      setDownloadProgress(100)

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

      // Mark file as downloaded
      await markFileAsDownloaded(file.id)

      // Update the file in the list
      setFiles(files.map((f) => (f.id === file.id ? { ...f, downloaded: true } : f)))

      toast({
        title: "File downloaded",
        description: "The file has been successfully decrypted and downloaded",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to download or decrypt the file",
      })
    } finally {
      setDownloadingFile(null)
      setDownloadProgress(0)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">Files shared with you</h3>
        <Button variant="outline" size="sm" onClick={refreshFiles} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center">
          <p className="text-gray-400">No files have been shared with you yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {files.map((file) => (
            <Card key={file.id} className="border-gray-700 bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-emerald-600">{getInitials(file.sender.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-emerald-400" />
                        <p className="font-medium">{file.fileName}</p>
                      </div>
                      <div className="flex space-x-4 text-xs text-gray-400">
                        <span>From: {file.sender.name}</span>
                        <span>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        <span>{formatDate(file.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={file.downloaded ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleDownload(file)}
                    disabled={downloadingFile === file.id}
                  >
                    {downloadingFile === file.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {file.downloaded ? "Download Again" : "Download"}
                  </Button>
                </div>

                {downloadingFile === file.id && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{downloadProgress <= 50 ? "Downloading..." : "Decrypting..."}</span>
                      <span>{Math.round(downloadProgress)}%</span>
                    </div>
                    <Progress value={downloadProgress} className="h-1" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
