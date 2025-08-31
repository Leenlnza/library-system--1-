// Global variables
let books = []
let history = []
let currentBookId = null
let currentPage = "books"
let currentMember = null // เพิ่มตัวแปรสำหรับเก็บข้อมูลสมาชิกที่เข้าสู่ระบบ

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

function showStatus(message, type = "success") {
  const statusMessage = document.getElementById("statusMessage")
  statusMessage.className = `status-message status-${type}`
  statusMessage.innerHTML = `
        <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-triangle"}"></i>
        ${message}
    `
  statusMessage.style.display = "block"

  setTimeout(() => {
    statusMessage.style.display = "none"
  }, 5000)
}

function showError(message) {
  console.error("❌ Error:", message)
  showStatus(message, "error")
}

function showSuccess(message) {
  console.log("✅ Success:", message)
  showStatus(message, "success")
}

// Test API function
async function testAPI() {
  console.log("🔧 Testing API...")

  try {
    const response = await fetch(`${API_BASE}/test`)
    const data = await response.json()

    if (response.ok) {
      showSuccess(
        `API ทำงานปกติ! หนังสือ: ${data.booksCount} เล่ม, ประวัติ: ${data.historyCount} รายการ, สมาชิก: ${data.membersCount} คน`,
      )
    } else {
      throw new Error(data.error || "API test failed")
    }
  } catch (error) {
    showError("API ไม่ทำงาน: " + error.message)
  }
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
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("th-TH")
  } catch (error) {
    return dateString
  }
}

// Page navigation
function showPage(page) {
  console.log("📄 Switching to page:", page)

  // Hide all pages
  document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"))

  // Remove active class from all nav links
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"))

  // Show selected page
  const pageElement = document.getElementById(page + "Page")
  if (pageElement) {
    pageElement.style.display = "block"
  }

  // Add active class to selected nav link
  const clickedLink = event.currentTarget // Use currentTarget for the element with the event listener
  if (clickedLink) {
    clickedLink.classList.add("active")
  }

  currentPage = page

  // Load data for the page
  if (page === "books") {
    loadBooks()
  } else if (page === "borrowed") {
    loadBorrowedBooks()
    updateSummary()
  } else if (page === "history") {
    loadHistory()
  }
}

// Load and display books
async function loadBooks() {
  console.log("📚 Loading books...")

  try {
    showLoading()

    const response = await fetch(`${API_BASE}/books`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("📚 Books loaded:", data.length, "books")

    books = data
    displayBooks(books)
  } catch (error) {
    console.error("❌ Error loading books:", error)
    showError("ไม่สามารถโหลดข้อมูลหนังสือได้: " + error.message)
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
    if (noResults) noResults.style.display = "block"
    return
  }

  if (noResults) noResults.style.display = "none"
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
            <img src="${book.coverImage}" alt="ปกหนังสือ ${book.title}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\"fas fa-book\\"></i>
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

// Modal functions
function setupModals() {
  // Borrow modal
  const borrowModal = document.getElementById("borrowModal")
  const borrowCloseBtn = borrowModal.querySelector(".modal-close")
  const cancelBorrowBtn = document.getElementById("cancelBorrowBtn")
  const confirmBorrowBtn = document.getElementById("confirmBorrowBtn")

  borrowCloseBtn.addEventListener("click", closeBorrowModal)
  cancelBorrowBtn.addEventListener("click", closeBorrowModal)
  confirmBorrowBtn.addEventListener("click", confirmBorrow)

  borrowModal.addEventListener("click", (e) => {
    if (e.target === borrowModal) {
      closeBorrowModal()
    }
  })

  // Return modal
  const returnModal = document.getElementById("returnModal")
  const returnCloseBtn = returnModal.querySelector(".modal-close")
  const cancelReturnBtn = document.getElementById("cancelReturnBtn")
  const confirmReturnBtn = document.getElementById("confirmReturnBtn")

  returnCloseBtn.addEventListener("click", closeReturnModal)
  cancelReturnBtn.addEventListener("click", closeReturnModal)
  confirmReturnBtn.addEventListener("click", confirmReturn)

  returnModal.addEventListener("click", (e) => {
    if (e.target === returnModal) {
      closeReturnModal()
    }
  })
}

// Open borrow modal
function openBorrowModal(bookId) {
  if (!currentMember) {
    showError("กรุณาเข้าสู่ระบบก่อนยืมหนังสือ")
    openAuthModal("login") // เปิด modal เข้าสู่ระบบ
    return
  }

  const book = books.find((b) => b._id === bookId)
  if (!book) {
    showError("ไม่พบหนังสือที่ต้องการยืม")
    return
  }
  

  currentBookId = bookId

  const modal = document.getElementById("borrowModal")
  const modalBookCover = document.getElementById("modalBookCover")
  const modalBookTitle = document.getElementById("modalBookTitle")
  const modalBookAuthor = document.getElementById("modalBookAuthor")
  const modalBookCategory = document.getElementById("modalBookCategory")
  const borrowerNameInput = document.getElementById("borrowerName")
  const borrowerPhoneInput = document.getElementById("borrowerPhone")
  const borrowerInfoAlert = document.getElementById("borrowerInfoAlert")
  const borrowerInfoText = document.getElementById("borrowerInfoText")
  const borrowerNameGroup = document.getElementById("borrowerNameGroup")
  const borrowerPhoneGroup = document.getElementById("borrowerPhoneGroup")

  modalBookCover.src = book.coverImage
  modalBookTitle.textContent = book.title
  modalBookAuthor.textContent = book.author
  modalBookCategory.textContent = book.category

  // Pre-fill borrower info if logged in
  if (currentMember) {
    borrowerNameInput.value = currentMember.name
    borrowerPhoneInput.value = currentMember.phone || ""
    borrowerNameInput.readOnly = true
    borrowerPhoneInput.readOnly = true
    borrowerNameGroup.style.display = "none"
    borrowerPhoneGroup.style.display = "none"
    borrowerInfoAlert.style.display = "block"
    borrowerInfoText.innerHTML = `คุณกำลังยืมในชื่อ: <strong>${currentMember.name}</strong> (${currentMember.email})`
  } else {
    borrowerNameInput.value = ""
    borrowerPhoneInput.value = ""
    borrowerNameInput.readOnly = false
    borrowerPhoneInput.readOnly = false
    borrowerNameGroup.style.display = "block"
    borrowerPhoneGroup.style.display = "block"
    borrowerInfoAlert.style.display = "none"
  }

  modal.classList.add("show")
}

// Close borrow modal
function closeBorrowModal() {
  const modal = document.getElementById("borrowModal")
  modal.classList.remove("show")

  // Clear form
  document.getElementById("borrowerName").value = ""
  document.getElementById("borrowerPhone").value = ""
  document.getElementById("borrowerName").readOnly = false
  document.getElementById("borrowerPhone").readOnly = false
  document.getElementById("borrowerNameGroup").style.display = "block"
  document.getElementById("borrowerPhoneGroup").style.display = "block"
  document.getElementById("borrowerInfoAlert").style.display = "none"
  currentBookId = null
}

// Open return modal
function openReturnModal(bookId) {
  if (!currentMember) {
    showError("กรุณาเข้าสู่ระบบก่อนคืนหนังสือ")
    openAuthModal("login") // เปิด modal เข้าสู่ระบบ
    return
  }

  const book = books.find((b) => b._id === bookId)
  if (!book) {
    showError("ไม่พบหนังสือที่ต้องการคืน")
    return
  }

  currentBookId = bookId

  const modal = document.getElementById("returnModal")
  const modalBookCover = document.getElementById("returnModalBookCover")
  const modalBookTitle = document.getElementById("returnModalBookTitle")
  const modalBookAuthor = document.getElementById("returnModalBookAuthor")
  const modalBookCategory = document.getElementById("returnModalBookCategory")
  const returnBorrowerNameInput = document.getElementById("returnBorrowerName")
  const returnBorrowerPhoneInput = document.getElementById("returnBorrowerPhone")
  const returnerInfoAlert = document.getElementById("returnerInfoAlert")
  const returnerInfoText = document.getElementById("returnerInfoText")
  const returnerNameGroup = document.getElementById("returnerNameGroup")
  const returnerPhoneGroup = document.getElementById("returnerPhoneGroup")

  modalBookCover.src = book.coverImage
  modalBookTitle.textContent = book.title
  modalBookAuthor.textContent = book.author
  modalBookCategory.textContent = book.category

  // Pre-fill returner info if logged in
  if (currentMember) {
    returnBorrowerNameInput.value = currentMember.name
    returnBorrowerPhoneInput.value = currentMember.phone || ""
    returnBorrowerNameInput.readOnly = true
    returnBorrowerPhoneInput.readOnly = true
    returnerNameGroup.style.display = "none"
    returnerPhoneGroup.style.display = "none"
    returnerInfoAlert.style.display = "block"
    returnerInfoText.innerHTML = `คุณกำลังยืนยันตัวตนในชื่อ: <strong>${currentMember.name}</strong> (${currentMember.email})`
  } else {
    returnBorrowerNameInput.value = ""
    returnBorrowerPhoneInput.value = ""
    returnBorrowerNameInput.readOnly = false
    returnBorrowerPhoneInput.readOnly = false
    returnerNameGroup.style.display = "block"
    returnerPhoneGroup.style.display = "block"
    returnerInfoAlert.style.display = "none"
  }

  modal.classList.add("show")
}

// Close return modal
function closeReturnModal() {
  const modal = document.getElementById("returnModal")
  modal.classList.remove("show")

  // Clear form
  document.getElementById("returnBorrowerName").value = ""
  document.getElementById("returnBorrowerPhone").value = ""
  document.getElementById("returnBorrowerName").readOnly = false
  document.getElementById("returnBorrowerPhone").readOnly = false
  document.getElementById("returnerNameGroup").style.display = "block"
  document.getElementById("returnerPhoneGroup").style.display = "block"
  document.getElementById("returnerInfoAlert").style.display = "none"
  currentBookId = null
}

// Confirm borrow
async function confirmBorrow() {
  const borrowerName = document.getElementById("borrowerName").value.trim()
  const borrowerPhone = document.getElementById("borrowerPhone").value.trim()

  if (!borrowerName) {
    showError("กรุณาใส่ชื่อผู้ยืม")
    return
  }

  if (!currentBookId) {
    showError("ไม่พบรหัสหนังสือ")
    return
  }

  try {
    console.log("📝 Borrowing book:", currentBookId, "by", borrowerName)

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

    console.log("✅ Book borrowed successfully")
    showSuccess(result.message)
    closeBorrowModal()
    loadBooks() // Reload books
  } catch (error) {
    console.error("❌ Error borrowing book:", error)
    showError("ไม่สามารถยืมหนังสือได้: " + error.message)
  }
}

// Confirm return
async function confirmReturn() {
  const borrowerName = document.getElementById("returnBorrowerName").value.trim()
  const borrowerPhone = document.getElementById("returnBorrowerPhone").value.trim()

  if (!borrowerName) {
    showError("กรุณาใส่ชื่อผู้ยืม")
    return
  }

  if (!currentBookId) {
    showError("ไม่พบรหัสหนังสือ")
    return
  }

  try {
    console.log("📝 Returning book:", currentBookId, "by", borrowerName)

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

    console.log("✅ Book returned successfully")
    showSuccess(result.message)
    closeReturnModal()

    // Reload current page data
    if (currentPage === "books") {
      loadBooks()
    } else if (currentPage === "borrowed") {
      loadBorrowedBooks()
      updateSummary()
    }
  } catch (error) {
    console.error("❌ Error returning book:", error)
    showError("ไม่สามารถคืนหนังสือได้: " + error.message)
  }
}

// Load borrowed books
async function loadBorrowedBooks() {
  console.log("📋 Loading borrowed books...")

  try {
    const response = await fetch(`${API_BASE}/borrowed`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const borrowedBooks = await response.json()
    console.log("📋 Borrowed books loaded:", borrowedBooks.length, "books")

    displayBorrowedBooks(borrowedBooks)
  } catch (error) {
    console.error("❌ Error loading borrowed books:", error)
    showError("ไม่สามารถโหลดข้อมูลการยืมได้: " + error.message)
  }
}

// Display borrowed books
function displayBorrowedBooks(borrowedBooks) {
  const borrowedList = document.getElementById("borrowedList")
  const noBorrowed = document.getElementById("noBorrowed")

  if (!borrowedList) return

  if (!currentMember) {
    borrowedList.style.display = "none"
    if (noBorrowed) {
      noBorrowed.style.display = "block"
      noBorrowed.textContent = "กรุณาเข้าสู่ระบบเพื่อดูรายการหนังสือที่คุณยืม"
    }
    return
  }

  // กรองเฉพาะหนังสือที่ผู้ใช้ปัจจุบันยืม
  const userBorrowedBooks = borrowedBooks.filter(
    book => book.borrowedBy && book.borrowedBy.trim().toLowerCase() === currentMember.name.trim().toLowerCase()
  )

  if (userBorrowedBooks.length === 0) {
    borrowedList.style.display = "none"
    if (noBorrowed) noBorrowed.style.display = "block"
    return
  }

  if (noBorrowed) noBorrowed.style.display = "none"
  borrowedList.style.display = "grid"
  borrowedList.innerHTML = ""

  userBorrowedBooks.forEach((book) => {
    const bookCard = createBookCard(book)
    borrowedList.appendChild(bookCard)
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
    console.error("❌ Error updating summary:", error)
  }
}

// Load history
// Load history
// Load history
async function loadHistory() {
    console.log("📜 Loading history...")

    if (!currentMember) {
        showError("กรุณาเข้าสู่ระบบเพื่อดูประวัติการยืมของคุณ")
        return
    }

    try {
        const response = await fetch(`${API_BASE}/history`)
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        history = await response.json()
        console.log("📜 History loaded:", history.length, "records")

        // กรองเฉพาะรายการของผู้ใช้ปัจจุบันโดยใช้ชื่อ borrower
        const userHistory = history.filter(
    record => record.borrower.trim().toLowerCase() === currentMember.name.trim().toLowerCase()
)
displayHistory(userHistory)
    } catch (error) {
        console.error("❌ Error loading history:", error)
        showError("ไม่สามารถโหลดประวัติได้: " + error.message)
    }
}



// Display history
function displayHistory(historyData) {
  const historyList = document.getElementById("historyList")
  const noHistory = document.getElementById("noHistory")

  if (!historyList) return

  if (historyData.length === 0) {
    historyList.style.display = "none"
    if (noHistory) noHistory.style.display = "block"
    return
  }

  if (noHistory) noHistory.style.display = "none"
  historyList.style.display = "grid"
  historyList.innerHTML = ""

  historyData.forEach((record) => {
    const historyCard = document.createElement("div")
    historyCard.className = "book-card" // Reusing book-card style for history items

    historyCard.innerHTML = `
            <div class="book-info">
                <h3 class="book-title">
                    <i class="fas fa-book"></i>
                    ${record.bookTitle}
                </h3>
                <p class="book-author"><strong>ผู้ยืม:</strong> ${record.borrower}</p>
                <p class="book-category"><strong>เบอร์โทร:</strong> ${record.borrowerPhone || "ไม่ระบุ"}</p>
                <div class="book-borrowed-info">
                    <p><i class="fas fa-calendar"></i> <strong>วันที่ยืม:</strong> ${formatDate(record.borrowedDate)}</p>
                    <p><i class="fas fa-calendar"></i> <strong>วันที่ต้องคืน:</strong> ${formatDate(record.dueDate)}</p>
                    ${record.returnedDate ? `<p><i class="fas fa-calendar-check"></i> <strong>วันที่คืน:</strong> ${formatDate(record.returnedDate)}</p>` : ""}
                </div>
                
                </div>
            </div>
        `

    historyList.appendChild(historyCard)
  })
}

// --- Auth Functions ---

// Initialize Auth state from localStorage
function initializeAuth() {
  const token = localStorage.getItem("token")
  const memberInfo = localStorage.getItem("current-member-info")
  const userInfoDiv = document.getElementById("userInfo")
  const userNameSpan = document.getElementById("userName")
  const userEmailSmall = document.getElementById("userEmail")
  const loginLinkBtn = document.getElementById("loginLink")
  const logoutBtn = document.getElementById("logoutBtn")

  if (token && memberInfo) {
    try {
      currentMember = JSON.parse(memberInfo)
      if (userInfoDiv && userNameSpan && userEmailSmall && loginLinkBtn && logoutBtn) {
        userNameSpan.textContent = currentMember.name
        userEmailSmall.textContent = currentMember.email
        userInfoDiv.style.display = "flex"
        loginLinkBtn.style.display = "none"
        logoutBtn.addEventListener("click", handleLogout)
      }
    } catch (error) {
      console.error("Error parsing member info from localStorage:", error)
      handleLogout() // Clear invalid data
    }
  } else {
    currentMember = null
    if (userInfoDiv && loginLinkBtn) {
      userInfoDiv.style.display = "none"
      loginLinkBtn.style.display = "block"
      loginLinkBtn.addEventListener("click", () => openAuthModal("login"))
    }
  }
}

// Setup Auth Modal (Login/Register)
function setupAuthModal() {
  const authModal = document.getElementById("authModal")
  const authModalCloseBtn = document.getElementById("authModalCloseBtn")
  const tabButtons = document.querySelectorAll(".tab-btn")
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")

  if (!authModal) return

  authModalCloseBtn.addEventListener("click", closeAuthModal)
  authModal.addEventListener("click", (e) => {
    if (e.target === authModal) {
      closeAuthModal()
    }
  })

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab
      switchAuthTab(tab)
    })
  })

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      handleLogin()
    })
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault()
      handleRegister()
    })
  }
}

function openAuthModal(tab = "login") {
  const authModal = document.getElementById("authModal")
  if (authModal) {
    authModal.classList.add("show")
    switchAuthTab(tab)
  }
}

function closeAuthModal() {
  const authModal = document.getElementById("authModal")
  if (authModal) {
    authModal.classList.remove("show")
    // Clear form fields
    document.getElementById("loginEmail").value = ""
    document.getElementById("loginPassword").value = ""
    document.getElementById("registerName").value = ""
    document.getElementById("registerEmail").value = ""
    document.getElementById("registerPhone").value = ""
    document.getElementById("registerPassword").value = ""
  }
}

function switchAuthTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active")
  })

  const selectedButton = document.querySelector(`.tab-btn[data-tab="${tab}"]`)
  const selectedContent = document.getElementById(`${tab}Tab`)

  if (selectedButton) selectedButton.classList.add("active")
  if (selectedContent) selectedContent.classList.add("active")
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim()
  const password = document.getElementById("loginPassword").value.trim()

  if (!email || !password) {
    showError("กรุณาใส่อีเมลและรหัสผ่าน")
    return
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ")
    }

    localStorage.setItem("token", data.token)
    localStorage.setItem("current-member-info", JSON.stringify(data.member))
    currentMember = data.member // Update global currentMember

    showSuccess(`ยินดีต้อนรับ ${data.member.name}!`)
    closeAuthModal()
    initializeAuth() // Update navbar
    loadBooks() // Refresh books in case borrow/return logic needs currentMember
  } catch (error) {
    console.error("Login error:", error)
    showError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ: " + error.message)
  }
}

async function handleRegister() {
  const name = document.getElementById("registerName").value.trim()
  const email = document.getElementById("registerEmail").value.trim()
  const phone = document.getElementById("registerPhone").value.trim()
  const password = document.getElementById("registerPassword").value.trim()

  if (!name || !email || !phone || !password) {
    showError("กรุณากรอกข้อมูลให้ครบถ้วน")
    return
  }

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, phone, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "สมัครสมาชิกไม่สำเร็จ")
    }

    showSuccess(`สมัครสมาชิกเรียบร้อย! ยินดีต้อนรับ ${data.member.name}`)
    // After successful registration, switch to login tab and pre-fill email
    document.getElementById("loginEmail").value = email
    switchAuthTab("login")
  } catch (error) {
    console.error("Register error:", error)
    showError("เกิดข้อผิดพลาดในการสมัครสมาชิก: " + error.message)
  }
}

function handleLogout() {
  currentMember = null
  localStorage.removeItem("token")
  localStorage.removeItem("current-member-info")
  showSuccess("ออกจากระบบเรียบร้อยแล้ว")
  initializeAuth() // Update navbar
  loadBooks() // Refresh books in case borrow/return logic needs currentMember
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initializing library system...")

  initializeAuth() // Initialize auth status first
  loadBooks()
  setupSearch()
  setupModals()
  setupAuthModal() // Setup the new auth modal

  // Auto test API on load
  setTimeout(() => {
    testAPI()
  }, 1000)
})
