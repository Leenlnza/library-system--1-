import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const { borrowerName, borrowerPhone } = await request.json()
    
    const book = await Book.findById(params.id)
    if (!book || !book.available) {
      return NextResponse.json({ error: 'Book not available' }, { status: 400 })
    }

    const borrowedDate = new Date()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)

    book.available = false
    book.borrowedBy = borrowerName
    book.borrowerPhone = borrowerPhone
    book.borrowedDate = borrowedDate
    book.dueDate = dueDate
    await book.save()

    return NextResponse.json({ message: 'Book borrowed successfully', book })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to borrow book' }, { status: 500 })
  }
}
