// ใช้ built-in modules เท่านั้น - ไม่ต้อง npm install
const http = require("http")
const fs = require("fs")
const path = require("path")
const url = require("url")

const PORT = 3000

// ข้อมูลหนังสือ (เก็บใน memory)
const books = [
  {
    id: "1",
    title: "แฮร์รี่ พอตเตอร์ กับศิลาอาถรรพ์",
    author: "J.K. Rowling",
    category: "นิยาย",
    available: true,
    coverImage: "https://via.placeholder.com/150x200/4f46e5/ffffff?text=Harry+Potter",
  },
  {
    id: "2",
    title: "เศรษฐศาสตร์พอเพียง",
    author: "ศ.ดร.อภิชัย พันธเสน",
    category: "เศรษฐศาสตร์",
    available: true,
    coverImage: "https://via.placeholder.com/150x200/059669/ffffff?text=Economics",
  },
  {
    id: "3",
    title: "คิดเร็ว คิดช้า",
    author: "Daniel Kahneman",
    category: "จิตวิทยา",
    available: false,
    borrowedBy: "สมชาย ใจดี",
    borrowerPhone: "081-234-5678",
    borrowedDate: "2024-01-15",
    dueDate: "2024-01-29",
    coverImage: "https://via.placeholder.com/150x200/dc2626/ffffff?text=Thinking",
  },
  {
    id: "4",
    title: "ประวัติศาสตร์ไทย",
    author: "ศ.ดร.สุจิต วงษ์เทศ",
    category: "ประวัติศาสตร์",
    available: true,
    coverImage: "https://via.placeholder.com/150x200/d97706/ffffff?text=History",
  },
  {
    id: "5",
    title: "การเขียนโปรแกรม JavaScript",
    author: "John Doe",
    category: "เทคโนโลยี",
    available: true,
    coverImage: "https://via.placeholder.com/150x200/7c3aed/ffffff?text=JavaScript",
  },
]

const history = [
  {
    id: "1",
    bookId: "3",
    bookTitle: "คิดเร็ว คิดช้า",
    borrower: "สมชาย ใจดี",
    borrowerPhone: "081-234-5678",
    borrowedDate: "2024-01-15",
    dueDate: "2024-01-29",
    status: "borrowed",
  },
]

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname
  const method = req.method

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (method === "OPTIONS") {
    res.writeHead(200)
    res.end()
    return
  }

  console.log(`${method} ${pathname}`)

  // Serve static files
  // Note: This server expects all static files (index.html, style.css, script.js)
  // to be in the same directory as server-simple.js
  if (pathname === "/" || pathname === "/index.html") {
    serveFile("index.html", "text/html", res)
    return
  }
  if (pathname === "/style.css") {
    serveFile("style.css", "text/css", res)
    return
  }
  if (pathname === "/script.js") {
    serveFile("script.js", "application/javascript", res)
    return
  }

  // API Routes
  if (pathname === "/api/test" && method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
    res.end(
      JSON.stringify({
        message: "API ทำงานปกติ",
        timestamp: new Date().toISOString(),
        booksCount: books.length,
        historyCount: history.length,
        server: "Node.js Built-in HTTP Server",
      }),
    )
    return
  }

  if (pathname === "/api/books" && method === "GET") {
    console.log("📚 Serving books:", books.length, "books")
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
    res.end(JSON.stringify(books))
    return
  }

  if (pathname.match(/^\/api\/books\/(.+)\/borrow$/) && method === "POST") {
    const bookId = pathname.split("/")[3]
    handleBorrow(bookId, req, res)
    return
  }

  if (pathname.match(/^\/api\/books\/(.+)\/return$/) && method === "POST") {
    const bookId = pathname.split("/")[3]
    handleReturn(bookId, req, res)
    return
  }

  if (pathname === "/api/history" && method === "GET") {
    console.log("📜 Serving history:", history.length, "records")
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
    res.end(JSON.stringify(history))
    return
  }

  if (pathname === "/api/borrowed" && method === "GET") {
    const borrowedBooks = books.filter((book) => !book.available)
    console.log("📋 Serving borrowed books:", borrowedBooks.length, "books")
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
    res.end(JSON.stringify(borrowedBooks))
    return
  }

  // 404
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
  res.end(`
    <!DOCTYPE html>
    <html>
    <head><title>ไม่พบหน้า</title></head>
    <body>
      <h1>❌ ไม่พบหน้าที่ต้องการ</h1>
      <p>Path: ${pathname}</p>
      <p><a href="/">← กลับหน้าหลัก</a></p>
    </body>
    </html>
  `)
})

function serveFile(filename, contentType, res) {
  const filePath = path.join(__dirname, filename)
  console.log("📄 Serving file:", filePath)

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("❌ File not found:", filePath)
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>ไฟล์ไม่พบ</title></head>
        <body>
          <h1>❌ ไฟล์ไม่พบ</h1>
          <p>ไม่พบไฟล์: ${filename}</p>
          <p>กรุณาตรวจสอบว่าไฟล์อยู่ในโฟลเดอร์เดียวกับ server-simple.js</p>
          <p>ไฟล์ที่ต้องมี:</p>
          <ul>
            <li>server-simple.js</li>
            <li>index.html</li>
            <li>style.css</li>
            <li>script.js</li>
          </ul>
        </body>
        </html>
      `)
      return
    }
    res.writeHead(200, { "Content-Type": contentType + "; charset=utf-8" })
    res.end(data)
  })
}

function handleBorrow(bookId, req, res) {
  let body = ""
  req.on("data", (chunk) => {
    body += chunk.toString()
  })

  req.on("end", () => {
    try {
      console.log("📝 Borrow request for book:", bookId)
      const { borrowerName, borrowerPhone } = JSON.parse(body)
      const book = books.find((b) => b.id === bookId)

      if (!book) {
        console.log("❌ Book not found:", bookId)
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" })
        res.end(JSON.stringify({ error: "ไม่พบหนังสือ" }))
        return
      }

      if (!book.available) {
        console.log("❌ Book not available:", bookId)
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" })
        res.end(JSON.stringify({ error: "หนังสือถูกยืมแล้ว" }))
        return
      }

      if (!borrowerName) {
        console.log("❌ No borrower name provided")
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" })
        res.end(JSON.stringify({ error: "กรุณาใส่ชื่อผู้ยืม" }))
        return
      }

      const borrowedDate = new Date().toISOString().split("T")[0]
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      // Update book
      book.available = false
      book.borrowedBy = borrowerName
      book.borrowerPhone = borrowerPhone
      book.borrowedDate = borrowedDate
      book.dueDate = dueDate

      // Add to history
      const historyRecord = {
        id: Date.now().toString(),
        bookId: book.id,
        bookTitle: book.title,
        borrower: borrowerName,
        borrowerPhone: borrowerPhone,
        borrowedDate: borrowedDate,
        dueDate: dueDate,
        status: "borrowed",
      }
      history.push(historyRecord)

      console.log("✅ Book borrowed successfully:", book.title, "by", borrowerName)
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
      res.end(JSON.stringify({ message: "ยืมหนังสือเรียบร้อยแล้ว", book }))
    } catch (error) {
      console.error("❌ Borrow error:", error)
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" })
      res.end(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }))
    }
  })
}

function handleReturn(bookId, req, res) {
  let body = ""
  req.on("data", (chunk) => {
    body += chunk.toString()
  })

  req.on("end", () => {
    try {
      console.log("📝 Return request for book:", bookId)
      const { borrowerName, borrowerPhone } = JSON.parse(body)
      const book = books.find((b) => b.id === bookId)

      if (!book) {
        console.log("❌ Book not found:", bookId)
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" })
        res.end(JSON.stringify({ error: "ไม่พบหนังสือ" }))
        return
      }

      if (book.available) {
        console.log("❌ Book not borrowed:", bookId)
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" })
        res.end(JSON.stringify({ error: "หนังสือนี้ยังไม่ได้ถูกยืม" }))
        return
      }

      // Verify borrower identity
      if (book.borrowedBy !== borrowerName) {
        console.log("❌ Borrower name mismatch:", book.borrowedBy, "vs", borrowerName)
        res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" })
        res.end(JSON.stringify({ error: "ชื่อผู้ยืมไม่ตรงกับข้อมูลในระบบ" }))
        return
      }

      if (borrowerPhone && book.borrowerPhone && book.borrowerPhone !== borrowerPhone) {
        console.log("❌ Phone number mismatch")
        res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" })
        res.end(JSON.stringify({ error: "เบอร์โทรศัพท์ไม่ตรงกับข้อมูลในระบบ" }))
        return
      }

      const returnedDate = new Date().toISOString().split("T")[0]

      // Update book
      book.available = true
      delete book.borrowedBy
      delete book.borrowerPhone
      delete book.borrowedDate
      delete book.dueDate

      // Update history
      const historyRecord = history.find(
        (h) => h.bookId === book.id && h.borrower === borrowerName && h.status === "borrowed",
      )

      if (historyRecord) {
        historyRecord.returnedDate = returnedDate
        historyRecord.status = "returned"
      }

      console.log("✅ Book returned successfully:", book.title, "by", borrowerName)
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
      res.end(JSON.stringify({ message: "คืนหนังสือเรียบร้อยแล้ว", book }))
    } catch (error) {
      console.error("❌ Return error:", error)
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" })
      res.end(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }))
    }
  })
}

server.listen(PORT, () => {
  console.log(`🚀 ระบบห้องสมุดเริ่มทำงานแล้ว!`)
  console.log(`📖 เปิดเบราว์เซอร์ไปที่: http://localhost:${PORT}`)
  console.log(`🔧 ทดสอบ API: http://localhost:${PORT}/api/test`)
  console.log(`📚 ข้อมูลหนังสือ: ${books.length} เล่ม`)
  console.log(`📜 ประวัติการยืม: ${history.length} รายการ`)
  console.log(`⏹️  หยุดเซิร์ฟเวอร์: กด Ctrl+C`)
  console.log(`\n📚 ฟีเจอร์ที่มี:`)
  console.log(`   ✅ ยืม-คืนหนังสือ`)
  console.log(`   ✅ ตรวจสอบตัวตนผู้คืน`)
  console.log(`   ✅ ประวัติการยืม`)
  console.log(`   ✅ หนังสือเกินกำหนด`)
  console.log(`   ✅ ไม่ต้อง npm install`)
})

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 กำลังปิดเซิร์ฟเวอร์...")
  console.log("✅ ปิดเซิร์ฟเวอร์เรียบร้อยแล้ว")
  process.exit(0)
})
