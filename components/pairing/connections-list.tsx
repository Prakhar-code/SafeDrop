"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UserX, Send, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getUserPairings, removePairing } from "@/lib/actions/pairing-actions"
import type { PairingWithUser } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ConnectionsListProps {
  initialPairings: PairingWithUser[]
}

export default function ConnectionsList({ initialPairings }: ConnectionsListProps) {
  const [pairings, setPairings] = useState<PairingWithUser[]>(initialPairings)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPairing, setSelectedPairing] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const refreshConnections = async () => {
    setIsLoading(true)
    try {
      const updatedPairings = await getUserPairings()
      setPairings(updatedPairings)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh connections",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePairing = async () => {
    if (!selectedPairing) return

    try {
      await removePairing(selectedPairing)
      setPairings(pairings.filter((p) => p.id !== selectedPairing))
      toast({
        title: "Connection removed",
        description: "The connection has been successfully removed",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove connection",
      })
    } finally {
      setIsDialogOpen(false)
      setSelectedPairing(null)
    }
  }

  const confirmRemovePairing = (pairingId: string) => {
    setSelectedPairing(pairingId)
    setIsDialogOpen(true)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const navigateToSendFile = (userId: string) => {
    router.push(`/dashboard/send/${userId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">Your secure connections</h3>
        <Button variant="outline" size="sm" onClick={refreshConnections} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {pairings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center">
          <p className="text-gray-400">You don't have any connections yet.</p>
          <p className="text-sm text-gray-500">
            Generate a pairing code or connect with someone else's code to establish a connection.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pairings.map((pairing) => (
            <Card key={pairing.id} className="border-gray-700 bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-emerald-600">
                        {getInitials(pairing.connectedUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{pairing.connectedUser.name}</p>
                      <p className="text-xs text-gray-400">{pairing.connectedUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigateToSendFile(pairing.connectedUserId)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send File
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmRemovePairing(pairing.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="border-gray-700 bg-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Connection</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to remove this connection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 bg-gray-700 text-white hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRemovePairing} className="bg-red-500 hover:bg-red-600">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
