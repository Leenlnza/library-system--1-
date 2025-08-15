const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
const http = require("http")
const fs = require("fs")
const url = require("url")
const bcrypt = require("bcryptjs") // เพิ่ม bcryptjs
const jwt = require("jsonwebtoken") // เพิ่ม jsonwebtoken
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey" // ดึง JWT_SECRET จาก .env

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(__dirname))

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://LLL:LLL@000.4sgleop.mongodb.net/?retryWrites=true&w=majority&appName=000", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
const db = mongoose.connection
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
  console.log("Connected to MongoDB")
})

// Models
const Book = require("./models/Book")
const BorrowHistory = require("./models/BorrowHistory")
const Member = require("./models/Member") // เพิ่ม Member model

// Serve static files (เหมือนเดิม)
app.get("/", (req, res) => {
  serveFile("index.html", "text/html", res)
})

function serveFile(filename, contentType, res) {
  const filePath = path.join(__dirname, filename)
  console.log("📄 Serving file:", filePath)

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error('❌ File not found:", filePath)')
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>ไฟล์ไม่พบ</title></head>
        <body>
          <h1>❌ ไฟล์ไม่พบ</h1>
          <p>ไม่พบไฟล์: ${filename}</p>
          <p>กรุณาตรวจสอบว่าไฟล์อยู่ในโฟลเดอร์เดียวกับ server.js</p>
        </body>
        </html>
      `)
      return
    }
    res.writeHead(200, { "Content-Type": contentType + "; charset=utf-8" })
    res.end(data)
  })
}

// API Routes

// Books API (ใช้ MongoDB)
app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find({})
    console.log("📚 Serving books data:", books.length, "books")
    res.json(books)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/books/:id/borrow", async (req, res) => {
  try {
    console.log("📝 Borrow request for book:", req.params.id)
    const { borrowerName, borrowerPhone } = req.body
    const book = await Book.findById(req.params.id)
    if (!book) {
      console.log("❌ Book not found:", req.params.id)
      return res.status(404).json({ error: "ไม่พบหนังสือ" })
    }
    if (!book.available) {
      console.log("❌ Book not available:", req.params.id)
      return res.status(400).json({ error: "หนังสือถูกยืมแล้ว" })
    }

    if (!borrowerName) {
      console.log("❌ No borrower name provided")
      return res.status(400).json({ error: "กรุณาใส่ชื่อผู้ยืม" })
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

    await BorrowHistory.create({
      bookId: book._id,
      bookTitle: book.title,
      borrower: borrowerName,
      borrowerPhone: borrowerPhone,
      borrowedDate: borrowedDate,
      dueDate: dueDate,
      status: "borrowed",
    })

    console.log("✅ Book borrowed successfully:", book.title, "by", borrowerName)
    res.json({
      message: "ยืมหนังสือเรียบร้อยแล้ว",
      book,
    })
  } catch (error) {
    console.error("❌ Borrow error:", error)
    res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" })
  }
})

app.post("/api/books/:id/return", async (req, res) => {
  try {
    console.log("📝 Return request for book:", req.params.id)
    const { borrowerName, borrowerPhone } = req.body
    const book = await Book.findById(req.params.id)
    if (!book) {
      console.log("❌ Book not found:", req.params.id)
      return res.status(404).json({ error: "ไม่พบหนังสือ" })
    }

    if (book.available) {
      console.log("❌ Book not borrowed:", req.params.id)
      return res.status(400).json({ error: "หนังสือนี้ยังไม่ได้ถูกยืม" })
    }

    if (book.borrowedBy !== borrowerName) {
      console.log("❌ Borrower name mismatch:", book.borrowedBy, "vs", borrowerName)
      return res.status(403).json({ error: "ชื่อผู้ยืมไม่ตรงกับข้อมูลในระบบ" })
    }
    if (borrowerPhone && book.borrowerPhone && book.borrowerPhone !== borrowerPhone) {
      console.log("❌ Phone number mismatch")
      return res.status(403).json({ error: "เบอร์โทรศัพท์ไม่ตรงกับข้อมูลในระบบ" })
    }

    const returnedDate = new Date()

    book.available = true
    book.borrowedBy = undefined
    book.borrowerPhone = undefined
    book.borrowedDate = undefined
    book.dueDate = undefined
    await book.save()

    await BorrowHistory.findOneAndUpdate(
      {
        bookId: book._id,
        borrower: borrowerName,
        status: "borrowed",
      },
      {
        returnedDate: returnedDate,
        status: "returned",
      },
      {
        new: true,
      },
    )

    console.log("✅ Book returned successfully:", book.title, "by", borrowerName)
    res.json({
      message: "คืนหนังสือเรียบร้อยแล้ว",
      book,
    })
  } catch (error) {
    console.error("❌ Return error:", error)
    res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" })
  }
})

// History API (ใช้ MongoDB)
app.get("/api/history", async (req, res) => {
  try {
    const history = await BorrowHistory.find({}).sort({ borrowedDate: -1 })
    console.log("📜 Serving history data:", history.length, "records")
    res.json(history)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Borrowed Books API (ใช้ MongoDB)
app.get("/api/borrowed", async (req, res) => {
  try {
    const borrowedBooks = await Book.find({ available: false })
    console.log("📋 Serving borrowed books:", borrowedBooks.length, "books")
    res.json(borrowedBooks)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Member API (ใหม่)
app.get("/api/members", async (req, res) => {
  try {
    const members = await Member.find({}).select("-password") // ไม่ส่ง password กลับไป
    console.log("👥 Serving members data:", members.length, "members")
    res.json(members)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Auth API (ใหม่)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" })
    }

    const existingMember = await Member.findOne({ email })
    if (existingMember) {
      return res.status(400).json({ error: "อีเมลนี้มีในระบบแล้ว" })
    }

    const hashedPassword = await bcrypt.hash(password, 10) // เข้ารหัสรหัสผ่าน

    const newMember = await Member.create({
      name,
      email,
      phone,
      password: hashedPassword,
    })

    console.log("✅ New member registered:", newMember.email)
    res.status(201).json({
      message: "สมัครสมาชิกเรียบร้อยแล้ว",
      member: { id: newMember._id, name: newMember.name, email: newMember.email },
    })
  } catch (error) {
    console.error("❌ Register error:", error)
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการสมัครสมาชิก" })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "กรุณาใส่อีเมลและรหัสผ่าน" })
    }

    const member = await Member.findOne({ email })
    if (!member) {
      return res.status(400).json({ error: "ไม่พบผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" })
    }

    const isMatch = await bcrypt.compare(password, member.password)
    if (!isMatch) {
      return res.status(400).json({ error: "ไม่พบผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" })
    }

    const token = jwt.sign(
      { id: member._id, email: member.email, name: member.name },
      JWT_SECRET,
      { expiresIn: "1h" }, // Token หมดอายุใน 1 ชั่วโมง
    )

    console.log("✅ Member logged in:", member.email)
    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      member: { id: member._id, name: member.name, email: member.email },
    })
  } catch (error) {
    console.error("❌ Login error:", error)
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" })
  }
})

// Initialize sample data (ใช้ MongoDB)
app.post("/api/init-data", async (req, res) => {
  try {
    const existingBooksCount = await Book.countDocuments()
    if (existingBooksCount > 0) {
      return res.json({ message: "ข้อมูลหนังสือมีอยู่แล้ว" })
    }

    const sampleBooks = [
      {
        title: "แฮร์รี่ พอตเตอร์ กับศิลาอาถรรพ์",
        author: "J.K. Rowling",
        category: "นิยาย",
        coverImage: "/placeholder.svg?height=200&width=150&text=Harry+Potter",
      },
      {
        title: "เศรษฐศาสตร์พอเพียง",
        author: "ศ.ดร.อภิชัย พันธเสน",
        category: "เศรษฐศาสตร์",
        coverImage: "/placeholder.svg?height=200&width=150&text=Economics",
      },
      {
        title: "คิดเร็ว คิดช้า",
        author: "Daniel Kahneman",
        category: "จิตวิทยา",
        coverImage: "/placeholder.svg?height=200&width=150&text=Thinking+Fast+Slow",
      },
      {
        title: "ประวัติศาสตร์ไทย",
        author: "ศ.ดร.สุจิต วงษ์เทศ",
        category: "ประวัติศาสตร์",
        coverImage: "/placeholder.svg?height=200&width=150&text=Thai+History",
      },
      {
        title: "การเขียนโปรแกรม JavaScript",
        author: "John Doe",
        category: "เทคโนโลยี",
        coverImage: "/placeholder.svg?height=200&width=150&text=JavaScript",
      },
    ]

    await Book.insertMany(sampleBooks)
    res.json({ message: "เพิ่มข้อมูลตัวอย่างเรียบร้อยแล้ว" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Test API (ใช้ MongoDB)
app.get("/api/test", async (req, res) => {
  try {
    const booksCount = await Book.countDocuments()
    const historyCount = await BorrowHistory.countDocuments()
    const membersCount = await Member.countDocuments() // เพิ่มนับสมาชิก
    res.json({
      message: "API ทำงานปกติ",
      timestamp: new Date().toISOString(),
      booksCount: booksCount,
      historyCount: historyCount,
      membersCount: membersCount, // ส่งจำนวนสมาชิกกลับไปด้วย
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const server = http.createServer(app)

server.listen(PORT, () => {
  console.log(`🚀 ระบบห้องสมุดเริ่มทำงานแล้ว!`)
  console.log(`📖 เปิดเบราว์เซอร์ไปที่: http://localhost:${PORT}`)
  console.log(`🔧 ทดสอบ API: http://localhost:${PORT}/api/test`)
  console.log(`⏹️  หยุดเซิร์ฟเวอร์: กด Ctrl+C`)
  console.log(`\n📚 ฟีเจอร์ที่มี:`)
  console.log(`   ✅ ยืม-คืนหนังสือ`)
  console.log(`   ✅ ตรวจสอบตัวตนผู้คืน`)
  console.log(`   ✅ ประวัติการยืม`)
  console.log(`   ✅ หนังสือเกินกำหนด`)
  console.log(`   ✅ ระบบสมาชิก (ลงทะเบียน/เข้าสู่ระบบ)`)
  console.log(`   ✅ ไม่ต้อง npm install (ถ้าติดตั้งแล้ว)`)
})

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 กำลังปิดเซิร์ฟเวอร์...")
  console.log("✅ ปิดเซิร์ฟเวอร์เรียบร้อยแล้ว")
  process.exit(0)
})
