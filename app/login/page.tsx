"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

// อัปเดต Interface ให้ตรงกับข้อมูลที่มาจาก Server
interface Member {
  id: string
  name: string
  email: string
  phone?: string // phone อาจจะไม่ได้ส่งกลับมาตอน login
}

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  })
  const router = useRouter()

  useEffect(() => {
    // ตรวจสอบว่าเข้าสู่ระบบแล้วหรือยังโดยดูจาก token
    const token = localStorage.getItem("token")
    if (token) {
      // ในแอปจริงควรมีการตรวจสอบ token ที่ซับซ้อนกว่านี้ (เช่น ส่งไป verify ที่ server)
      // แต่สำหรับตัวอย่างนี้ เราจะถือว่าถ้ามี token คือเข้าสู่ระบบแล้ว
      router.push("/")
    }
  }, [router])

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert("กรุณาใส่อีเมลและรหัสผ่าน")
      return
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "เข้าสู่ระบบไม่สำเร็จ")
        return
      }

      // เก็บ token และข้อมูลสมาชิกใน localStorage
      localStorage.setItem("token", data.token)
      localStorage.setItem("current-member-info", JSON.stringify(data.member)) // เก็บข้อมูลสมาชิกที่จำเป็น

      alert(`ยินดีต้อนรับ ${data.member.name}!`)
      router.push("/")
    } catch (error) {
      console.error("Login error:", error)
      alert("เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
    }
  }

  const handleRegister = async () => {
    if (
      !registerData.name.trim() ||
      !registerData.email.trim() ||
      !registerData.phone.trim() ||
      !registerData.password.trim()
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "สมัครสมาชิกไม่สำเร็จ")
        return
      }

      alert(`สมัครสมาชิกเรียบร้อย! ยินดีต้อนรับ ${data.member.name}`)
      // หลังจากสมัครสำเร็จ ให้ลองเข้าสู่ระบบอัตโนมัติ
      setLoginEmail(registerData.email)
      setLoginPassword(registerData.password)
      // เรียก handleLogin โดยตรง หรือให้ผู้ใช้กดปุ่ม Login อีกครั้ง
      // สำหรับตอนนี้ เราจะให้ผู้ใช้กด Login เอง หรือจะ redirect ไปหน้า Login
      router.push("/login") // หรือจะเรียก handleLogin() ตรงนี้เลยก็ได้
    } catch (error) {
      console.error("Register error:", error)
      alert("เกิดข้อผิดพลาดในการสมัครสมาชิก")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">ระบบห้องสมุด</h2>
          <p className="mt-2 text-gray-600">เข้าสู่ระบบหรือสมัครสมาชิกใหม่</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">เข้าสู่ระบบ</TabsTrigger>
            <TabsTrigger value="register">สมัครสมาชิก</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">เข้าสู่ระบบ</CardTitle>
                <CardDescription>ใส่อีเมลและรหัสผ่านของคุณเพื่อเข้าสู่ระบบ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="login-email">อีเมล</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">รหัสผ่าน</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="********"
                  />
                </div>
                <Button onClick={handleLogin} className="w-full">
                  เข้าสู่ระบบ
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">สมัครสมาชิก</CardTitle>
                <CardDescription>กรอกข้อมูลเพื่อสมัครสมาชิกใหม่</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="register-name">ชื่อ-นามสกุล</Label>
                  <Input
                    id="register-name"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder="ชื่อ นามสกุล"
                  />
                </div>
                <div>
                  <Label htmlFor="register-email">อีเมล</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="register-phone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="register-phone"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    placeholder="08x-xxx-xxxx"
                  />
                </div>
                <div>
                  <Label htmlFor="register-password">รหัสผ่าน</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="********"
                  />
                </div>
                <Button onClick={handleRegister} className="w-full">
                  สมัครสมาชิก
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
