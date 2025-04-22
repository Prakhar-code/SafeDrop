"use client"

import type React from "react"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { connectWithPairingCode } from "@/lib/actions/pairing-actions"
import { useToast } from "@/hooks/use-toast"

interface PairingConnectorProps {
  onSuccess?: () => void
}

export default function PairingConnector({ onSuccess }: PairingConnectorProps) {
  const [pairingCode, setPairingCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleConnect = async () => {
    if (pairingCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter a valid 6-digit pairing code",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await connectWithPairingCode(pairingCode)

      if (result.success) {
        toast({
          title: "Connection established",
          description: `You are now connected with ${result.userName}`,
        })
        setPairingCode("")
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: result.error || "Failed to connect with this code",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 6 characters
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setPairingCode(value)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Enter the 6-digit code shared with you by another user to establish a secure connection.
      </p>

      <div className="space-y-4">
        <Input
          value={pairingCode}
          onChange={handleInputChange}
          placeholder="Enter 6-digit code"
          className="border-gray-700 bg-gray-700 text-center text-xl tracking-widest"
          maxLength={6}
        />

        <Button onClick={handleConnect} disabled={isLoading || pairingCode.length !== 6} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect"
          )}
        </Button>
      </div>

      <div className="rounded-lg bg-gray-700 p-4 text-sm">
        <p className="font-medium text-emerald-300">How it works:</p>
        <p className="text-gray-300">
          When you enter a valid code, a secure connection will be established between you and the other user. You'll
          then be able to share files securely.
        </p>
      </div>
    </div>
  )
}
