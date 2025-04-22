import type { Pairing, FileShare } from "@prisma/client"

export type PairingWithUser = Pairing & {
  connectedUser: {
    id: string
    name: string
    email: string
  }
}

export type SharedFile = FileShare & {
  sender: {
    id: string
    name: string
    email: string
  }
}
