console.log("🔥 SCRIPT FILE LOADED");
function clearPersistedFields() {
  ['chatInput', 'loginEmail', 'email'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = '';
  });
}

window.addEventListener('DOMContentLoaded', clearPersistedFields);
window.addEventListener('pageshow', clearPersistedFields);
window.addEventListener('load', () => setTimeout(clearPersistedFields, 50));

// 🔐 CHECK LOGIN (PAGE LOAD PE)
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const isLoginPage = window.location.pathname.endsWith("index.html");

  if (!token && !isLoginPage) {
    alert("Please login first ❗");
    window.location.href = "index.html"; // login page
  }
});

async function loadStats() {
  try {
    const res = await fetch("http://localhost:5000/stats");
    const data = await res.json();

    const booksCount = document.getElementById("booksCount");
    const usersCount = document.getElementById("usersCount");
    const savedAmount = document.getElementById("savedAmount");

    if (booksCount) booksCount.textContent = data.books;
    if (usersCount) usersCount.textContent = data.users;
    if (savedAmount) savedAmount.textContent = `₹${data.saved}`;
  } catch (err) {
    console.error("Failed to load stats", err);
  }
}
// 👉 1️⃣ Page load पर run
loadStats();

// 👉 2️⃣ हर 5 sec में auto update
setInterval(loadStats, 5000);

window.addEventListener('DOMContentLoaded', loadStats);
// 🔹 MODAL FUNCTIONS
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => {
    if (e.target === el) {
      el.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});

// 🔹 TAB SWITCH
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) =>
    b.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'signup'))
  );

  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('signupForm').style.display = tab === 'signup' ? 'block' : 'none';
}

// 🔹 CHAT SYSTEM (DEMO)
function sendMsg() {
  const inp = document.getElementById('chatInput');
  const val = inp.value.trim();
  if (!val) return;

  const body = document.getElementById('chatBody');

  const div = document.createElement('div');
  div.style.cssText = 'align-self:flex-end;text-align:right';
  div.innerHTML = `
    <div class="msg msg-sent">${val}</div>
    <div class="msg-time msg-sent">Just now</div>
  `;
  body.appendChild(div);

  inp.value = '';
  body.scrollTop = body.scrollHeight;

  setTimeout(() => {
    const replies = [
      "Got it! Let's meet at the library entrance? 📍",
      "Sure, I can arrange that. ✅",
      "Can you come tomorrow morning? 🕐",
      "Thanks! I'll generate the QR code now 📱"
    ];

    const rdiv = document.createElement('div');
    rdiv.innerHTML = `
      <div class="msg msg-recv">${replies[Math.floor(Math.random() * replies.length)]}</div>
      <div class="msg-time">Just now</div>
    `;
    body.appendChild(rdiv);

    body.scrollTop = body.scrollHeight;
  }, 900);
}

// 🔹 NAVIGATION
function showSection(s) {
  if (s === 'sell') openModal('sellModal');
  else document.getElementById('listings').scrollIntoView({ behavior: 'smooth' });
}

function openSellForm() {
  openModal('sellModal');
}

function goHome() {
  window.location.href = "dashboard.html"; // ya index.html
}
// addbook()
async function addBook() {
  const title = document.getElementById("isbnInput").value;
  const price = document.querySelector(".price-row input").value;
  const seller = localStorage.getItem("userName") || "User";
  const category = "General";
  const bookImages = document.getElementById("bookImages").files;

  if (!title || !price) {
    alert("Please fill in all required fields");
    return;
  }

  const formData = new FormData();

  formData.append("title", title);
  formData.append("price", price);
  formData.append("seller", seller);
  formData.append("category", category);

  // 📸 images
  for (let i = 0; i < bookImages.length; i++) {
    formData.append("images", bookImages[i]);
  }

  try {
    const res = await fetch("http://localhost:5000/add-book", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    console.log("📦 RESPONSE 👉", data);

    if (res.ok) {
      showThankPopup();

      document.getElementById("isbnInput").value = "";
      document.querySelector(".price-row input").value = "";
      document.getElementById("bookImages").value = "";
      document.getElementById("previewContainer").innerHTML = "";

      closeModal('sellModal');
      loadBooksHome();
    } else {
      alert(data.message || "Error adding book ❌");
    }

  } catch (err) {
  console.log("🔥 FRONTEND ERROR 👉", err);
  alert("Server error ❌");
}}


// 🔹 IMAGE PREVIEW
document.getElementById("bookImages")?.addEventListener("change", function() {
  const previewContainer = document.getElementById("previewContainer");
  previewContainer.innerHTML = "";

  Array.from(this.files).slice(0, 5).forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.createElement("div");
      preview.style.cssText = "position:relative; width:80px; height:80px; border-radius:8px; overflow:hidden;";
      preview.innerHTML = `
        <img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">
        <button onclick="this.parentElement.remove()" style="position:absolute; top:2px; right:2px; background:red; color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; font-size:12px; padding:0;">✕</button>
      `;
      previewContainer.appendChild(preview);
    };
    reader.readAsDataURL(file);
  });
});

// 🔹 SCROLL ANIMATION
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.stat-num').forEach(el => {
        el.style.animation = 'fadeIn .5s';
      });
    }
  });
});

document.querySelectorAll('.hero-stats').forEach(el => observer.observe(el));

// 🔹 BOOK LIST BUTTON
const listBookBtn = document.getElementById('listBookBtn');
if (listBookBtn) {
  listBookBtn.addEventListener('click', () => {
    addBook();
  });
}

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    console.log("Login button clicked");
  });
}
// 🔥 SIGNUP FUNCTION (CONNECTED TO BACKEND)
async function signupUser() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const college = document.getElementById("college").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
  name,
  email,
  college,
  password
})
    });

    const data = await res.json();

    // 🔥 SUCCESS CONDITION
    if (data.message === "Signup successful ✅") {
      alert("Signup successful 🎉");

      // 👉 Form clear
      document.getElementById("name").value = "";
      document.getElementById("email").value = "";
      document.getElementById("college").value = "";
      document.getElementById("password").value = "";

      // 👉 Signup form hide
      document.getElementById("signupForm").style.display = "none";

      // 👉 Login form show
      document.getElementById("loginForm").style.display = "block";
    } 
    else {
      alert(data.message); // user exists etc.
    }

  } catch (err) {
    console.error(err);
    alert("Signup failed ❌");
  }
}

// 🔥 LOGIN FUNCTION
async function loginUser() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.message.includes("Login successful"))  {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name); // ⭐ ADD THIS
      alert("Login success 🎉");
      window.location.href = "dashboard.html";
    } else {
      alert(data.message);
    }

  } catch (err) {
    console.log(err);
    alert("Server error ❌");
  }
}


const user = localStorage.getItem("userName");
if (user) {
  document.getElementById("premiumSection").classList.remove("blur");
}

async function loadBooksHome() {
  try {
    const res = await fetch("http://localhost:5000/api/books");
    const books = await res.json();

    const container = document.getElementById("booksContainer");

    if (!container) return;

    container.innerHTML = "";

    // 🔥 सिर्फ 4 books
    const limitedBooks = books.slice(0, 4);

    limitedBooks.forEach(book => {
  console.log("BOOK 👉", book); // ⭐ DEBUG

  container.innerHTML += `
    <div class="book-card">

      <img 
        src="${book.images && book.images.length > 0 
          ? `http://localhost:5000/uploads/${book.images[0]}`
          : 'https://via.placeholder.com/120'}"
        style="width:100%; height:120px; object-fit:cover; border-radius:8px;"
      />

      <div class="book-info">
        <div class="book-title">${book.title || "No title"}</div>
        <div class="book-author">${book.seller || "Unknown"}</div>
        <div class="book-price">₹${book.price || 0}</div>
      </div>

    </div>
  `;
});

  } catch (err) {
    console.log(err);
  }
}

window.addEventListener("DOMContentLoaded", loadBooksHome);
window.onload = loadBooksHome;

// Thank-you popup helpers
function showThankPopup() {
  const el = document.getElementById("thankPopup");
  if (!el) return;
  el.style.display = "flex";
}

function closeThankPopup() {
  const el = document.getElementById("thankPopup");
  if (!el) return;
  el.style.display = "none";
}
async function loadProfile() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("http://localhost:5000/profile", {
      headers: {
        Authorization: token
      }
    });

    const data = await res.json();
    console.log("PROFILE DATA 👉", data);

  } catch (err) {
    console.log("Profile error ❌", err);
  }
}

// 👇 page load pe call
loadProfile();