import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

// Book Schema
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  coverImage: { type: String, default: "" },
  available: { type: Boolean, default: true },
  borrowedBy: { type: String, default: null },
  borrowerPhone: { type: String, default: null },
  borrowedDate: { type: Date, default: null },
  dueDate: { type: Date, default: null },
}, { timestamps: true })

const Book = mongoose.models.Book || mongoose.model('Book', bookSchema)

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return
  await mongoose.connect(process.env.MONGODB_URI!)
}

export async function GET() {
  try {
    await connectDB()
    const books = await Book.find({})
    return NextResponse.json(books)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}
