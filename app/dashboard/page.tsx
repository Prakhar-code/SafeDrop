import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserPairings } from "@/lib/actions/pairing-actions"
import DashboardTabs from "@/components/dashboard/dashboard-tabs"

export const metadata: Metadata = {
  title: "Dashboard | SafeDrop",
  description: "Manage your secure file sharing",
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const pairings = await getUserPairings(session?.user?.id as string)

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      <DashboardTabs pairings={pairings} />
    </div>
  )
}
