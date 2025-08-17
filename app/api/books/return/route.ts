import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const { borrowerName, borrowerPhone } = await request.json()
    
    const book = await Book.findById(params.id)
    if (!book || book.available) {
      return NextResponse.json({ error: 'Book not borrowed' }, { status: 400 })
    }

    if (book.borrowedBy !== borrowerName) {
      return NextResponse.json({ error: 'Invalid borrower' }, { status: 403 })
    }

    book.available = true
    book.borrowedBy = null
    book.borrowerPhone = null
    book.borrowedDate = null
    book.dueDate = null
    await book.save()

    return NextResponse.json({ message: 'Book returned successfully', book })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to return book' }, { status: 500 })
  }
}
