// ===================================================
// SWAPTOME MOBILE APP - LOGIC
// Connects directly to live Render backend
// ===================================================

const API_BASE = 'https://swaptome-api.onrender.com';

// State
let allBooks = [];
let filteredBooks = [];
let selectedCategory = 'All';
let currentUser = null;

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initNavigation();
  initCategories();
  initSearch();
  initModals();
  fetchBooks();
});

// ===================================================
// 1. AUTHENTICATION & LOCAL STORAGE
// ===================================================
function initAuth() {
  const savedUser = localStorage.getItem('swaptome_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (_) {
      currentUser = null;
    }
  }
  updateProfileView();
  updateMessagesView();

  document.getElementById('authBtn').addEventListener('click', () => {
    if (currentUser) {
      switchTab('tabProfile');
    } else {
      openAuthModal();
    }
  });

  // Login Form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginSubmitBtn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        currentUser = {
          name: data.name || email.split('@')[0],
          email: data.email || email,
          token: data.token,
          role: data.role || 'user',
        };
        localStorage.setItem('swaptome_user', JSON.stringify(currentUser));
        localStorage.setItem('token', data.token);
        closeAuthModal();
        updateProfileView();
        updateMessagesView();
        showToast('Logged in successfully! 👋');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      alert('Network error during login. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log In';
    }
  });

  // Signup Form
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const college = document.getElementById('signupCollege').value.trim();
    const location = document.getElementById('signupLocation').value.trim();
    const password = document.getElementById('signupPassword').value;
    const submitBtn = document.getElementById('signupSubmitBtn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, college, location, password }),
      });
      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Account created! Please check your email for the verification link.');
        switchAuthTab('login');
        document.getElementById('loginEmail').value = email;
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (err) {
      alert('Network error during signup. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Free Account';
    }
  });
}

function logout() {
  localStorage.removeItem('swaptome_user');
  localStorage.removeItem('token');
  currentUser = null;
  updateProfileView();
  updateMessagesView();
  switchTab('tabHome');
  showToast('Logged out');
}

// ===================================================
// 2. NAVIGATION (BOTTOM TABS)
// ===================================================
function initNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-view').forEach((view) => view.classList.remove('active'));
  document.querySelectorAll('.bottom-nav .nav-item').forEach((item) => item.classList.remove('active'));

  const targetView = document.getElementById(tabId);
  const targetNav = document.querySelector(`.bottom-nav .nav-item[data-tab="${tabId}"]`);

  if (targetView) targetView.classList.add('active');
  if (targetNav) targetNav.classList.add('active');

  // Hide FAB on messages/profile
  const fab = document.getElementById('fabSell');
  if (tabId === 'tabHome') {
    fab.classList.remove('hidden');
  } else {
    fab.classList.add('hidden');
  }
}

// ===================================================
// 3. FETCH & RENDER BOOKS
// ===================================================
async function fetchBooks() {
  const grid = document.getElementById('booksGrid');
  try {
    const res = await fetch(`${API_BASE}/api/books`);
    if (!res.ok) throw new Error('Failed to load books');

    allBooks = await res.json();
    applyFilters();
  } catch (err) {
    grid.innerHTML = `
      <div class="loader-wrap">
        <p style="color:var(--danger)">Could not load listings from server.</p>
        <button class="chip" style="margin-top:10px" onclick="fetchBooks()">Retry</button>
      </div>
    `;
  }
}

function applyFilters() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();

  filteredBooks = allBooks.filter((book) => {
    const matchCat =
      selectedCategory === 'All' ||
      (book.category || '').toLowerCase() === selectedCategory.toLowerCase();

    const title = (book.title || book.name || '').toLowerCase();
    const author = (book.author || book.writer || '').toLowerCase();
    const loc = (book.location || '').toLowerCase();

    const matchQuery =
      !query || title.includes(query) || author.includes(query) || loc.includes(query);

    return matchCat && matchQuery;
  });

  renderBooks(filteredBooks);
}

function renderBooks(books) {
  const grid = document.getElementById('booksGrid');
  const badge = document.getElementById('booksCountBadge');
  badge.textContent = `${books.length} books`;

  if (books.length === 0) {
    grid.innerHTML = `
      <div class="loader-wrap">
        <p style="font-size:32px;margin-bottom:8px">🔍</p>
        <p><strong>No books found</strong></p>
        <p style="font-size:12px;margin-top:4px">Try another search or category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = books
    .map((book) => {
      const title = book.title || book.name || 'Untitled Book';
      const author = book.author || book.writer || 'Unknown Author';
      const price = book.price !== undefined ? book.price : 0;
      const category = book.category || 'General';
      const location = (book.location || 'Campus').split(',')[0];
      const imageUrl =
        Array.isArray(book.images) && book.images.length > 0
          ? book.images[0]
          : book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';

      return `
      <div class="book-card" onclick="openBookModal('${book._id || book.id}')">
        <div class="book-thumb-wrap">
          <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'">
          <span class="book-category-tag">${category}</span>
        </div>
        <div class="book-info">
          <div>
            <h4>${escapeHtml(title)}</h4>
            <div class="book-author">${escapeHtml(author)}</div>
          </div>
          <div class="book-card-bottom">
            <span class="book-price">₹${price}</span>
            <span class="book-location">📍 ${escapeHtml(location)}</span>
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

// ===================================================
// 4. CATEGORIES & SEARCH
// ===================================================
function initCategories() {
  const chips = document.querySelectorAll('#categoryChips .chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      selectedCategory = chip.dataset.category;
      document.getElementById('currentCategoryTitle').textContent =
        selectedCategory === 'All' ? 'Available Textbooks' : `${selectedCategory} Books`;
      applyFilters();
    });
  });
}

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');

  searchInput.addEventListener('input', (e) => {
    if (e.target.value.length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
    applyFilters();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    applyFilters();
  });
}

// ===================================================
// 5. BOOK DETAIL MODAL
// ===================================================
function openBookModal(bookId) {
  const book = allBooks.find((b) => (b._id || b.id) === bookId);
  if (!book) return;

  const title = book.title || book.name || 'Untitled Book';
  const author = book.author || book.writer || 'Unknown Author';
  const price = book.price !== undefined ? book.price : 0;
  const category = book.category || 'General';
  const location = book.location || 'Campus';
  const seller = book.seller || 'Verified Student';
  const images = Array.isArray(book.images) && book.images.length > 0 ? book.images : [book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'];

  const container = document.getElementById('bookModalBody');
  container.innerHTML = `
    <div style="width:100%;aspect-ratio:4/3;border-radius:14px;overflow:hidden;background:#eee;margin-bottom:16px;">
      <img src="${images[0]}" alt="${title}" style="width:100%;height:100%;object-fit:contain;display:block;">
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <span style="background:var(--primary-light);color:var(--primary);font-size:11px;font-weight:800;padding:4px 10px;border-radius:8px;text-transform:uppercase;">${category}</span>
      <span style="font-size:24px;font-weight:900;color:var(--primary)">₹${price}</span>
    </div>
    <h2 style="font-size:20px;font-weight:800;margin-bottom:4px;line-height:1.25;">${escapeHtml(title)}</h2>
    <p style="color:var(--text-muted);font-size:14px;font-style:italic;margin-bottom:18px;">by ${escapeHtml(author)}</p>
    
    <div style="background:#fff;border:1px solid var(--border-color);border-radius:14px;padding:14px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
      <div style="width:44px;height:44px;border-radius:50%;background:rgba(232,130,12,.15);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--primary);font-size:18px;">
        ${seller.charAt(0).toUpperCase()}
      </div>
      <div>
        <div style="font-weight:800;font-size:14px;">${escapeHtml(seller)}</div>
        <div style="font-size:12px;color:var(--text-sub);">📍 ${escapeHtml(location)}</div>
      </div>
    </div>

    <button class="btn-primary-block" onclick="startChatWithSeller('${escapeHtml(seller)}', '${escapeHtml(title)}')">
      💬 Chat with Seller to Buy or Swap
    </button>
  `;

  document.getElementById('bookModal').classList.add('open');
}

function closeBookModal() {
  document.getElementById('bookModal').classList.remove('open');
}

function startChatWithSeller(sellerName, bookTitle) {
  closeBookModal();
  if (!currentUser) {
    openAuthModal();
    return;
  }
  switchTab('tabMessages');
  renderChatRoom(sellerName, bookTitle);
}

// ===================================================
// 6. ADD / SELL BOOK MODAL & SUBMIT
// ===================================================
function initModals() {
  document.getElementById('fabSell').addEventListener('click', () => {
    if (!currentUser) {
      openAuthModal();
    } else {
      openSellModal();
    }
  });

  // Images preview
  const imgInput = document.getElementById('bookImagesInput');
  imgInput.addEventListener('change', () => {
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
    Array.from(imgInput.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'preview-thumb';
        container.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  // Add Book Form Submit
  document.getElementById('addBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal();
      return;
    }

    const title = document.getElementById('bookTitleInput').value.trim();
    const author = document.getElementById('bookAuthorInput').value.trim();
    const price = document.getElementById('bookPriceInput').value.trim();
    const category = document.getElementById('bookCategoryInput').value;
    const location = document.getElementById('bookLocationInput').value.trim() || 'Campus';
    const images = document.getElementById('bookImagesInput').files;
    const submitBtn = document.getElementById('submitBookBtn');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('writer', author);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('location', location);
    formData.append('seller', currentUser.name);
    formData.append('uploaderEmail', currentUser.email);

    for (let i = 0; i < images.length; i++) {
      formData.append('images', images[i]);
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading listing...';

    try {
      const res = await fetch(`${API_BASE}/add-book`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        showToast('Book posted successfully! 🎉');
        closeSellModal();
        document.getElementById('addBookForm').reset();
        document.getElementById('imagePreviewContainer').innerHTML = '';
        fetchBooks();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to list book');
      }
    } catch (err) {
      alert('Error uploading book listing');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post Listing';
    }
  });
}

function openSellModal() {
  document.getElementById('sellModal').classList.add('open');
}

function closeSellModal() {
  document.getElementById('sellModal').classList.remove('open');
}

// ===================================================
// 7. AUTH MODAL
// ===================================================
function openAuthModal() {
  document.getElementById('authModal').classList.add('open');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
}

function switchAuthTab(tab) {
  if (tab === 'login') {
    document.getElementById('authTabLogin').classList.add('active');
    document.getElementById('authTabSignup').classList.remove('active');
    document.getElementById('authLoginView').classList.remove('hidden');
    document.getElementById('authSignupView').classList.add('hidden');
  } else {
    document.getElementById('authTabSignup').classList.add('active');
    document.getElementById('authTabLogin').classList.remove('active');
    document.getElementById('authSignupView').classList.remove('hidden');
    document.getElementById('authLoginView').classList.add('hidden');
  }
}

async function handleForgotPassword() {
  const email = prompt('Enter your registered email address for password reset:');
  if (!email || !email.trim()) return;

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    alert(data.message || 'Password reset link sent to your email.');
  } catch (_) {
    alert('Failed to request password reset.');
  }
}

// ===================================================
// 8. MESSAGES & PROFILE VIEWS
// ===================================================
function updateMessagesView() {
  const container = document.getElementById('messagesContent');
  if (!currentUser) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <p style="font-size:42px;margin-bottom:12px;">💬</p>
        <h3 style="font-size:18px;font-weight:800;margin-bottom:6px;">Log in to view messages</h3>
        <p style="font-size:13px;color:var(--text-sub);margin-bottom:20px;">Chat with buyers and sellers directly inside the app.</p>
        <button class="btn-primary-block" style="max-width:200px;margin:0 auto;" onclick="openAuthModal()">Log In Now</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="text-align:center;padding:50px 20px;color:var(--text-sub);">
        <p style="font-size:38px;margin-bottom:10px;">📭</p>
        <h4 style="font-size:16px;font-weight:700;color:var(--text-main);margin-bottom:4px;">No active conversations yet</h4>
        <p style="font-size:13px;">Tap "Chat with Seller" on any book listing to start a conversation.</p>
      </div>
    `;
  }
}

function renderChatRoom(sellerName, bookTitle) {
  const container = document.getElementById('messagesContent');
  container.innerHTML = `
    <div style="background:#fff;border:1px solid var(--border-color);border-radius:14px;padding:14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-weight:800;font-size:15px;">Conversation with ${escapeHtml(sellerName)}</div>
        ${bookTitle ? `<div style="font-size:12px;color:var(--text-sub);">Regarding: ${escapeHtml(bookTitle)}</div>` : ''}
      </div>
      <button class="btn-link" onclick="updateMessagesView()">Close</button>
    </div>
    <div id="chatBox" style="background:#fff;border:1px solid var(--border-color);border-radius:14px;height:320px;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
      <div style="align-self:flex-start;background:#f3efe6;padding:10px 14px;border-radius:14px;font-size:13.5px;max-width:80%;">
        Hi! I am interested in your book "${escapeHtml(bookTitle || '')}". Is it still available?
      </div>
    </div>
    <div style="display:flex;gap:8px;">
      <input type="text" id="chatMessageInput" placeholder="Type a message..." style="flex:1;padding:12px 14px;border:1px solid var(--border-color);border-radius:12px;outline:none;font-family:inherit;">
      <button class="btn-primary-block" style="width:auto;margin:0;padding:12px 18px;" onclick="sendChatMessage('${escapeHtml(sellerName)}')">Send</button>
    </div>
  `;
}

function sendChatMessage(receiver) {
  const input = document.getElementById('chatMessageInput');
  const text = input.value.trim();
  if (!text) return;

  const chatBox = document.getElementById('chatBox');
  const msgEl = document.createElement('div');
  msgEl.style.cssText = 'align-self:flex-end;background:var(--primary);color:#fff;padding:10px 14px;border-radius:14px;font-size:13.5px;max-width:80%;';
  msgEl.textContent = text;
  chatBox.appendChild(msgEl);
  chatBox.scrollTop = chatBox.scrollHeight;
  input.value = '';

  // API call
  fetch(`${API_BASE}/send-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: currentUser.name,
      receiver: receiver,
      message: text,
    }),
  }).catch(() => {});
}

function updateProfileView() {
  const container = document.getElementById('profileContent');
  if (!currentUser) {
    container.innerHTML = `
      <div style="text-align:center;padding:50px 20px;">
        <p style="font-size:42px;margin-bottom:12px;">👤</p>
        <h3 style="font-size:18px;font-weight:800;margin-bottom:6px;">Join the Campus Marketplace</h3>
        <p style="font-size:13px;color:var(--text-sub);margin-bottom:20px;">Log in to list books, verify your student ID, and manage deals.</p>
        <button class="btn-primary-block" style="max-width:200px;margin:0 auto;" onclick="openAuthModal()">Log In / Sign Up</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="background:#fff;border:1px solid var(--border-color);border-radius:18px;padding:20px;display:flex;align-items:center;gap:14px;margin-bottom:20px;">
        <div style="width:54px;height:54px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">
          ${currentUser.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style="font-size:17px;font-weight:800;">${escapeHtml(currentUser.name)}</div>
          <div style="font-size:12.5px;color:var(--text-sub);">${escapeHtml(currentUser.email)}</div>
        </div>
      </div>

      <div style="background:#fff;border:1px solid var(--border-color);border-radius:16px;overflow:hidden;margin-bottom:20px;">
        <div style="padding:14px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="switchTab('tabHome')">
          <span style="font-size:14px;font-weight:700;">📚 Browse Marketplace</span>
          <span style="color:var(--text-sub)">›</span>
        </div>
        <div style="padding:14px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="openSellModal()">
          <span style="font-size:14px;font-weight:700;">➕ Sell / Swap a Book</span>
          <span style="color:var(--text-sub)">›</span>
        </div>
        <div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="switchTab('tabMessages')">
          <span style="font-size:14px;font-weight:700;">💬 Messages &amp; Inquiries</span>
          <span style="color:var(--text-sub)">›</span>
        </div>
      </div>

      <button style="width:100%;padding:14px;background:#fee2e2;color:var(--danger);border:1px solid #fecaca;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;" onclick="logout()">
        Log Out
      </button>
    `;
  }
}

// ===================================================
// UTILS
// ===================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(text) {
  const toast = document.createElement('div');
  toast.style.cssText =
    'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:10px 18px;border-radius:24px;font-size:13px;font-weight:700;z-index:999;box-shadow:0 8px 24px rgba(0,0,0,0.25);animation:fadeIn .2s ease-out;';
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}
