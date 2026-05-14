require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt"); // ✅ FIX
const upload = require("./middleware/multer");
const Book = require("./models/Book");
const Message = require("./models/Message");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

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
app.post("/add-book", upload.array("images", 5), async (req, res) => {

  try {

    console.log("BODY 👉", req.body);
    console.log("FILES 👉", req.files);

    const { title, price, seller, category } = req.body;

    const newBook = new Book({
      title,
      price,
      seller,
      category,

      images: req.files
  ? req.files.map(file => file.path)
  : []
    });

    await newBook.save();

    res.json({
      message: "Book added ✅"
    });

  } catch (err) {

    console.log(err.message);

    res.status(500).json({
      message: "Server error ❌"
    });

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

app.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected data ✅",
    user: req.user
  });
});

// GET MESSAGES FOR A ROOM
app.get('/messages/:roomId', async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages', err);
    res.status(500).json({ message: 'Server error' });
  }
});

io.on("connection", (socket) => {

  console.log("User Connected ✅");

  // JOIN ROOM
  socket.on("joinRoom", (roomId) => {

    socket.join(roomId);

    console.log("Joined Room:", roomId);

  });

  // SEND MESSAGE
  socket.on("sendMessage", async (data) => {

    console.log(data);

    try {
      // determine receiver: use provided or infer from roomId
      let receiver = data.receiver;
      if (!receiver && data.roomId) {
        const parts = data.roomId.split("_");
        receiver = parts[0] === data.sender ? parts[1] : parts[0];
      }

      const newMessage = new Message({
        roomId: data.roomId,
        sender: data.sender,
        receiver,
        message: data.message,
        time: data.time || new Date().toLocaleTimeString()
      });

      await newMessage.save();

    } catch (err) {
      console.warn('Error while saving message', err);
    }

    io.to(data.roomId).emit("receiveMessage", data);

  });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
});
