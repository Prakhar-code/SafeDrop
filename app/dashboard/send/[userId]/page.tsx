import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserById } from "@/lib/actions/user-actions"
import { isPaired } from "@/lib/actions/pairing-actions"
import SendFileForm from "@/components/send-file-form"

interface SendFilePageProps {
  params: {
    userId: string
  }
}

export default async function SendFilePage({ params }: SendFilePageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const { userId } = params
  const recipient = await getUserById(userId)

  if (!recipient) {
    redirect("/dashboard/connections")
  }

  // Check if users are paired
  const paired = await isPaired(session.user.id, userId)

  if (!paired) {
    redirect("/dashboard/connections")
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">Send File</h1>

      <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="mb-4 text-xl font-semibold">Send to: {recipient.name}</h2>
        <SendFileForm recipientId={userId} recipientName={recipient.name} />
      </div>
    </div>
  )
}
