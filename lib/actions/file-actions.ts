"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { SharedFile } from "@/lib/types"

interface CreateFileShareParams {
  fileId: string
  recipientId: string
  fileName: string
  fileSize: number
  encryptionKey: string
}

export async function createFileShare(params: CreateFileShareParams) {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error("Unauthorized")
  }

  const senderId = session.user.id

  // Create file share record
  await db.fileShare.create({
    data: {
      fileId: params.fileId,
      senderId,
      recipientId: params.recipientId,
      fileName: params.fileName,
      fileSize: params.fileSize,
      encryptionKey: params.encryptionKey,
    },
  })

  return { success: true }
}

export async function getSharedFiles(userId?: string): Promise<SharedFile[]> {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error("Unauthorized")
  }

  const recipientId = userId || session.user.id

  const files = await db.fileShare.findMany({
    where: {
      recipientId,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return files
}

export async function markFileAsDownloaded(fileShareId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error("Unauthorized")
  }

  const fileShare = await db.fileShare.findUnique({
    where: {
      id: fileShareId,
    },
  })

  if (!fileShare || fileShare.recipientId !== session.user.id) {
    throw new Error("Unauthorized")
  }

  await db.fileShare.update({
    where: {
      id: fileShareId,
    },
    data: {
      downloaded: true,
      downloadedAt: new Date(),
    },
  })

  return { success: true }
}
