import { Shield, Clock, Lock, Key, FileText, Server } from "lucide-react"

export default function FeatureList() {
  const features = [
    {
      icon: <Shield className="h-6 w-6 text-emerald-400" />,
      title: "Client-Side Encryption",
      description: "Files are encrypted in your browser using AES-256 before upload",
    },
    {
      icon: <Key className="h-6 w-6 text-emerald-400" />,
      title: "Secure Key Exchange",
      description: "RSA encryption protects your symmetric keys during sharing",
    },
    {
      icon: <FileText className="h-6 w-6 text-emerald-400" />,
      title: "Encrypted File Chunking",
      description: "Large files are split into encrypted chunks for secure transfer",
    },
    {
      icon: <Clock className="h-6 w-6 text-emerald-400" />,
      title: "Ephemeral Links",
      description: "Sharing links expire after a set time or single use",
    },
    {
      icon: <Server className="h-6 w-6 text-emerald-400" />,
      title: "Zero-Knowledge Architecture",
      description: "Our servers never see your unencrypted data or keys",
    },
    {
      icon: <Lock className="h-6 w-6 text-emerald-400" />,
      title: "End-to-End Privacy",
      description: "Only the recipient with the correct key can decrypt files",
    },
  ]

  return (
    <div className="space-y-6 rounded-lg bg-gray-800 p-6 shadow-lg">
      <h2 className="text-2xl font-bold">Secure By Design</h2>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex">
            <div className="mr-4 mt-1">{feature.icon}</div>
            <div>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
