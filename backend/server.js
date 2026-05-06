require("dotenv").config();
const multer = require("multer");
const jwt = require("jsonwebtoken");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt"); // ✅ FIX

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// ✅ USER MODEL
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  college: String,
  password: String
});
const User = mongoose.model("User", userSchema);

// ✅ BOOK MODEL (FIX)
const bookSchema = new mongoose.Schema({
  title: String,
  price: Number,
  seller: String,
  category: String,
  images: [String]
});
const Book = mongoose.model("Book", bookSchema);

// ✅ TEST
app.get("/", (req, res) => {
  res.send("API running ✅");
});

// 🔥 SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  try {
    let { name, email, college, password } = req.body;

    email = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists ❌" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, college, password: hashedPassword });
    await user.save();

    res.json({ message: "Signup successful ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// 🔐 LOGIN (IMPORTANT FIX ROUTE)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "User not found ❌" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ message: "Wrong password ❌" });

    const token = jwt.sign(
  { userId: user._id },
  "secretkey123", // baad me env me dalenge
  { expiresIn: "1d" }
);

res.json({
  message: "Login successful",
  token,
  name: user.name
});

  } catch (err) {
    res.status(500).json({ message: "Server error ❌" });
  }
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token ❌" });

  try {
    const decoded = jwt.verify(token, "secretkey123");
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token ❌" });
  }
}

// 📚 ADD BOOK
app.post("/add-book", upload.array("images"), async (req, res) => {
  try {
    console.log("BODY 👉", req.body);
    console.log("FILES 👉", req.files);

    const { title, price, seller, category } = req.body;

    const imageNames = req.files
      ? req.files.map(file => file.filename)
      : [];

    const newBook = new Book({
      title,
      price,
      seller,
      category,
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
app.get("/books", async (req, res) => {
  const books = await Book.find();
  res.json(books);
});

// 📊 STATS
app.get("/stats", async (req, res) => {
  const usersCount = await User.countDocuments();
  const booksCount = await Book.countDocuments();

  res.json({
    users: usersCount,
    books: booksCount,
    saved: booksCount * 200
  });
});

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log(err));

// SERVER
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});

app.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected data ✅",
    user: req.user
  });
});