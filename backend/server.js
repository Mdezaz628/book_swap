require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt"); // ✅ FIX
const upload = require("./middleware/multer");
const Book = require("./models/Book");
const Message = require("./models/Message");
const DealVerification = require("./models/DealVerification");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const pendingDeals = new Map();

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

    const { title, price, seller, category, location } = req.body;

    const newBook = new Book({
      title,
      price,
      seller,
      category,
        location,

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

app.delete("/books/:id", async (req, res) => {
  try {
    const { seller } = req.query;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!seller || (book.seller || "").trim() !== String(seller).trim()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted ✅" });
  } catch (err) {
    console.error("Delete book error", err);
    res.status(500).json({ message: "Server error ❌" });
  }
});

app.put("/books/:id/price", async (req, res) => {
  try {
    const { price, seller } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!seller || (book.seller || "").trim() !== String(seller).trim()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const nextPrice = Number(price);
    if (!nextPrice || nextPrice <= 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    book.price = nextPrice;
    await book.save();
    res.json({ message: "Price updated ✅", book });
  } catch (err) {
    console.error("Update price error", err);
    res.status(500).json({ message: "Server error ❌" });
  }
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

app.get('/inbox/:user', async (req, res) => {
  try {
    const user = req.params.user;
    const messages = await Message.find({
      $or: [
        { sender: user },
        { receiver: user }
      ]
    }).sort({ createdAt: -1 });

    const inboxMap = {};

    messages.forEach((msg) => {
      const otherUser = msg.sender === user ? msg.receiver : msg.sender;

      if (!inboxMap[otherUser]) {
        inboxMap[otherUser] = {
          user: otherUser,
          lastMessage: msg.message,
          unread: 0
        };
      }

      if (msg.receiver === user && !msg.isRead) {
        inboxMap[otherUser].unread++;
      }
    });

    res.json(Object.values(inboxMap));
  } catch (err) {
    console.error('Error fetching inbox', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/mark-read', async (req, res) => {
  try {
    const { sender, receiver } = req.body;

    await Message.updateMany(
      {
        sender,
        receiver,
        isRead: false
      },
      {
        isRead: true
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking messages read', err);
    res.status(500).json({ success: false });
  }
});

app.get('/deals/:roomId/latest', async (req, res) => {
  try {
    const deal = await DealVerification.findOne({ roomId: req.params.roomId }).sort({ createdAt: -1 });
    if (!deal) {
      return res.json({ deal: null });
    }

    res.json({ deal });
  } catch (err) {
    console.error('Error fetching latest deal', err);
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

  // JOIN USER
  socket.on("joinUser", (username) => {

    socket.join(username);

    console.log(
      "User Room Joined:",
      username
    );

  });

  // SEND MESSAGE
  socket.on("sendMessage", async (data) => {

    console.log(data);

    try {
      const newMessage = new Message({
        ...data,
        isRead: false
      });
      await newMessage.save();
    } catch (err) {
      console.warn('Error while saving message', err);
    }

    io.to(data.receiver).emit("receiveMessage", data);

    io.to(data.roomId).emit("receiveMessage", data);

  });

  socket.on("confirmDeal", async (data) => {
    try {
      const roomId = String(data.roomId || "").trim();
      const sender = String(data.sender || "").trim();
      const receiver = String(data.receiver || "").trim();
      const price = Number(data.price);

      if (!roomId || !sender || !receiver || !price || price <= 0) {
        socket.emit("dealError", { message: "Invalid deal data" });
        return;
      }

      const sortedParticipants = [sender, receiver].sort();
      const dealKey = roomId;
      const existing = pendingDeals.get(dealKey) || {
        roomId,
        sender: sortedParticipants[0],
        receiver: sortedParticipants[1],
        price,
        confirmations: {},
        createdAt: new Date().toISOString()
      };

      if (Number(existing.price) !== price) {
        existing.price = price;
        existing.confirmations = {};
      }

      existing.confirmations[sender] = true;
      pendingDeals.set(dealKey, existing);

      io.to(roomId).emit("dealStatus", {
        roomId,
        price,
        confirmations: Object.keys(existing.confirmations),
        waitingFor: sortedParticipants.filter((person) => !existing.confirmations[person])
      });

      const bothConfirmed = sortedParticipants.every((person) => existing.confirmations[person]);

      if (bothConfirmed) {
        const now = new Date();
        const payload = {
          type: "SWAPTOME_VERIFICATION",
          buyer: existing.sender,
          seller: existing.receiver,
          price,
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          roomId,
          code: `BS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          confirmedBy: sender,
          confirmedAt: now.toISOString()
        };

        try {
          await DealVerification.create({
            ...payload,
            confirmations: sortedParticipants
          });
        } catch (saveErr) {
          console.error('Error saving deal verification', saveErr);
        }

        pendingDeals.delete(dealKey);
        io.to(roomId).emit("dealConfirmed", payload);
      }
    } catch (err) {
      console.error("Deal confirmation error", err);
      socket.emit("dealError", { message: "Could not confirm deal" });
    }
  });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
});
