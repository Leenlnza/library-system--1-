const mongoose = require("mongoose")

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    available: {
      type: Boolean,
      default: true,
    },
    borrowedBy: {
      type: String,
      default: null,
    },
    borrowerPhone: {
      type: String,
      default: null,
    },
    borrowedDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Book", bookSchema)
