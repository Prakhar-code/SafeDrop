import { put, get } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { fileId: string } }) {
  try {
    const fileId = params.fileId
    const iv = await request.arrayBuffer()

    // Store the IV in Vercel Blob
    await put(`encrypted/${fileId}/iv`, iv, {
      access: "public",
      // Set expiration to 24 hours
      expiration: Date.now() + 1000 * 60 * 60 * 24,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error uploading IV:", error)
    return NextResponse.json({ error: "Failed to upload IV" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { fileId: string } }) {
  try {
    const fileId = params.fileId

    // Get the IV from Vercel Blob
    const blob = await get(`encrypted/${fileId}/iv`)

    if (!blob) {
      return NextResponse.json({ error: "IV not found" }, { status: 404 })
    }

    // Return the IV as an array buffer
    const response = await fetch(blob.url)
    const iv = await response.arrayBuffer()

    return new Response(iv, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
    })
  } catch (error) {
    console.error("Error retrieving IV:", error)
    return NextResponse.json({ error: "Failed to retrieve IV" }, { status: 500 })
  }
}
