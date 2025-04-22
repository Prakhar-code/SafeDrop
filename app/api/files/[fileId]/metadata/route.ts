import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { fileId: string } }) {
  try {
    const fileId = params.fileId

    // List all blobs in the file's directory
    const { blobs } = await list({
      prefix: `encrypted/${fileId}/`,
    })

    // Find the file blob (not the IV)
    const fileBlob = blobs.find((blob) => !blob.pathname.endsWith("/iv"))

    if (!fileBlob) {
      return NextResponse.json({ error: "File not found or expired" }, { status: 404 })
    }

    // Extract metadata
    const { metadata } = fileBlob

    return NextResponse.json({
      fileId,
      fileName: metadata?.originalName || "download.bin",
      fileSize: fileBlob.size,
      originalSize: metadata?.originalSize ? Number.parseInt(metadata.originalSize) : fileBlob.size,
      chunks: metadata?.chunks ? Number.parseInt(metadata.chunks) : 1,
      uploadedAt: metadata?.uploadedAt || new Date().toISOString(),
      downloadUrl: fileBlob.url,
    })
  } catch (error) {
    console.error("Error retrieving file metadata:", error)
    return NextResponse.json({ error: "Failed to retrieve file metadata" }, { status: 500 })
  }
}
