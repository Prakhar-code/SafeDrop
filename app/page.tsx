import type { Metadata } from "next"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import FeatureList from "@/components/feature-list"
import { Shield, LogIn, UserPlus } from "lucide-react"

export const metadata: Metadata = {
  title: "SafeDrop | Secure File Sharing",
  description: "End-to-end encrypted file sharing with zero-knowledge architecture",
}

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bold sm:text-5xl">
            Safe<span className="text-emerald-400">Drop</span>
          </h1>
          <p className="text-lg text-gray-300">End-to-end encrypted file sharing with zero-knowledge architecture</p>
        </header>

        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
          <div className="flex flex-col justify-center">
            <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
              <div className="mb-6 text-center">
                <Shield className="mx-auto mb-4 h-16 w-16 text-emerald-400" />
                <h2 className="mb-4 text-2xl font-bold">Secure File Sharing</h2>
                <p className="mb-6 text-gray-300">
                  SafeDrop provides end-to-end encrypted file sharing with zero-knowledge architecture. Your files are
                  encrypted before they leave your browser.
                </p>
              </div>

              {session ? (
                <Button asChild className="w-full">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Button asChild>
                    <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/register">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <FeatureList />
          </div>
        </div>
      </div>
    </div>
  )
}
