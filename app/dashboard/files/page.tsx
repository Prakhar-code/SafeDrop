import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSharedFiles } from "@/lib/actions/file-actions"
import SharedFilesList from "@/components/files/shared-files-list"

export const metadata = {
  title: "Shared Files | SafeDrop",
  description: "View files shared with you",
}

export default async function FilesPage() {
  const session = await getServerSession(authOptions)
  const sharedFiles = await getSharedFiles(session?.user?.id as string)

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-3xl font-bold">Shared Files</h1>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="mb-4 text-xl font-semibold">Files Shared With You</h2>
        <SharedFilesList initialFiles={sharedFiles} />
      </div>
    </div>
  )
}
