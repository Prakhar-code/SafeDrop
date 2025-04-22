"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { PairingWithUser } from "@/lib/types"

// Generate a random 6-digit code
function generateRandomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Generate a pairing code
export async function generatePairingCode(): Promise<string> {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id

  // Generate a random code
  const code = generateRandomCode()

  // Store the code in the database with expiration time (5 minutes from now)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  await db.pairingCode.create({
    data: {
      code,
      userId,
      expiresAt,
    },
  })

  return code
}

// Connect with a pairing code
export async function connectWithPairingCode(code: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error("Unauthorized")
  }

  const currentUserId = session.user.id

  // Find the pairing code
  const pairingCode = await db.pairingCode.findFirst({
    where: {
      code,
      expiresAt: {
        gt: new Date(),
      },
      used: false,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!pairingCode) {
    return {
      success: false,
      error: "Invalid or expired code",
    }
  }

  // Prevent self-pairing
  if (pairingCode.userId === currentUserId) {
    return {
      success: false,
      error: "You cannot connect with yourself",
    }
  }

  // Check if already paired
  const existingPairing = await db.pairing.findFirst({
    where: {
      OR: [
        {
          userId: currentUserId,
          connectedUserId: pairingCode.userId,
        },
        {
          userId: pairingCode.userId,
          connectedUserId: currentUserId,
        },
      ],
    },
  })

  if (existingPairing) {
    return {
      success: false,
      error: "You are already connected with this user",
    }
  }

  // Create bidirectional pairing
  await db.$transaction([
    // Current user -> Code owner
    db.pairing.create({
      data: {
        userId: currentUserId,
        connectedUserId: pairingCode.userId,
      },
    }),
    // Code owner -> Current user
    db.pairing.create({
      data: {
        userId: pairingCode.userId,
        connectedUserId: currentUserId,
      },
    }),
    // Mark code as used
    db.pairingCode.update({
      where: {
        id: pairingCode.id,
      },
      data: {
        used: true,
      },
    }),
  ])

  return {
    success: true,
    userName: pairingCode.user.name,
  }
}

// Get user pairings
export async function getUserPairings(userId?: string): Promise<PairingWithUser[]> {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error("Unauthorized")
  }

  const currentUserId = userId || session.user.id

  const pairings = await db.pairing.findMany({
    where: {
      userId: currentUserId,
    },
    include: {
      connectedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return pairings
}

// Remove a pairing
export async function removePairing(pairingId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error("Unauthorized")
  }

  const pairing = await db.pairing.findUnique({
    where: {
      id: pairingId,
    },
  })

  if (!pairing || pairing.userId !== session.user.id) {
    throw new Error("Unauthorized")
  }

  // Remove bidirectional pairing
  await db.$transaction([
    // Remove current user -> connected user
    db.pairing.delete({
      where: {
        id: pairingId,
      },
    }),
    // Remove connected user -> current user
    db.pairing.deleteMany({
      where: {
        userId: pairing.connectedUserId,
        connectedUserId: pairing.userId,
      },
    }),
  ])

  return { success: true }
}

// Check if two users are paired
export async function isPaired(userId1: string, userId2: string): Promise<boolean> {
  const pairing = await db.pairing.findFirst({
    where: {
      userId: userId1,
      connectedUserId: userId2,
    },
  })

  return !!pairing
}
