const mongoose = require("mongoose")

const borrowHistorySchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    bookTitle: {
      type: String,
      required: true,
    },
    borrower: {
      type: String,
      required: true,
    },
    borrowerPhone: {
      type: String,
      default: null,
    },
    borrowedDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["borrowed", "returned"],
      default: "borrowed",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("BorrowHistory", borrowHistorySchema)
