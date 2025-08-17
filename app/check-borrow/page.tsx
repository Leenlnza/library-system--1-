"use client"

import { useState, useEffect } from "react"
import {
  BookIcon,
  Calendar,
  User,
  Search,
  CheckCircle,
  HandIcon as HandHolding,
  TriangleIcon as ExclamationTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

interface Book {
  id: string
  title: string
  author: string
  category: string
  available: boolean
  coverImage: string
  borrowedBy?: string
  borrowerPhone?: string
  borrowedDate?: string
  dueDate?: string
}

export default function CheckBorrowPage() {
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  useEffect(() => {
    fetchBorrowedBooks()
  }, [])

  const fetchBorrowedBooks = async () => {
    try {
      const response = await fetch("/api/borrowed")
      if (!response.ok) {
        throw new Error("Failed to fetch borrowed books")
      }
      
      const data = await response.json()
      setBorrowedBooks(data.map((b: any) => ({
        id: b._id,
        title: b.title,
        author: b.author,
        category: b.category,
        available: b.available,
        coverImage: b.coverImage,
        borrowedBy: b.borrowedBy,
        borrowerPhone: b.borrowerPhone,
        borrowedDate: b.borrowedDate ? new Date(b.borrowedDate).toLocaleDateString("th-TH") : undefined,
        dueDate: b.dueDate ? new Date(b.dueDate).toLocaleDateString("th-TH") : undefined,
      })))
    } catch (error) {
      console.error("Error fetching borrowed books:", error)
      alert("ไม่สามารถโหลดข้อมูลหนังสือที่ถูกยืมได้")
    }
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    const today = new Date()
    const due = new Date(dueDate)
    return today > due
  }

  const getDaysOverdue = (dueDate?: string) => {
    if (!dueDate) return 0
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const handleReturnBook = async (book: Book) => {
    const borrowerName = prompt("กรุณาใส่ชื่อผู้ยืมเพื่อยืนยันการคืน:")
    if (!borrowerName) {
      alert("กรุณาใส่ชื่อผู้ยืม")
      return
    }
    const borrowerPhone = prompt("กรุณาใส่เบอร์โทรศัพท์ผู้ยืม (ถ้ามี):") || ""

    try {
      const response = await fetch(`/api/books/${book.id}/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ borrowerName, borrowerPhone }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "คืนหนังสือไม่สำเร็จ")
        return
      }

      alert("คืนหนังสือเรียบร้อยแล้ว!")
      fetchBorrowedBooks() // Refresh the list
    } catch (error) {
      console.error("Return error:", error)
      alert("เกิดข้อผิดพลาดในการคืนหนังสือ")
    }
  }

  const filteredBorrowedBooks = borrowedBooks.filter(
    (book) =>
      (book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.borrowedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalBooks = borrowedBooks.length
  const availableBooks = borrowedBooks.filter((book) => book.available).length // ควรเป็น 0 ในหน้านี้
  const currentlyBorrowedBooks = borrowedBooks.filter((book) => !book.available).length
  const overdueBooks = borrowedBooks.filter((book) => !book.available && isOverdue(book.dueDate)).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">เช็คการยืมหนังสือ</h1>
          <p className="text-gray-600">ตรวจสอบหนังสือที่กำลังถูกยืมอยู่</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="ค้นหาชื่อผู้ยืม หรือชื่อหนังสือ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <BookIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalBooks}</div>
              <div className="text-sm text-gray-500">หนังสือที่ถูกยืมทั้งหมด</div>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{currentlyBorrowedBooks - overdueBooks}</div>
              <div className="text-sm text-gray-500">กำลังยืม (ปกติ)</div>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
              <HandHolding className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{currentlyBorrowedBooks}</div>
              <div className="text-sm text-gray-500">หนังสือที่ถูกยืม</div>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <ExclamationTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overdueBooks}</div>
              <div className="text-sm text-gray-500">หนังสือเกินกำหนด</div>
            </div>
          </Card>
        </div>

        {/* Borrowed Books List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBorrowedBooks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่มีหนังสือที่ถูกยืมในขณะนี้</p>
            </div>
          ) : (
            filteredBorrowedBooks.map((book) => (
              <Card key={book.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className="aspect-[3/4] relative bg-gray-100">
                  <Image
                    src={book.coverImage || "/placeholder.svg"}
                    alt={`ปกหนังสือ ${book.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium text-white ${isOverdue(book.dueDate) ? 'bg-red-600 animate-pulse' : 'bg-yellow-600'}`}>
                    {isOverdue(book.dueDate) ? `เกินกำหนด ${getDaysOverdue(book.dueDate)} วัน` : "กำลังยืม"}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {book.author}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="text-sm text-gray-600">
                    <strong>หมวดหมู่:</strong> {book.category}
                  </div>

                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <strong>ผู้ยืม:</strong> {book.borrowedBy}
                    </div>
                    <div className="text-sm">
                      <strong>เบอร์โทร:</strong> {book.borrowerPhone || "ไม่ระบุ"}
                    </div>
                    <div className="text-sm flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <strong>วันที่ยืม:</strong> {book.borrowedDate}
                    </div>
                    <div className="text-sm flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <strong>วันที่ต้องคืน:</strong> {book.dueDate}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent" onClick={() => handleReturnBook(book)}>
                    คืนหนังสือ
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
