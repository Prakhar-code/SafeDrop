"use client"

import { useState, useEffect } from "react"
import { Loader2, RefreshCw, Copy, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { generatePairingCode } from "@/lib/actions/pairing-actions"
import { useToast } from "@/hooks/use-toast"

export default function PairingGenerator() {
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateCode = async () => {
    setIsLoading(true)
    try {
      const code = await generatePairingCode()
      setPairingCode(code)
      setTimeLeft(300) // Reset timer to 5 minutes
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate pairing code",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    if (pairingCode && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && pairingCode) {
      setPairingCode(null)
      toast({
        title: "Code expired",
        description: "Your pairing code has expired. Generate a new one.",
      })
    }
  }, [timeLeft, pairingCode, toast])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Generate a 6-digit code to share with another user. They can use this code to establish a secure connection with
        you.
      </p>

      {pairingCode ? (
        <div className="space-y-4">
          <Card className="flex flex-col items-center justify-center space-y-2 bg-gray-700 p-6">
            <div className="text-3xl font-bold tracking-widest text-emerald-400">{pairingCode.split("").join(" ")}</div>
            <div className="text-sm text-gray-400">Expires in {formatTime(timeLeft)}</div>
          </Card>

          <div className="flex space-x-2">
            <Button onClick={copyToClipboard} className="flex-1" variant="outline">
              {copied ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
            <Button onClick={generateCode} disabled={isLoading} variant="outline">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={generateCode} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Pairing Code"
          )}
        </Button>
      )}

      <div className="rounded-lg bg-gray-700 p-4 text-sm">
        <p className="font-medium text-amber-300">Security Note:</p>
        <p className="text-gray-300">
          Share this code through a secure channel like a phone call or encrypted message. The code expires in 5 minutes
          and can only be used once.
        </p>
      </div>
    </div>
  )
}
