// Global variables
let books = []
let currentBookId = null

// API Base URL
const API_BASE = "/api"

// Utility functions
function showLoading() {
  const loading = document.getElementById("loading")
  if (loading) loading.style.display = "block"
}

function hideLoading() {
  const loading = document.getElementById("loading")
  if (loading) loading.style.display = "none"
}

function showError(message) {
  alert("เกิดข้อผิดพลาด: " + message)
}

function showSuccess(message) {
  alert(message)
}

// Check if book is overdue
function isOverdue(dueDate) {
  const today = new Date()
  const due = new Date(dueDate)
  return today > due
}

// Calculate days overdue
function getDaysOverdue(dueDate) {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = today - due
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("th-TH")
}

// Load and display books
async function loadBooks() {
  try {
    showLoading()
    const response = await fetch(`${API_BASE}/books`)
    if (!response.ok) throw new Error("Failed to fetch books")

    books = await response.json()
    displayBooks(books)
  } catch (error) {
    console.error("Error loading books:", error)
    showError("ไม่สามารถโหลดข้อมูลหนังสือได้")
  } finally {
    hideLoading()
  }
}

// Display books
function displayBooks(booksToShow) {
  const booksGrid = document.getElementById("booksGrid")
  const noResults = document.getElementById("noResults")

  if (!booksGrid) return

  if (booksToShow.length === 0) {
    booksGrid.style.display = "none"
    noResults.style.display = "block"
    return
  }

  noResults.style.display = "none"
  booksGrid.style.display = "grid"
  booksGrid.innerHTML = ""

  booksToShow.forEach((book) => {
    const bookCard = createBookCard(book)
    booksGrid.appendChild(bookCard)
  })
}

// Create book card element
function createBookCard(book) {
  const card = document.createElement("div")
  card.className = "book-card"

  let statusClass = book.available ? "status-available" : "status-borrowed"
  let statusText = book.available ? "ว่าง" : "ถูกยืม"

  // Check if overdue
  if (!book.available && book.dueDate && isOverdue(book.dueDate)) {
    statusClass = "status-overdue"
    statusText = "เกินกำหนด"
  }

  const borrowedInfo = !book.available
    ? `
        <div class="book-borrowed-info ${isOverdue(book.dueDate) ? "overdue" : ""}">
            <p><strong>ผู้ยืม:</strong> ${book.borrowedBy}</p>
            <p><strong>เบอร์โทร:</strong> ${book.borrowerPhone || "ไม่ระบุ"}</p>
            <p><i class="fas fa-calendar"></i> <strong>วันที่ยืม:</strong> ${formatDate(book.borrowedDate)}</p>
            <p><i class="fas fa-calendar"></i> <strong>วันที่ต้องคืน:</strong> ${formatDate(book.dueDate)}</p>
            ${isOverdue(book.dueDate) ? `<p style="color: #ef4444; font-weight: bold;"><i class="fas fa-exclamation-triangle"></i> เกินกำหนด ${getDaysOverdue(book.dueDate)} วัน</p>` : ""}
        </div>
    `
    : ""

  card.innerHTML = `
        <div class="book-cover">
            <img src="${book.coverImage}" alt="ปกหนังสือ ${book.title}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\"fas fa-book\\"></i>'">
            <div class="book-status ${statusClass}">
                ${statusText}
            </div>
        </div>
        <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">
                <i class="fas fa-user"></i>
                ${book.author}
            </p>
            <p class="book-category"><strong>หมวดหมู่:</strong> ${book.category}</p>
            ${borrowedInfo}
            <div class="book-actions">
                ${
                  book.available
                    ? `<button class="btn btn-primary" onclick="openBorrowModal('${book._id}')">ยืมหนังสือ</button>`
                    : `<button class="btn btn-danger" onclick="openReturnModal('${book._id}')">คืนหนังสือ</button>`
                }
            </div>
        </div>
    `

  return card
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById("searchInput")
  if (!searchInput) return

  searchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase()
    const filteredBooks = books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.category.toLowerCase().includes(searchTerm),
    )

    displayBooks(filteredBooks)
  })
}

// Borrow modal functionality
function setupBorrowModal() {
  const modal = document.getElementById("borrowModal")
  const closeBtn = modal.querySelector(".modal-close")
  const cancelBtn = document.getElementById("cancelBorrowBtn")
  const confirmBtn = document.getElementById("confirmBorrowBtn")

  if (!modal) return

  closeBtn.addEventListener("click", closeBorrowModal)
  cancelBtn.addEventListener("click", closeBorrowModal)
  confirmBtn.addEventListener("click", confirmBorrow)

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeBorrowModal()
    }
  })
}

// Return modal functionality
function setupReturnModal() {
  const modal = document.getElementById("returnModal")
  const closeBtn = modal.querySelector(".modal-close")
  const cancelBtn = document.getElementById("cancelReturnBtn")
  const confirmBtn = document.getElementById("confirmReturnBtn")

  if (!modal) return

  closeBtn.addEventListener("click", closeReturnModal)
  cancelBtn.addEventListener("click", closeReturnModal)
  confirmBtn.addEventListener("click", confirmReturn)

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeReturnModal()
    }
  })
}

// Open borrow modal
function openBorrowModal(bookId) {
  const book = books.find((b) => b._id === bookId)
  if (!book) return

  currentBookId = bookId

  const modal = document.getElementById("borrowModal")
  const modalBookCover = document.getElementById("modalBookCover")
  const modalBookTitle = document.getElementById("modalBookTitle")
  const modalBookAuthor = document.getElementById("modalBookAuthor")
  const modalBookCategory = document.getElementById("modalBookCategory")

  modalBookCover.src = book.coverImage
  modalBookTitle.textContent = book.title
  modalBookAuthor.textContent = book.author
  modalBookCategory.textContent = book.category

  modal.classList.add("show")
}

// Close borrow modal
function closeBorrowModal() {
  const modal = document.getElementById("borrowModal")
  modal.classList.remove("show")

  // Clear form
  document.getElementById("borrowerName").value = ""
  document.getElementById("borrowerPhone").value = ""
  currentBookId = null
}

// Open return modal
function openReturnModal(bookId) {
  const book = books.find((b) => b._id === bookId)
  if (!book) return

  currentBookId = bookId

  const modal = document.getElementById("returnModal")
  const modalBookCover = document.getElementById("returnModalBookCover")
  const modalBookTitle = document.getElementById("returnModalBookTitle")
  const modalBookAuthor = document.getElementById("returnModalBookAuthor")
  const modalBookCategory = document.getElementById("returnModalBookCategory")

  modalBookCover.src = book.coverImage
  modalBookTitle.textContent = book.title
  modalBookAuthor.textContent = book.author
  modalBookCategory.textContent = book.category

  modal.classList.add("show")
}

// Close return modal
function closeReturnModal() {
  const modal = document.getElementById("returnModal")
  modal.classList.remove("show")

  // Clear form
  document.getElementById("returnBorrowerName").value = ""
  document.getElementById("returnBorrowerPhone").value = ""
  currentBookId = null
}

// Confirm borrow
async function confirmBorrow() {
  const borrowerName = document.getElementById("borrowerName").value.trim()
  const borrowerPhone = document.getElementById("borrowerPhone").value.trim()

  if (!borrowerName) {
    alert("กรุณาใส่ชื่อผู้ยืม")
    return
  }

  if (!currentBookId) return

  try {
    const response = await fetch(`${API_BASE}/books/${currentBookId}/borrow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        borrowerName,
        borrowerPhone,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to borrow book")
    }

    showSuccess(result.message)
    closeBorrowModal()
    loadBooks() // Reload books
  } catch (error) {
    console.error("Error borrowing book:", error)
    showError(error.message)
  }
}

// Confirm return
async function confirmReturn() {
  const borrowerName = document.getElementById("returnBorrowerName").value.trim()
  const borrowerPhone = document.getElementById("returnBorrowerPhone").value.trim()

  if (!borrowerName) {
    alert("กรุณาใส่ชื่อผู้ยืม")
    return
  }

  if (!currentBookId) return

  try {
    const response = await fetch(`${API_BASE}/books/${currentBookId}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        borrowerName,
        borrowerPhone,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to return book")
    }

    showSuccess(result.message)
    closeReturnModal()
    loadBooks() // Reload books
  } catch (error) {
    console.error("Error returning book:", error)
    showError(error.message)
  }
}

// Load borrowed books (for check-borrow page)
async function loadBorrowedBooks() {
  try {
    showLoading()
    const response = await fetch(`${API_BASE}/borrowed`)
    if (!response.ok) throw new Error("Failed to fetch borrowed books")

    const borrowedBooks = await response.json()
    displayBorrowedBooks(borrowedBooks)
    updateSummary()
  } catch (error) {
    console.error("Error loading borrowed books:", error)
    showError("ไม่สามารถโหลดข้อมูลการยืมได้")
  } finally {
    hideLoading()
  }
}

// Display borrowed books
function displayBorrowedBooks(borrowedBooks) {
  const borrowedList = document.getElementById("borrowedList")
  const noBorrowed = document.getElementById("noBorrowed")

  if (!borrowedList) return

  if (borrowedBooks.length === 0) {
    borrowedList.style.display = "none"
    noBorrowed.style.display = "block"
    return
  }

  noBorrowed.style.display = "none"
  borrowedList.style.display = "block"
  borrowedList.innerHTML = ""

  borrowedBooks.forEach((book) => {
    const borrowedItem = document.createElement("div")
    borrowedItem.className = `borrowed-item ${isOverdue(book.dueDate) ? "overdue" : ""}`

    borrowedItem.innerHTML = `
            <div class="borrowed-info">
                <h3>
                    <i class="fas fa-book"></i>
                    ${book.title}
                    ${isOverdue(book.dueDate) ? '<i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>' : ""}
                </h3>
                <p><strong>ผู้แต่ง:</strong> ${book.author}</p>
                <p><strong>หมวดหมู่:</strong> ${book.category}</p>
                <div class="borrowed-details">
                    <div><strong>ผู้ยืม:</strong> ${book.borrowedBy}</div>
                    <div><strong>เบอร์โทร:</strong> ${book.borrowerPhone || "ไม่ระบุ"}</div>
                    <div><strong>วันที่ยืม:</strong> ${formatDate(book.borrowedDate)}</div>
                    <div><strong>วันที่ต้องคืน:</strong> ${formatDate(book.dueDate)}</div>
                    ${isOverdue(book.dueDate) ? `<div style="color: #ef4444; font-weight: bold;"><strong>เกินกำหนด:</strong> ${getDaysOverdue(book.dueDate)} วัน</div>` : ""}
                </div>
            </div>
            <div class="borrowed-actions">
                <button class="btn btn-danger" onclick="openReturnModal('${book._id}')">คืนหนังสือ</button>
            </div>
        `

    borrowedList.appendChild(borrowedItem)
  })
}

// Update summary
async function updateSummary() {
  try {
    const response = await fetch(`${API_BASE}/books`)
    if (!response.ok) throw new Error("Failed to fetch books")

    const allBooks = await response.json()

    const totalBooks = allBooks.length
    const availableBooks = allBooks.filter((book) => book.available).length
    const borrowedBooks = allBooks.filter((book) => !book.available).length
    const overdueBooks = allBooks.filter((book) => !book.available && book.dueDate && isOverdue(book.dueDate)).length

    const totalBooksEl = document.getElementById("totalBooks")
    const availableBooksEl = document.getElementById("availableBooks")
    const borrowedBooksEl = document.getElementById("borrowedBooks")
    const overdueBooksEl = document.getElementById("overdueBooks")

    if (totalBooksEl) totalBooksEl.textContent = totalBooks
    if (availableBooksEl) availableBooksEl.textContent = availableBooks
    if (borrowedBooksEl) borrowedBooksEl.textContent = borrowedBooks
    if (overdueBooksEl) overdueBooksEl.textContent = overdueBooks
  } catch (error) {
    console.error("Error updating summary:", error)
  }
}

// Load history
async function loadHistory() {
  try {
    showLoading()
    const response = await fetch(`${API_BASE}/history`)
    if (!response.ok) throw new Error("Failed to fetch history")

    const history = await response.json()
    displayHistory(history)
  } catch (error) {
    console.error("Error loading history:", error)
    showError("ไม่สามารถโหลดประวัติได้")
  } finally {
    hideLoading()
  }
}

// Display history
function displayHistory(historyData) {
  const historyList = document.getElementById("historyList")
  const noHistory = document.getElementById("noHistory")

  if (!historyList) return

  if (historyData.length === 0) {
    historyList.style.display = "none"
    noHistory.style.display = "block"
    return
  }

  noHistory.style.display = "none"
  historyList.style.display = "block"
  historyList.innerHTML = ""

  historyData.forEach((record) => {
    const historyItem = document.createElement("div")
    historyItem.className = "history-item"

    historyItem.innerHTML = `
            <div class="history-info">
                <h3>
                    <i class="fas fa-book"></i>
                    ${record.bookTitle}
                </h3>
                <p><strong>ผู้ยืม:</strong> ${record.borrower}</p>
                <p><strong>เบอร์โทร:</strong> ${record.borrowerPhone || "ไม่ระบุ"}</p>
                <div class="history-dates">
                    <span><i class="fas fa-calendar"></i> วันที่ยืม: ${formatDate(record.borrowedDate)}</span>
                    <span><i class="fas fa-calendar"></i> วันที่ต้องคืน: ${formatDate(record.dueDate)}</span>
                    ${record.returnedDate ? `<span><i class="fas fa-calendar-check"></i> วันที่คืน: ${formatDate(record.returnedDate)}</span>` : ""}
                </div>
            </div>
            <div class="history-status ${record.status === "borrowed" ? "status-borrowed" : "status-returned"}">
                ${record.status === "borrowed" ? "กำลังยืม" : "คืนแล้ว"}
            </div>
        `

    historyList.appendChild(historyItem)
  })
}

// Initialize sample data
async function initSampleData() {
  try {
    const response = await fetch(`${API_BASE}/init-data`, {
      method: "POST",
    })
    const result = await response.json()
    console.log(result.message)
  } catch (error) {
    console.error("Error initializing data:", error)
  }
}

// Initialize data on first load
document.addEventListener("DOMContentLoaded", () => {
  initSampleData()
})
