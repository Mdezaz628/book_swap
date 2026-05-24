import express from "express";
import upload from "../middleware/multer.js";
import Book from "../models/Book.js";

const router = express.Router();

// 📚 ADD BOOK
router.post("/add-book", upload.array("images", 5), async (req, res) => {
  try {
    console.log("BODY 👉", req.body);
    console.log("FILES 👉", req.files);

    const { title, writer, price, seller, category, location } = req.body;

    if (!title || !writer || !price || !seller || !category) {
      return res.status(400).json({ message: "Writer name is required ❗" });
    }

    const imageNames = req.files ? req.files.map(file => file.path) : [];

    const newBook = new Book({
      title,
      writer,
      price,
      seller,
      category,
      location,
      images: imageNames
    });

    await newBook.save();

    res.json({ message: "Book added ✅" });

  } catch (err) {
    console.log("🔥 ERROR 👉", err);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// 📚 GET BOOKS
router.get("/books", async (req, res) => {
  const books = await Book.find();
  res.json(books);
});

export default router;
