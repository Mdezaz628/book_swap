let imageFile;
console.log("🔥 SCRIPT FILE LOADED");
function clearPersistedFields() {
  ['loginEmail','loginPassword','signupEmail','signupName','signupCollege','signupLocation','signupPassword','name','email','college','location','password'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = '';
  });
}

function clearFields() {
  clearPersistedFields();
}

function getFirstExistingInputValue(ids) {
  for (const id of ids) {
    const input = document.getElementById(id);
    if (input) return input.value;
  }

  return "";
}

function clearFirstExistingInputs(ids) {
  ids.forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
}

function getProfileStorageIdentity() {
  const email = (localStorage.getItem("email") || "").trim().toLowerCase();
  const userName = (localStorage.getItem("userName") || "").trim().toLowerCase();

  return email || userName || "guest";
}

function getProfileImageStorageKey(identity) {
  return `profileImage:${String(identity || getProfileStorageIdentity()).replace(/[^a-z0-9_-]+/gi, "_")}`;
}

function applyProfilePhotoToElement(element, fallbackInitial) {
  if (!element) return;

  const scopedKey = getProfileImageStorageKey();
  const savedImage = localStorage.getItem(scopedKey);

  if (savedImage) {
    element.style.backgroundImage = `url('${savedImage}')`;
    element.style.backgroundSize = "cover";
    element.style.backgroundPosition = "center";
    element.style.backgroundRepeat = "no-repeat";
    element.textContent = "";
    element.classList.add("has-profile-photo");
    return;
  }

  element.style.backgroundImage = "";
  element.style.backgroundSize = "";
  element.style.backgroundPosition = "";
  element.style.backgroundRepeat = "";
  element.classList.remove("has-profile-photo");
  if (fallbackInitial !== undefined) {
    element.textContent = fallbackInitial;
  }
}

function showAutoPopup(message, durationMs = 1000) {
  let popup = document.getElementById("autoPopupToast");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "autoPopupToast";
    popup.style.position = "fixed";
    popup.style.left = "50%";
    popup.style.top = "24px";
    popup.style.transform = "translateX(-50%)";
    popup.style.zIndex = "99999";
    popup.style.padding = "12px 18px";
    popup.style.borderRadius = "999px";
    popup.style.background = "rgba(15, 23, 42, 0.96)";
    popup.style.color = "#fff";
    popup.style.boxShadow = "0 16px 36px rgba(0,0,0,.28)";
    popup.style.fontWeight = "700";
    popup.style.fontSize = "14px";
    popup.style.pointerEvents = "none";
    popup.style.opacity = "0";
    popup.style.transition = "opacity .2s ease, transform .2s ease";
    document.body.appendChild(popup);
  }

  popup.textContent = message;
  popup.style.opacity = "1";
  popup.style.transform = "translateX(-50%) translateY(0)";

  window.clearTimeout(window.__autoPopupTimer);
  window.__autoPopupTimer = window.setTimeout(() => {
    popup.style.opacity = "0";
    popup.style.transform = "translateX(-50%) translateY(-6px)";
  }, durationMs);
}

window.addEventListener('DOMContentLoaded', clearPersistedFields);
window.addEventListener('pageshow', clearPersistedFields);
window.addEventListener('load', () => setTimeout(clearPersistedFields, 50));

function initDashboardWelcome() {
  const welcomeName = document.getElementById("welcomeName");
  const welcomeAvatar = document.getElementById("welcomeAvatar");
  const userName = localStorage.getItem("userName");

  if (welcomeName && userName) {
    welcomeName.textContent = userName;
  }

  if (welcomeAvatar && userName) {
    applyProfilePhotoToElement(welcomeAvatar, userName.charAt(0).toUpperCase());
  }
}

window.addEventListener('pageshow', () => {
  initDashboardWelcome();
});

// 🔥 MENU TOGGLE

function toggleMenu() {

  const menu =
    document.getElementById(
      "profileMenu"
    );

  menu.classList.toggle("show");

}

// 🔥 PROFILE

function openProfile() {

  alert("Profile Open");

}

// 🔥 LOGOUT

function logoutUser() {

  localStorage.clear();

  window.location.href =
    "index.html";

}

// 🔥 THEME

function changeTheme(theme) {

  console.log("THEME:", theme);

  // remove old
  document.body.classList.remove(
    "light-theme",
    "dark-theme",
    "blue-theme"
  );

  // add new
  document.body.classList.add(
    theme + "-theme"
  );

  // save
  localStorage.setItem(
    "selectedTheme",
    theme
  );

}

// 🔥 LOAD SAVED THEME

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const savedTheme =
      localStorage.getItem(
        "selectedTheme"
      ) || "dark";

    changeTheme(savedTheme);

    const select =
      document.getElementById(
        "themeSelect"
      );

    if (select) {

      select.value =
        savedTheme;

    }

  }
);

function logoutUser(){

  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  window.location.href = "index.html";

}

/* 🔥 LOAD SAVED THEME */

window.onload = () => {

  const savedTheme =
    localStorage.getItem(
      "selectedTheme"
    ) || "dark";

  changeTheme(savedTheme);

  const themeSelect = document.getElementById(
    "themeSelect"
  );
  if(themeSelect){
    themeSelect.value = savedTheme;
  }

};

// 🔐 CHECK LOGIN (PAGE LOAD)
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const isLoginPage = window.location.pathname.endsWith("index.html");
  const isChatPage = window.location.pathname.endsWith("chat.html");

  if (!token && !isLoginPage) {
    if (isChatPage) {
      // Don't redirect away immediately from chat — show a prompt that explains login is required
      try { showChatLoginPrompt(); } catch (e) { window.location.href = "index.html"; }
      return;
    }

    // For other pages, redirect user to login
    try { sessionStorage.setItem('postLoginRedirect', window.location.pathname); } catch (e) {}
    window.location.href = "index.html"; // login page
    return;
  }

  initDashboardWelcome();
  initUnreadBadge();
  initSocket();
  loadBooksHome();

  // If we're on the chat page, clear unread counters and mark messages read on server
  if (document.body && document.body.classList.contains('chat-page')) {
    const currentUser = localStorage.getItem('userName');
    const selectedSeller = localStorage.getItem('chatSeller') || localStorage.getItem('chatWith');

    try { localStorage.setItem('unreadCount', 0); } catch (e) { /* ignore */ }
    try { updateBadge(0); } catch (e) { /* ignore if not available yet */ }

    // notify server to mark messages as read for this convo
    if (currentUser && selectedSeller) {
      fetch("http://localhost:5000/mark-read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: selectedSeller, receiver: currentUser })
      }).catch(() => {});
    }

    // refresh the inbox UI if present so per-user unread badges disappear
    if (document.getElementById('chatList')) {
      setTimeout(() => { try { loadInbox(); } catch (e) {} }, 200);
    }
  }
});

// Show a friendly prompt inside chat page when user is not logged in
function showChatLoginPrompt() {
  const chatBox = document.getElementById('chatBox');
  const inputRow = document.querySelector('.chat-input-row');
  if (!chatBox) {
    // fallback: redirect to login
    try { sessionStorage.setItem('postLoginRedirect', 'chat.html'); } catch (e) {}
    window.location.href = 'index.html';
    return;
  }

  chatBox.innerHTML = `
    <div class="no-chats">
      <div class="no-chats-avatar">🔒</div>
      <div class="no-chats-text">
        <h3>Please log in to chat</h3>
        <p>Sign in to message sellers and view conversations.</p>
        <div style="margin-top:12px">
          <button class="no-chats-cta" id="goLoginBtn">Log in</button>
          <button class="no-chats-cta" id="goBrowseBtn">Browse books</button>
        </div>
      </div>
    </div>
  `;

  if (inputRow) inputRow.style.display = 'none';
  const header = document.querySelector('.chat-header');
  if (header) header.classList.add('hidden');

  document.getElementById('goLoginBtn').addEventListener('click', () => {
    try { sessionStorage.setItem('postLoginRedirect', window.location.pathname); } catch (e) {}
    window.location.href = 'index.html';
  });

  document.getElementById('goBrowseBtn').addEventListener('click', () => {
    window.location.href = 'all-books.html';
  });
}

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

/* HERO SLIDER */
let currentSlide = 0;

function showSlide(index) {
  const slides = document.querySelectorAll('.slide');
  if (!slides || slides.length === 0) return;
  slides.forEach(s => s.classList.remove('active'));
  slides[index].classList.add('active');
}

function nextSlide() {
  const slides = document.querySelectorAll('.slide');
  if (!slides || slides.length === 0) return;
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

function prevSlide() {
  const slides = document.querySelectorAll('.slide');
  if (!slides || slides.length === 0) return;
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(currentSlide);
}

document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  if (slides && slides.length) {
    showSlide(0);
    setInterval(nextSlide, 3000);
    document.querySelectorAll('.slide-btn.next').forEach(b => b.addEventListener('click', nextSlide));
    document.querySelectorAll('.slide-btn.prev').forEach(b => b.addEventListener('click', prevSlide));
  }
});
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
function showSection(section){

  if(section === "browse"){

    document
      .getElementById("listings")
      ?.scrollIntoView({
        behavior:"smooth"
      });

  }

  if(section === "sell"){

    openModal("sellModal");

  }
}

function openSellForm() {
  openModal('sellModal');
}

function goBack() {
  window.location.href = "dashboard.html";
}

function openInbox() {
  const inbox = document.getElementById("inboxSection");

  if (!inbox) return;

  inbox.style.display = "block";

  inbox.scrollIntoView({
    behavior: "smooth"
  });

  loadInbox();
}

function closeInbox(){
  const inbox = document.getElementById("inboxSection");

  if (inbox) {
    inbox.style.display = "none";
  }
}

function getArchivedChatsKey() {
  const currentUser = (localStorage.getItem("userName") || "").trim();
  return currentUser ? `archivedChats_${currentUser}` : "archivedChats_default";
}

function getChatViewKey() {
  const currentUser = (localStorage.getItem("userName") || "").trim();
  return currentUser ? `chatView_${currentUser}` : "chatView_default";
}

function getArchivedChats() {
  try {
    return JSON.parse(localStorage.getItem(getArchivedChatsKey()) || "[]");
  } catch (e) {
    return [];
  }
}

function setArchivedChats(chats) {
  localStorage.setItem(getArchivedChatsKey(), JSON.stringify(chats));
}

function getChatView() {
  return localStorage.getItem(getChatViewKey()) || "active";
}

function setChatView(view) {
  localStorage.setItem(getChatViewKey(), view === "archived" ? "archived" : "active");
  loadInbox().catch(() => {});
}

function isChatArchived(name) {
  return getArchivedChats().includes(name);
}

function archiveChat(name) {
  const archived = getArchivedChats();
  const trimmedName = String(name || "").trim();
  if (!trimmedName || archived.includes(trimmedName)) return;
  archived.unshift(trimmedName);
  setArchivedChats(archived);
  localStorage.setItem(getChatViewKey(), "active");
  loadInbox().catch(() => {});
}

function unarchiveChat(name) {
  const trimmedName = String(name || "").trim();
  const archived = getArchivedChats().filter((item) => item !== trimmedName);
  setArchivedChats(archived);
  loadInbox().catch(() => {});
}

function toggleChatMenu(userName, event) {
  if (event) event.stopPropagation();

  const menu = document.getElementById(`chatMenu-${userName}`);
  if (!menu) return;

  document.querySelectorAll('.chat-user-menu.show').forEach((openMenu) => {
    if (openMenu !== menu) openMenu.classList.remove('show');
  });

  menu.classList.toggle('show');
}

document.addEventListener('click', () => {
  document.querySelectorAll('.chat-user-menu.show').forEach((openMenu) => openMenu.classList.remove('show'));
});

function renderChatRow(userName, lastMessage, unreadCount, isActiveChat, isArchived) {
  const archivedLabel = isArchived ? '<span class="chat-archived-pill">Archived</span>' : '';
  const actionLabel = isArchived ? 'Show' : 'Archive';
  const actionHandler = isArchived
    ? `event.stopPropagation(); unarchiveChat('${userName}')`
    : `event.stopPropagation(); archiveChat('${userName}')`;

  return `
    <div class="chat-user ${isActiveChat ? 'active' : ''} ${isArchived ? 'archived' : ''}" onclick="openChat('${userName}')">
      <button class="chat-user-menu-btn" onclick="toggleChatMenu('${userName}', event)" aria-label="Chat options">⋮</button>
      <div class="chat-user-main">
        <h3>${userName}</h3>
        <p>${lastMessage}</p>
        ${archivedLabel}
      </div>
      ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ""}
      <div class="chat-user-menu" id="chatMenu-${userName}">
        <button onclick="${actionHandler}" class="chat-user-menu-item">${actionLabel}</button>
      </div>
    </div>
  `;
}

function renderChatTabs(activeCount, archivedCount) {
  const currentView = getChatView();
  return `
    <div class="chat-tabs-row">
      <button class="chat-tab-btn ${currentView === 'active' ? 'active' : ''}" onclick="setChatView('active')">
        Chats <span class="chat-tab-count">${activeCount}</span>
      </button>
      <button class="chat-tab-btn ${currentView === 'archived' ? 'active' : ''}" onclick="setChatView('archived')">
        Archive <span class="chat-tab-count">${archivedCount}</span>
      </button>
    </div>
  `;
}

async function loadInbox() {
  const currentUser = localStorage.getItem("userName");
  const currentSeller = new URLSearchParams(window.location.search).get("seller");

  if (!currentUser) {
    openModal("authModal");
    return;
  }

  const res = await fetch(`http://localhost:5000/inbox/${currentUser}`);
  if (!res.ok) {
    console.warn('Inbox API returned', res.status);
    // show server error in main chat area
    try { const chatBox = document.getElementById('chatBox'); if (chatBox) { chatBox.innerHTML = '<div class="no-chats"><div class="no-chats-text"><h3>Server unreachable</h3><p>Could not load inbox. Try again later.</p></div></div>'; } } catch (e) {}
    return;
  }
  const users = await res.json();
  const chatList = document.getElementById("chatList");

  if (!chatList) return;

  chatList.innerHTML = "";

  if (!users || users.length === 0) {
    if (currentSeller) {
      chatList.innerHTML = `
        <div
          class="chat-user active"
          onclick="openChat('${currentSeller}')"
        >
          <h3>${currentSeller}</h3>
          <p>Tap to start chatting</p>
        </div>
      `;
    } else {
      chatList.innerHTML = `<div class="no-chats-list">No chats yet</div>`;
    }
    if (typeof updateBadge === "function") {
      updateBadge(0);
    }
    return;
  }

  let totalUnread = 0;
  const archivedChats = new Set(getArchivedChats());
  const activeUsers = [];
  const archivedUsers = [];

  users.forEach(user => {
    const isActiveChat = currentSeller === user.user;
    const unreadCount = isActiveChat ? 0 : user.unread;
    totalUnread += unreadCount;
    const isArchived = archivedChats.has(user.user);

    if (isArchived) {
      archivedUsers.push(renderChatRow(user.user, user.lastMessage, unreadCount, isActiveChat, true));
    } else {
      activeUsers.push(renderChatRow(user.user, user.lastMessage, unreadCount, isActiveChat, false));
    }
  });

  const currentView = getChatView();
  const visibleRows = currentView === "archived" ? archivedUsers : activeUsers;
  const visibleEmptyText = currentView === "archived" ? "No archived chats yet" : "No chats yet";

  chatList.innerHTML = `
    ${renderChatTabs(activeUsers.length, archivedUsers.length)}
    <div class="chat-tab-panel">
      ${visibleRows.join("") || `<div class="no-chats-list">${visibleEmptyText}</div>`}
    </div>
  `;

  if (typeof updateBadge === "function") {
    updateBadge(totalUnread);
  }
}

// Render a friendly placeholder in the chat area when there are no conversations
function renderNoChatsPlaceholder() {
  const chatBox = document.getElementById('chatBox');
  const inputRow = document.querySelector('.chat-input-row');
  if (!chatBox) return;

  chatBox.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'no-chats';

  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'no-chats-avatar';

  const savedImage = localStorage.getItem('profileImage');
  if (savedImage) {
    avatarDiv.style.backgroundImage = `url('${savedImage}')`;
    avatarDiv.style.backgroundSize = 'cover';
    avatarDiv.style.backgroundPosition = 'center';
  } else {
    avatarDiv.textContent = (localStorage.getItem('userName') || 'H').charAt(0).toUpperCase();
  }

  const textDiv = document.createElement('div');
  textDiv.className = 'no-chats-text';
    textDiv.innerHTML = `<h3>No chats yet</h3><p>Start a conversation by browsing books or tapping "Start Chatting" on a listing.</p><button class="no-chats-cta" onclick="window.location.href='all-books.html'">Browse books</button>`;

  wrapper.appendChild(avatarDiv);
  wrapper.appendChild(textDiv);

  chatBox.appendChild(wrapper);

  if (inputRow) inputRow.style.display = 'none';
    const header = document.querySelector('.chat-header');
    if (header) header.classList.add('hidden');
}

function clearNoChatsPlaceholder() {
  const chatBox = document.getElementById('chatBox');
  const inputRow = document.querySelector('.chat-input-row');
  if (!chatBox) return;
  // if placeholder present, clear it
  if (chatBox.querySelector('.no-chats')) {
    chatBox.innerHTML = '';
  }
    if (inputRow) inputRow.style.display = '';
    const header = document.querySelector('.chat-header');
    if (header) header.classList.remove('hidden');
}

async function openChat(name){
  localStorage.setItem("chatWith", name);
  localStorage.setItem("chatSeller", name);

  try {
    const currentUser = localStorage.getItem("userName");
    if (currentUser) {
      localStorage.setItem("unreadCount", 0);
      if (typeof updateBadge === "function") {
        updateBadge(0);
      }

      const chatUserRow = document.querySelector(`#chatList .chat-user h3`);
      if (chatUserRow) {
        const rows = document.querySelectorAll('#chatList .chat-user');
        rows.forEach((row) => {
          const title = row.querySelector('h3');
          if (title && title.textContent.trim() === name.trim()) {
            const badge = row.querySelector('.unread-badge');
            if (badge) badge.remove();
            row.classList.add('active');
          }
        });
      }

      await fetch("http://localhost:5000/mark-read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: name, receiver: currentUser })
      }).catch(() => {});
    }
  } catch (e) {
    console.warn("Could not clear unread badge immediately", e);
  }

  window.location.href = `chat.html?seller=${encodeURIComponent(name)}`;
}

function getSelectedBookCategory() {
  const categorySelect = document.getElementById("bookCategory");
  const customCategoryInput = document.getElementById("otherCategory");
  const selectedCategory = categorySelect ? categorySelect.value.trim() : "";

  if (selectedCategory === "Other") {
    return (customCategoryInput?.value || "").trim();
  }

  return selectedCategory;
}

function toggleOtherCategoryInput() {
  const categorySelect = document.getElementById("bookCategory");
  const customCategoryGroup = document.getElementById("otherCategoryGroup");
  const customCategoryInput = document.getElementById("otherCategory");

  if (!categorySelect || !customCategoryGroup) return;

  const showCustom = categorySelect.value === "Other";
  customCategoryGroup.style.display = showCustom ? "block" : "none";

  if (!showCustom && customCategoryInput) {
    customCategoryInput.value = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const categorySelect = document.getElementById("bookCategory");

  if (categorySelect) {
    categorySelect.addEventListener("change", toggleOtherCategoryInput);
    toggleOtherCategoryInput();
  }
});
// addbook()
async function addBook() {

  const titleInput = document.getElementById("isbnInput") || document.getElementById("sellTitle");
  const title = titleInput ? titleInput.value.trim() : "";

  const price = Number(
    document.getElementById("bookPrice").value
  );

  const category = getSelectedBookCategory();

  const locationInput = document.getElementById("bookLocation") || document.getElementById("location");
  const savedLocation = localStorage.getItem("location") || "";
  let location = locationInput ? locationInput.value.trim() : "";
  if (!location) {
    location = savedLocation.trim();
    if (locationInput && location) {
      locationInput.value = location;
    }
  }

  const seller =
    localStorage.getItem("userName") || "User";

const files =
  document.getElementById("bookImages").files;

const formData = new FormData();

  const submitButton = document.querySelector('#sellModal .form-submit');
  const originalButtonHtml = submitButton ? submitButton.innerHTML : '';

  function setUploadingState(isUploading) {
    if (!submitButton) return;
    submitButton.disabled = isUploading;
    submitButton.innerHTML = isUploading
      ? '<span class="upload-spinner"></span> Uploading...'
      : originalButtonHtml;
  }

  if (!title || !price || !category) {
    alert("All fields required ❗");
    return;
  }

  if (document.getElementById("bookCategory")?.value === "Other" && !category) {
    alert("Please write your custom category ❗");
    return;
  }

formData.append("title", title);
formData.append("price", price);
formData.append("seller", seller);
formData.append("category", category);
formData.append("location", location || savedLocation || "Location not shared");

Array.from(files).forEach(file => {
  formData.append("images", file);
});

  try {

    setUploadingState(true);

    const response = await fetch(
      "http://localhost:5000/add-book",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    console.log(data);

    if (typeof showAutoPopup === "function") {
      showAutoPopup("Book added successfully 🎉", 1000);
    } else {
      alert("Book Added Successfully 🎉");
    }

  } catch (error) {

    console.log(error);

    alert("Server not reachable ❌");

  } finally {

    setUploadingState(false);

  }

}

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

const stats = document.querySelectorAll('.hero-stats');

if (stats.length > 0) {
  stats.forEach(el => observer.observe(el));
}

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
  const name = getFirstExistingInputValue(["signupName", "name"]);
  const email = getFirstExistingInputValue(["signupEmail", "email"]);
  const college = getFirstExistingInputValue(["signupCollege", "college"]);
  const location = getFirstExistingInputValue(["signupLocation", "location"]);
  const password = getFirstExistingInputValue(["signupPassword", "password"]);
  const confirmPassword = getFirstExistingInputValue(["signupConfirmPassword", "confirmPassword"]);

  if (password !== confirmPassword) {
    alert("Password and re-enter password must be the same ❗");
    return;
  }

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
  location,
  password
})
    });

    const data = await res.json();

    // 🔥 SUCCESS CONDITION
    if (data.message === "Signup successful ✅") {
      // SAVE to localStorage so profile/autofill works
      localStorage.setItem('userName', name);
      localStorage.setItem('email', email);
      localStorage.setItem('college', college);
      localStorage.setItem('location', location);

      alert("Signup successful 🎉");

      // 👉 Form clear
      clearFirstExistingInputs(["signupName", "name"]);
      clearFirstExistingInputs(["signupEmail", "email"]);
      clearFirstExistingInputs(["signupCollege", "college"]);
      clearFirstExistingInputs(["signupLocation", "location"]);
      clearFirstExistingInputs(["signupPassword", "password"]);
      clearFirstExistingInputs(["signupConfirmPassword", "confirmPassword"]);

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
      showAutoPopup("Login success 🎉", 1000);
      const redirectTarget = sessionStorage.getItem("postLoginRedirect") || "dashboard.html";
      sessionStorage.removeItem("postLoginRedirect");
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 1000);
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
  const premiumSection = document.getElementById("premiumSection");
  if (premiumSection) {
    premiumSection.classList.remove("blur");
  }
}

function resolveBookImageSrc(imagePath) {
  if (!imagePath) {
    return "https://via.placeholder.com/800x520?text=Book+Cover";
  }

  const normalizedPath = String(imagePath).replace(/\\/g, "/").trim();

  if (/^https?:\/\//i.test(normalizedPath) || normalizedPath.startsWith("data:") || normalizedPath.includes("cloudinary.com")) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("/") || normalizedPath.startsWith("uploads/")) {
    return `http://localhost:5000${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
  }

  return `http://localhost:5000/uploads/${normalizedPath}`;
}

function getBookLocation(book) {
  return book.location || book.bookLocation || book.campus || "Location not shared";
}

function syncBookLocationFromSignup() {
  const savedLocation = localStorage.getItem("location") || "";
  const bookLocationInput = document.getElementById("bookLocation");
  const locationInput = document.getElementById("location");

  if (bookLocationInput && !bookLocationInput.value) {
    bookLocationInput.value = savedLocation;
  }

  if (locationInput && !locationInput.value) {
    locationInput.value = savedLocation;
  }
}

window.addEventListener("DOMContentLoaded", syncBookLocationFromSignup);

async function loadBooksHome() {
  try {
    const res = await fetch("http://localhost:5000/books");
    if (!res.ok) {
      console.warn('Books API returned', res.status);
      const container = document.getElementById("booksContainer");
      if (container) {
        container.innerHTML = `\
          <div style="padding:18px;border-radius:12px;background:#fff6f6;border:1px solid #ffd6d6;color:#7a1a1a;">\
            Could not load books (server returned ${res.status}).\
            <div style="margin-top:8px;font-size:13px;color:#333">Start the backend: <code>cd backend && node server.js</code></div>\
          </div>`;
      }
      return;
    }
    const books = await res.json();

    const container = document.getElementById("booksContainer");

    if (!container) return;

    container.innerHTML = "";

    // 🔥 सिर्फ 4 books
    const limitedBooks = books.slice(0, 4);

    limitedBooks.forEach(book => {
  container.innerHTML += `
    <div class="book-card">

      <img 
          src="${resolveBookImageSrc(book.images && book.images.length > 0 ? book.images[0] : '')}"
        style="width:100%; height:120px; object-fit:cover; border-radius:8px;"
      />

      <div class="book-info">
        <div class="book-title">${book.title || "No title"}</div>
        <div class="book-author">${book.seller || "Unknown"}</div>
        <div class="book-location">${getBookLocation(book)}</div>
        <div class="book-price">₹${book.price || 0}</div>
      </div>

    </div>
  `;
});

  } catch (err) {
    console.log(err);
    const container = document.getElementById("booksContainer");
    if (container) {
      container.innerHTML = `\
        <div style="padding:18px;border-radius:12px;background:#fff6f6;border:1px solid #ffd6d6;color:#7a1a1a;">\
          Could not load books (network error).\
          <div style="margin-top:8px;font-size:13px;color:#333">Ensure the backend is running: <code>cd backend && node server.js</code></div>\
        </div>`;
    }
  }
}


window.addEventListener("DOMContentLoaded", loadBooksHome);

async function loadMyUploadsHome() {
  try {
    const container = document.getElementById("myUploadsContainer");
    const viewAllLink = document.getElementById("myUploadsViewAll");
    if (!container) return;

    const currentUser = (localStorage.getItem("userName") || "").trim();

    if (viewAllLink) {
      viewAllLink.href = currentUser ? `all-books.html?seller=${encodeURIComponent(currentUser)}` : "all-books.html";
    }

    if (!currentUser) {
      container.innerHTML = `
        <div class="book-card" style="width:100%; cursor:default;">
          <div class="book-info">
            <div class="book-title">Log in to see uploads</div>
            <div class="book-author">Your listed books will appear here after sign in.</div>
          </div>
        </div>
      `;
      return;
    }

    const res = await fetch("http://localhost:5000/books");
    if (!res.ok) {
      console.warn('Books API returned', res.status);
      container.innerHTML = `
        <div class="book-card" style="width:100%; cursor:default;">
          <div class="book-info">
            <div class="book-title">Could not load uploads (server error)</div>
            <div class="book-author">Start backend: cd backend && node server.js</div>
          </div>
        </div>
      `;
      return;
    }

    const books = await res.json();
    const myBooks = (books || []).filter((book) => (book.seller || "").trim() === currentUser);

    if (!myBooks.length) {
      container.innerHTML = `
        <div class="book-card" style="width:100%; cursor:default;">
          <div class="book-info">
            <div class="book-title">No uploads yet</div>
            <div class="book-author">Books you upload will show up here.</div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    myBooks.slice(0, 4).forEach((book) => {
      container.innerHTML += `
        <div class="book-card">
          <img
            src="${resolveBookImageSrc(book.images && book.images.length > 0 ? book.images[0] : '')}"
            style="width:100%; height:120px; object-fit:cover; border-radius:8px;"
          />

          <div class="book-info">
            <div class="book-title">${book.title || "No title"}</div>
            <div class="book-author">${book.seller || "Unknown"}</div>
            <div class="book-location">${getBookLocation(book)}</div>
            <div class="book-price">₹${book.price || 0}</div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.log(err);
  }
}

window.addEventListener("DOMContentLoaded", loadMyUploadsHome);

async function loadFeaturedBooksSlider() {
  const slider = document.getElementById("featuredBooksSlides");
  if (!slider) return;

  try {
    const res = await fetch("http://localhost:5000/books");
    if (!res.ok) {
      console.warn('Featured books API returned', res.status);
      slider.innerHTML = `
        <div class="slide active slide-placeholder">
          <div class="slide-info">
            <h2>Could not load featured books</h2>
            <p>Start backend: <code>cd backend && node server.js</code></p>
          </div>
        </div>
      `;
      return;
    }

    const books = await res.json();
    const featuredBooks = (books || []).slice(0, 6);

    if (!featuredBooks.length) {
      slider.innerHTML = `
        <div class="slide active slide-placeholder">
          <div class="slide-info">
            <h2>No featured books yet</h2>
            <p>Seller uploads will show up here once books are listed.</p>
          </div>
        </div>
      `;
      return;
    }

    while (featuredBooks.length < 6) {
      featuredBooks.push(featuredBooks[featuredBooks.length % books.length]);
    }

    slider.innerHTML = featuredBooks.map((book, index) => {
      const imageUrl = resolveBookImageSrc(book.images && book.images.length > 0 ? book.images[0] : '');
      const sellerName = book.seller || 'Unknown seller';
      const bookTitle = book.title || 'Untitled book';
      const bookLocation = getBookLocation(book);
      const price = Number(book.price) || 0;

      return `
        <div class="slide ${index === 0 ? 'active' : ''}">
          <img src="${imageUrl}" alt="${bookTitle}">
          <div class="slide-info">
            <h2>${bookTitle}</h2>
            <p>${sellerName} · ${bookLocation} · ₹${price}</p>
            <button class="slide-chat-btn" onclick="event.stopPropagation(); chatWithSeller(${JSON.stringify(sellerName)})">
              Chat with seller
            </button>
          </div>
        </div>
      `;
    }).join('');

    currentSlide = 0;
    showSlide(0);
  } catch (err) {
    console.warn('Could not load featured books slider', err);
    slider.innerHTML = `
      <div class="slide active slide-placeholder">
        <div class="slide-info">
          <h2>Could not load featured books</h2>
          <p>Network error. Start backend: <code>cd backend && node server.js</code></p>
        </div>
      </div>
    `;
  }
}

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

window.addEventListener('DOMContentLoaded', loadFeaturedBooksSlider);

// Navigate to chat with selected seller
function chatWithSeller(name) {

  console.log("CLICKED USER:", name);

  localStorage.setItem("chatSeller", name);
  localStorage.setItem("chatWith", name);

  console.log(
    "SAVED:",
    localStorage.getItem("chatSeller")
  );

  window.location.href = `chat.html?seller=${encodeURIComponent(name)}`;
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

function updateBadge(count) {
  const badge = document.getElementById("chatBadge");
  if (!badge) return;

  if (count > 0) {
    badge.style.display = "flex";
    badge.innerText = count;
  } else {
    badge.style.display = "none";
    badge.innerText = "0";
  }
}

function initUnreadBadge() {
  const count = Number(localStorage.getItem("unreadCount")) || 0;
  updateBadge(count);
}

function initSocket() {
  if (typeof io === "undefined") return;

  const currentUser = localStorage.getItem("userName");
  const otherUser = localStorage.getItem("chatSeller");
  const socket = io("http://localhost:5000");

  if (currentUser) {
    socket.emit("joinUser", currentUser);
  }

  if (currentUser && otherUser) {
    const roomId =
      currentUser < otherUser
        ? `${currentUser}_${otherUser}`
        : `${otherUser}_${currentUser}`;

    socket.emit("joinRoom", roomId);
  }

  socket.on("receiveMessage", (data) => {
    if (data.sender === currentUser) return;

    const nextCount = (Number(localStorage.getItem("unreadCount")) || 0) + 1;
    localStorage.setItem("unreadCount", nextCount);
    updateBadge(nextCount);
  });
}

window.addEventListener("focus", () => {
  localStorage.setItem("unreadCount", 0);
  updateBadge(0);
});


function openProfile(){

  window.location.href =
    "profile.html";

}

function startChatting() {
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");

  if (token && userName) {
    window.location.href = "chat.html";
    return;
  }

  sessionStorage.setItem("postLoginRedirect", "chat.html");
  openModal("authModal");
}

// Anchor scroll fallback — ensures hash links land below fixed header
(function(){
  function scrollToHash(hash){
    if(!hash) return;
    const id = hash.startsWith('#') ? hash.slice(1) : hash;
    const el = document.getElementById(id);
    console.log('anchor scroll requested ->', hash, '-> element?', !!el);
    if(!el) return;
    const nav = document.querySelector('nav');
    const navHeight = nav ? nav.offsetHeight : 0;
    const rect = el.getBoundingClientRect();
    const top = window.pageYOffset + rect.top - navHeight - 8; // small gap
    // temporary visual highlight for debugging
    el.style.outline = '3px solid rgba(255,160,0,0.9)';
    el.style.transition = 'outline 0.3s ease-in-out';
    setTimeout(() => { el.style.outline = 'none'; }, 1400);

    window.scrollTo({ top, behavior: 'smooth' });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e){
      console.log('anchor clicked ->', a.getAttribute('href'));
      const href = a.getAttribute('href');
      if(!href || href === '#' || href.startsWith('javascript:')) return;
      e.preventDefault();
      scrollToHash(href);
      try { history.replaceState(null, '', href); } catch(e){}
    });
  });

  if(location.hash){
    setTimeout(() => scrollToHash(location.hash), 60);
  }
})();