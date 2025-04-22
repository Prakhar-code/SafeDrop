import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { fileName, fileSize, originalSize, chunks } = await request.json()

    // Generate a unique file ID
    const fileId = crypto.randomBytes(16).toString("hex")

    // Generate a unique path for the file
    const path = `encrypted/${fileId}/${fileName}`

    // Create a presigned URL for uploading
    const { url } = await put(path, {
      access: "public",
      handleUploadUrl: true,
      // Set expiration to 24 hours
      expiration: Date.now() + 1000 * 60 * 60 * 24,
      metadata: {
        fileId,
        originalName: fileName,
        originalSize: String(originalSize),
        chunks: String(chunks),
        uploadedAt: new Date().toISOString(),
      },
    })

    // Return the upload URL and file ID
    return NextResponse.json({
      uploadUrl: url,
      fileId,
    })
  } catch (error) {
    console.error("Error creating upload URL:", error)
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 })
  }
}
