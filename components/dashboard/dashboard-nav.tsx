"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import type { User } from "next-auth"
import { LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

interface DashboardNavProps {
  user: User
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const routes = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/upload", label: "Upload File" },
    { href: "/dashboard/connections", label: "Connections" },
  ]

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className="border-b border-gray-700 bg-gray-800">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-bold">
          Safe<span className="text-emerald-400">Drop</span>
        </Link>

        <nav className="hidden md:flex md:items-center md:space-x-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`text-sm font-medium transition-colors hover:text-emerald-400 ${
                pathname === route.href ? "text-emerald-400" : "text-gray-300"
              }`}
            >
              {route.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <div className="hidden items-center space-x-2 md:flex">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-emerald-600">{getInitials(user.name || "User")}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user.name}</span>
          </div>

          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="hidden md:flex">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-gray-700 bg-gray-800 text-white">
              <div className="flex items-center space-x-2 border-b border-gray-700 pb-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-600">{getInitials(user.name || "User")}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <nav className="mt-4 flex flex-col space-y-4">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`text-sm font-medium transition-colors hover:text-emerald-400 ${
                      pathname === route.href ? "text-emerald-400" : "text-gray-300"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {route.label}
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="justify-start px-0"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
