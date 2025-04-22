"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UploadForm from "@/components/upload-form"
import PairingGenerator from "@/components/pairing/pairing-generator"
import PairingConnector from "@/components/pairing/pairing-connector"
import ConnectionsList from "@/components/pairing/connections-list"
import type { PairingWithUser } from "@/lib/types"

interface DashboardTabsProps {
  pairings: PairingWithUser[]
}

export default function DashboardTabs({ pairings }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState("upload")

  return (
    <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3 bg-gray-700">
        <TabsTrigger value="upload">Upload File</TabsTrigger>
        <TabsTrigger value="connect">Connect</TabsTrigger>
        <TabsTrigger value="connections">Connections</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="space-y-4">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-semibold">Upload Encrypted File</h2>
          <UploadForm />
        </div>
      </TabsContent>

      <TabsContent value="connect" className="space-y-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold">Generate Pairing Code</h2>
            <PairingGenerator />
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold">Connect with Code</h2>
            <PairingConnector onSuccess={() => setActiveTab("connections")} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="connections" className="space-y-4">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-semibold">Your Connections</h2>
          <ConnectionsList initialPairings={pairings} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
