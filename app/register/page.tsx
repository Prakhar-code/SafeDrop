import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import RegisterForm from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Register | SafeDrop",
  description: "Create a new account on SafeDrop",
}

export default async function RegisterPage() {
  const session = await getServerSession(authOptions)

  // Redirect to dashboard if already logged in
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4">
        <Link href="/" className="mb-8 text-3xl font-bold">
          Safe<span className="text-emerald-400">Drop</span>
        </Link>

        <div className="w-full max-w-md">
          <RegisterForm />

          <div className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
