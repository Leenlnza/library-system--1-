"use client"

import { useState, useEffect } from "react"
import { History, BookIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BorrowHistory {
  id: string
  bookTitle: string
  borrower: string
  borrowerPhone?: string // เพิ่ม borrowerPhone
  borrowedDate: string
  returnedDate?: string
  status: "borrowed" | "returned"
}

export default function HistoryPage() {
  const [history, setHistory] = useState<BorrowHistory[]>([])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("/api/history")
        if (!response.ok) {
          throw new Error("Failed to fetch history")
        }
        const data = await response.json()
        setHistory(
          data.map((h: any) => ({
            id: h._id,
            bookTitle: h.bookTitle,
            borrower: h.borrower,
            borrowerPhone: h.borrowerPhone, // เพิ่ม borrowerPhone
            borrowedDate: new Date(h.borrowedDate).toLocaleDateString("th-TH"),
            returnedDate: h.returnedDate ? new Date(h.returnedDate).toLocaleDateString("th-TH") : undefined,
            status: h.status,
          })),
        )
      } catch (error) {
        console.error("Error fetching history:", error)
        alert("ไม่สามารถโหลดประวัติได้")
      }
    }

    fetchHistory()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ประวัติการยืม-คืนหนังสือ</h1>
          <p className="text-gray-600">ดูประวัติการยืมและคืนหนังสือทั้งหมด</p>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">ยังไม่มีประวัติการยืม</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history
              .slice()
              .reverse()
              .map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium flex items-center gap-2">
                          <BookIcon className="h-4 w-4" />
                          {record.bookTitle}
                        </h3>
                        <p className="text-sm text-gray-600">ผู้ยืม: {record.borrower}</p>
                        {record.borrowerPhone && (
                          <p className="text-sm text-gray-500">เบอร์โทร: {record.borrowerPhone}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>วันที่ยืม: {record.borrowedDate}</span>
                          {record.returnedDate && <span>วันที่คืน: {record.returnedDate}</span>}
                        </div>
                      </div>
                      <Badge variant={record.status === "borrowed" ? "destructive" : "default"}>
                        {record.status === "borrowed" ? "กำลังยืม" : "คืนแล้ว"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
