"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookIcon, LogOut, UserPlus, Home, History, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { jwtDecode } from "jwt-decode" // เพิ่มการนำเข้า jwtDecode

// อัปเดต Interface ให้ตรงกับข้อมูลที่เก็บใน JWT payload
interface Member \{
  id: string
  name: string
  email: string
// phone ไม่จำเป็นต้องอยู่ใน JWT payload ถ้าไม่ได้ใช้บ่อย
\}

export function Navbar()
\
{
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const pathname = usePathname()

  useEffect(() => \{
    const token = localStorage.getItem("token")
    if (token) \{
      try \{
        const decoded: Member = jwtDecode(token) // ถอดรหัส JWT\
        setCurrentMember(decoded)
      \} catch (error) \{\
        console.error(\"Invalid token:\", error)\
        localStorage.removeItem("token") // ลบ token ที่ไม่ถูกต้อง\
        localStorage.removeItem(\"current-member-info")\
        setCurrentMember(null)
      \}
    \}
  \}, [])

  const handleLogout = () => \{
    setCurrentMember(null)
    localStorage.removeItem("token") // ลบ token
    localStorage.removeItem(\"current-member-info\") // ลบข้อมูลสมาชิกที่เก็บไว้\
  \}
\
  const navItems = [\
    \{ href: \"/", label: "หน้าหลัก", icon: Home \},
    \{ href: "/history", label: "ประวัติการยืม", icon: History \},\
    \{ href: "/members", label: "สมาชิก", icon: Users \},
  ]

  return (
    <header className=\"bg-white shadow-sm border-b sticky top-0 z-50">\
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">\
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <BookIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">ระบบห้องสมุด</h1>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              \{navItems.map((item) => \{
                const Icon = item.icon
                return (
                  <Link
                    key=\{item.href\}
                    href=\{item.href\}
                    className=\{cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",\
                      pathname === item.href
                        ? \"bg-blue-100 text-blue-700"\
                        : \"text-gray-600 hover:text-gray-900 hover:bg-gray-100",\
                    )\}\
                  >\
                    <Icon className="h-4 w-4" />
                    \{item.label\}\
                  </Link>\
                )\
              \})\}
            </nav>\
          </div>

          <div className="flex items-center gap-4">
            \{currentMember ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">\{currentMember.name\}</p>
                  <p className="text-xs text-gray-500">\{currentMember.email\}</p>
                </div>
                <Button variant="outline" size="sm" onClick=\{handleLogout\}>
                  <LogOut className="h-4 w-4" />
                  ออกจากระบบ
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  เข้าสู่ระบบ
                </Button>
              </Link>
            )\}
          </div>
        </div>

        \{/* Mobile Navigation */\}
        <div className="md:hidden border-t py-2">
          <nav className="flex justify-around">
            \{navItems.map((item) => \{
              const Icon = item.icon
              return (
                <Link
                  key=\{item.href\}
                  href=\{item.href\}
                  className=\{cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                    pathname === item.href ? "text-blue-700" : "text-gray-600",
                  )\}
                >
                  <Icon className="h-4 w-4" />
                  \{item.label\}
                </Link>
              )
            \})\}
          </nav>
        </div>
      </div>
    </header>
  )
\}
