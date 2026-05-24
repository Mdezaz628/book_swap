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

let supportUiReady = false;
let supportMode = 'report';
let termsUiReady = false;

function fillSupportIdentity() {
  const nameInput = document.getElementById('supportName');
  const emailInput = document.getElementById('supportEmail');
  const storedName = localStorage.getItem('userName') || '';
  const storedEmail = localStorage.getItem('email') || '';
  if (nameInput && !nameInput.value) nameInput.value = storedName;
  if (emailInput && !emailInput.value) emailInput.value = storedEmail;
}

function ensureSupportUi() {
  if (supportUiReady || document.getElementById('supportModal') || !document.body) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <button id="supportFab" type="button" onclick="openSupportModal('report')" style="position:fixed;right:18px;bottom:18px;z-index:99998;border:none;border-radius:999px;padding:14px 18px;background:linear-gradient(135deg,#0f2b5b 0%,#1d4ed8 100%);color:#fff;font-weight:800;box-shadow:0 18px 34px rgba(15,43,91,.28);cursor:pointer;">Report / Feedback</button>
    <div class="modal-overlay" id="supportModal">
      <div class="modal" style="max-width:640px;width:min(640px,calc(100vw - 24px));">
        <button class="modal-close" type="button" onclick="closeSupportModal()">✕</button>
        <h3>Report / Feedback</h3>
        <p class="modal-sub">Use this to report fake books, abusive chats, scam users, bugs, or suggestions.</p>
        <div class="tabs" style="margin-bottom:14px;">
          <button type="button" class="tab-btn active" id="supportReportTabBtn" onclick="switchSupportTab('report')">Report</button>
          <button type="button" class="tab-btn" id="supportFeedbackTabBtn" onclick="switchSupportTab('feedback')">Feedback</button>
        </div>
        <div id="supportReportPane">
          <div class="form-group">
            <label>Your Name</label>
            <input type="text" id="supportName" placeholder="Your name">
          </div>
          <div class="form-group">
            <label>Your Email</label>
            <input type="email" id="supportEmail" placeholder="your@email.com">
          </div>
          <div class="form-group">
            <label>Report Type</label>
            <select id="reportType">
              <option value="book">Fake book</option>
              <option value="chat">Abusive chat</option>
              <option value="user">Scam user</option>
            </select>
          </div>
          <div class="form-group">
            <label>Target label</label>
            <input type="text" id="reportTargetLabel" placeholder="Book title, user name, or chat context">
          </div>
          <div class="form-group">
            <label>Reason</label>
            <select id="reportReason">
              <option value="Fake listing">Fake listing</option>
              <option value="Scam / fraud">Scam / fraud</option>
              <option value="Abusive behavior">Abusive behavior</option>
              <option value="Harassment">Harassment</option>
              <option value="Spam">Spam</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Details</label>
            <textarea id="reportDetails" rows="4" placeholder="Share what happened..."></textarea>
          </div>
        </div>
        <div id="supportFeedbackPane" style="display:none;">
          <div class="form-group">
            <label>Your Name</label>
            <input type="text" id="feedbackName" placeholder="Your name">
          </div>
          <div class="form-group">
            <label>Your Email</label>
            <input type="email" id="feedbackEmail" placeholder="your@email.com">
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="feedbackCategory">
              <option value="Suggestion">Suggestion</option>
              <option value="Bug report">Bug report</option>
              <option value="Rating">Rating</option>
            </select>
          </div>
          <div class="form-group">
            <label>Rating</label>
            <select id="feedbackRating">
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Okay</option>
              <option value="2">2 - Needs work</option>
              <option value="1">1 - Poor</option>
            </select>
          </div>
          <div class="form-group">
            <label>Feedback</label>
            <textarea id="feedbackMessage" rows="4" placeholder="Tell us what to improve..."></textarea>
          </div>
        </div>
        <button type="button" class="form-submit" id="supportSubmitBtn" onclick="submitSupportEntry()">Submit</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);
  supportUiReady = true;
  fillSupportIdentity();
  switchSupportTab('report');
}

function ensureTermsUi() {
  if (termsUiReady || document.getElementById('termsModal') || !document.body) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="modal-overlay" id="termsModal">
      <div class="modal" style="max-width:760px;width:min(760px,calc(100vw - 24px));max-height:calc(100vh - 28px);overflow:auto;">
        <button class="modal-close" type="button" onclick="closeTermsModal()">✕</button>
        <h3>Terms & Conditions</h3>
        <p class="modal-sub">Please read these before creating an account on SwapTome.</p>
        <div style="display:grid;gap:14px;line-height:1.65;color:var(--ink);font-size:0.96rem;">
          <section>
            <h4 style="margin:0 0 6px;font-size:1rem;">1. Eligibility</h4>
            <p style="margin:0;">You must be at least 13 years old to use SwapTome.</p>
          </section>
          <section>
            <h4 style="margin:0 0 6px;font-size:1rem;">2. User Accounts</h4>
            <ul style="margin:0;padding-left:20px;">
              <li>Users are responsible for maintaining account security.</li>
              <li>You agree to provide accurate information.</li>
              <li>Fake accounts may be suspended or removed.</li>
            </ul>
          </section>
          <section>
            <h4 style="margin:0 0 6px;font-size:1rem;">3. Book Listings</h4>
            <ul style="margin:0;padding-left:20px;">
              <li>Users may only upload books they legally own or are allowed to share/sell/exchange.</li>
              <li>Spam, fake, or misleading listings are prohibited.</li>
              <li>SwapTome may remove inappropriate content without notice.</li>
            </ul>
          </section>
          <section>
            <h4 style="margin:0 0 6px;font-size:1rem;">4. Prohibited Activities</h4>
            <ul style="margin:0;padding-left:20px;">
              <li>Harass or abuse others</li>
              <li>Upload illegal or copyrighted material</li>
              <li>Attempt scams or fraud</li>
              <li>Exploit system vulnerabilities</li>
              <li>Use bots or automated abuse tools</li>
            </ul>
          </section>
          <section>
            <h4 style="margin:0 0 6px;font-size:1rem;">5. Messaging & Communication</h4>
            <p style="margin:0;">Users are responsible for their own conversations and interactions.</p>
          </section>
          <section>
            <h4 style="margin:0 0 6px;font-size:1rem;">6. Account Suspension</h4>
            <p style="margin:0;">SwapTome reserves the right to suspend or permanently ban accounts violating these rules.</p>
          </section>
          <section>
            <h4 style="margin:0 0 6px;font-size:1rem;">7. Privacy</h4>
            <p style="margin:0;">We collect limited account information such as email addresses and profile information to operate the platform securely.</p>
          </section>
          <section>
            <h4 style="margin:0 0 6px;font-size:1rem;">8. Disclaimer</h4>
            <p style="margin:0;">SwapTome is a student platform and is provided “as is” without warranties of uninterrupted availability.</p>
          </section>
          <section>
            <h4 style="margin:0 0 6px;font-size:1rem;">9. Limitation of Liability</h4>
            <p style="margin:0;">SwapTome is not responsible for disputes, losses, scams, or damages caused by users.</p>
          </section>
          <section>
            <h4 style="margin:0 0 6px;font-size:1rem;">10. Changes to Terms</h4>
            <p style="margin:0;">These Terms may be updated at any time without prior notice.</p>
          </section>
          <section>
            <h4 style="margin:0 0 6px;font-size:1rem;">11. Contact</h4>
            <p style="margin:0;">For support or legal concerns, contact <a href="mailto:support@swaptome.com">support@swaptome.com</a>.</p>
          </section>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:18px;gap:10px;flex-wrap:wrap;">
          <button type="button" class="form-submit" style="width:auto;padding:12px 18px;" onclick="closeTermsModal()">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);
  termsUiReady = true;
}

function openTermsModal() {
  ensureTermsUi();
  const modal = document.getElementById('termsModal');
  if (!modal) return;
  modal.classList.add('open');
}

function closeTermsModal() {
  const modal = document.getElementById('termsModal');
  if (modal) modal.classList.remove('open');
}

function openSupportModal(tab = 'report') {
  ensureSupportUi();
  const modal = document.getElementById('supportModal');
  if (!modal) return;
  modal.classList.add('open');
  switchSupportTab(tab);
  fillSupportIdentity();
}

function closeSupportModal() {
  const modal = document.getElementById('supportModal');
  if (modal) modal.classList.remove('open');
}

function switchSupportTab(tab) {
  supportMode = tab === 'feedback' ? 'feedback' : 'report';
  const reportPane = document.getElementById('supportReportPane');
  const feedbackPane = document.getElementById('supportFeedbackPane');
  const reportBtn = document.getElementById('supportReportTabBtn');
  const feedbackBtn = document.getElementById('supportFeedbackTabBtn');

  if (reportPane) reportPane.style.display = supportMode === 'report' ? 'block' : 'none';
  if (feedbackPane) feedbackPane.style.display = supportMode === 'feedback' ? 'block' : 'none';
  if (reportBtn) reportBtn.classList.toggle('active', supportMode === 'report');
  if (feedbackBtn) feedbackBtn.classList.toggle('active', supportMode === 'feedback');
}

async function submitSupportEntry() {
  try {
    ensureSupportUi();
    const submitBtn = document.getElementById('supportSubmitBtn');
    if (submitBtn) submitBtn.disabled = true;

    if (supportMode === 'report') {
      const payload = {
        type: document.getElementById('reportType')?.value || 'book',
        targetId: '',
        targetLabel: document.getElementById('reportTargetLabel')?.value.trim() || '',
        reason: document.getElementById('reportReason')?.value || 'Other',
        details: document.getElementById('reportDetails')?.value.trim() || '',
        reporterName: document.getElementById('supportName')?.value.trim() || localStorage.getItem('userName') || 'Anonymous',
        reporterEmail: document.getElementById('supportEmail')?.value.trim() || localStorage.getItem('email') || ''
      };

      if (!payload.reason || !payload.details) {
        alert('Please add reason and details.');
        return;
      }

      const res = await fetch(apiUrl('/reports'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Report failed');
      alert('Report submitted ✅');
    } else {
      const payload = {
        type: 'feedback',
        category: document.getElementById('feedbackCategory')?.value || 'Suggestion',
        rating: Number(document.getElementById('feedbackRating')?.value || 0),
        name: document.getElementById('feedbackName')?.value.trim() || localStorage.getItem('userName') || 'Anonymous',
        email: document.getElementById('feedbackEmail')?.value.trim() || localStorage.getItem('email') || '',
        pageUrl: window.location.pathname,
        message: document.getElementById('feedbackMessage')?.value.trim() || ''
      };

      if (!payload.message) {
        alert('Please write your feedback.');
        return;
      }

      const res = await fetch(apiUrl('/feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Feedback failed');
      alert('Feedback submitted ✅');
    }

    ['reportTargetLabel', 'reportDetails', 'feedbackMessage'].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });

    closeSupportModal();
  } catch (err) {
    alert(err.message || 'Submission failed');
  } finally {
    const submitBtn = document.getElementById('supportSubmitBtn');
    if (submitBtn) submitBtn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ensureSupportUi();
  ensureTermsUi();
});

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

function getApiBaseUrl() {
  const explicitBase = window.__API_BASE_URL__ || localStorage.getItem('apiBaseUrl') || '';
  if (explicitBase) return explicitBase.replace(/\/$/, '');

  // Default to production API URL. If you need to override for local dev,
  // set window.__API_BASE_URL__ or localStorage 'apiBaseUrl'.
  return 'https://swaptome-api.onrender.com';
}

function apiUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

function getProfileImageStorageKey(identity) {
  return `profileImage:${String(identity || getProfileStorageIdentity()).replace(/[^a-z0-9_-]+/gi, "_")}`;
}

function setVerificationPending(email) {
  localStorage.setItem('verificationPending', '1');
  if (email) {
    localStorage.setItem('verificationPendingEmail', String(email).trim().toLowerCase());
  }
  renderVerificationReminder();
}

function clearVerificationPending() {
  localStorage.removeItem('verificationPending');
  localStorage.removeItem('verificationPendingEmail');
  renderVerificationReminder();
}

function renderVerificationReminder() {
  const pending = localStorage.getItem('verificationPending') === '1';
  const pendingEmail = localStorage.getItem('verificationPendingEmail') || '';
  const reminderText = pendingEmail
    ? `Verification email sent to ${pendingEmail}. Check your inbox and spam folder.`
    : 'Verification email sent. Check your inbox and spam folder.';

  document.querySelectorAll('[data-verification-reminder]').forEach((banner) => {
    if (!banner) return;
    banner.style.display = pending ? 'block' : 'none';
    banner.textContent = reminderText;
  });
}

document.addEventListener('DOMContentLoaded', renderVerificationReminder);

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

function showAutoPopup(message, durationMs = 1000, subtitle = '') {
  let popup = document.getElementById("autoPopupToast");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "autoPopupToast";
    popup.className = "broadcast-toast";
    document.body.appendChild(popup);
  }

  popup.innerHTML = `
    <div class="broadcast-toast__row">
      <div class="broadcast-toast__icon">🔔</div>
      <div class="broadcast-toast__content">
        <div class="broadcast-toast__title">${message}</div>
        ${subtitle ? `<div class="broadcast-toast__message">${subtitle}</div>` : ''}
        <span class="broadcast-toast__pill">Broadcast</span>
      </div>
    </div>
  `;
  popup.style.opacity = "1";
  popup.style.transform = "translateX(-50%) translateY(0)";

  window.clearTimeout(window.__autoPopupTimer);
  window.__autoPopupTimer = window.setTimeout(() => {
    popup.style.opacity = "0";
    popup.style.transform = "translateX(-50%) translateY(-6px)";
  }, durationMs);
}

function persistBroadcast(notification) {
  if (!notification) return;

  try {
    localStorage.setItem('latestBroadcast', JSON.stringify(notification));
    if (notification.createdAt) {
      localStorage.setItem('lastBroadcastSeen', String(notification.createdAt));
    }
  } catch (err) {
    console.warn('Failed to persist broadcast', err);
  }
}

function isDashboardPage() {
  return window.location.pathname.endsWith('dashboard.html');
}

function getBroadcastKey(notification) {
  if (!notification) return '';
  const title = String(notification.title || '').trim();
  const message = String(notification.message || '').trim();
  const important = notification.important ? '1' : '0';
  const createdAt = String(notification.createdAt || '').trim();
  return [title, message, important, createdAt].join('|');
}

function shouldShowBroadcast(notification) {
  const key = getBroadcastKey(notification);
  if (!key) return false;

  try {
    const lastKey = localStorage.getItem('lastBroadcastToastKey') || '';
    if (lastKey === key) return false;
    localStorage.setItem('lastBroadcastToastKey', key);
  } catch (err) {
    console.warn('Could not store broadcast dedupe key', err);
  }

  return true;
}

function formatBroadcastTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return String(value);
  }
}

function getBroadcastVisibilityKey(notification) {
  return `hiddenBroadcast:${getBroadcastKey(notification)}`;
}

function isBroadcastHidden(notification) {
  if (!notification) return false;
  try {
    return localStorage.getItem(getBroadcastVisibilityKey(notification)) === '1';
  } catch (err) {
    return false;
  }
}

function setBroadcastHidden(notification, hidden) {
  if (!notification) return;
  try {
    const key = getBroadcastVisibilityKey(notification);
    if (hidden) {
      localStorage.setItem(key, '1');
    } else {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('Could not store broadcast visibility state', err);
  }
}

function removeBroadcastBanner() {
  const existing = document.getElementById('broadcastBanner');
  if (existing) existing.remove();

  const toggle = document.getElementById('broadcastBannerToggle');
  if (toggle) toggle.remove();
}

function renderBroadcastBanner(notification) {
  if (!isDashboardPage()) return;
  removeBroadcastBanner();
  if (!notification || !notification.important) return;

  if (isBroadcastHidden(notification)) {
    const toggle = document.createElement('button');
    toggle.id = 'broadcastBannerToggle';
    toggle.type = 'button';
    toggle.textContent = 'Show';
    toggle.setAttribute('aria-label', 'Show broadcast banner again');
    toggle.style.cssText = [
      'position:sticky',
      'top:0',
      'margin-left:auto',
      'display:block',
      'margin-right:16px',
      'padding:8px 14px',
      'border-radius:999px',
      'border:1px solid rgba(212,205,184,.9)',
      'background:#fffaf0',
      'color:#334155',
      'font-weight:800',
      'cursor:pointer',
      'box-shadow:0 8px 20px rgba(0,0,0,.12)',
      'z-index:9999'
    ].join(';') + ';';
    toggle.addEventListener('click', () => {
      setBroadcastHidden(notification, false);
      renderBroadcastBanner(notification);
    });
    document.body.prepend(toggle);
    return;
  }

  const bar = document.createElement('div');
  bar.id = 'broadcastBanner';
  bar.className = 'broadcast-banner';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');
  const when = formatBroadcastTime(notification.createdAt);
  bar.innerHTML = `
    <div class="broadcast-banner__content">
      <div class="broadcast-banner__title-row">
        <strong class="broadcast-banner__title">${notification.title || 'Important broadcast'}</strong>
        <span class="broadcast-banner__pill">Important</span>
      </div>
      <div class="broadcast-banner__message">${notification.message || ''}</div>
      <div class="broadcast-banner__meta">
        ${when ? `<span class="broadcast-banner__time">${when}</span>` : ''}
      </div>
    </div>
    <button type="button" aria-label="Hide broadcast banner" style="background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:6px 10px;cursor:pointer">Hide</button>
  `;
  const hideButton = bar.querySelector('button');
  hideButton.addEventListener('click', () => {
    setBroadcastHidden(notification, true);
    renderBroadcastBanner(notification);
  });
  document.body.prepend(bar);
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
      fetch("https://swaptome-api.onrender.com/mark-read", {
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
    const res = await fetch("https://swaptome-api.onrender.com/stats");
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
let featuredSliderTimer = null;

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
    if (featuredSliderTimer) clearInterval(featuredSliderTimer);
    featuredSliderTimer = setInterval(nextSlide, 3000);
    document.querySelectorAll('.slide-btn.next').forEach(b => b.addEventListener('click', nextSlide));
    document.querySelectorAll('.slide-btn.prev').forEach(b => b.addEventListener('click', prevSlide));

    const sliderWrap = document.querySelector('.netflix-slider');
    if (sliderWrap) {
      sliderWrap.addEventListener('mouseenter', () => {
        if (featuredSliderTimer) {
          clearInterval(featuredSliderTimer);
          featuredSliderTimer = null;
        }
      });

      sliderWrap.addEventListener('mouseleave', () => {
        if (!featuredSliderTimer && document.querySelectorAll('.slide').length > 1) {
          featuredSliderTimer = setInterval(nextSlide, 3000);
        }
      });
    }
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

  const res = await fetch(`https://swaptome-api.onrender.com/inbox/${currentUser}`);
  if (!res.ok) {
    console.warn('Inbox API returned', res.status);
    // show server error in main chat area
    try { const chatBox = document.getElementById('chatBox'); if (chatBox) { chatBox.innerHTML = '<div class="no-chats"><div class="no-chats-text"><h3>Server unreachable</h3><p>Could not load inbox. Try again later.</p></div></div>'; } } catch (e) {}
    return;
  }
  let users = await res.json();
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

  const latestBroadcast = (() => {
    try {
      return JSON.parse(localStorage.getItem('latestBroadcast') || 'null');
    } catch (err) {
      return null;
    }
  })();

  const hasAdminThread = users.some((user) => user.user === 'admin');
  const adminLastMessage = latestBroadcast?.message || 'Admin broadcasts and notices appear here.';
  if (currentUser && currentUser !== 'admin') {
    const adminRow = {
      user: 'admin',
      lastMessage: adminLastMessage,
      unread: 0,
      isAdminNotice: true
    };

    if (hasAdminThread) {
      users = users.map((user) => user.user === 'admin' ? { ...user, lastMessage: adminLastMessage } : user);
    } else {
      users.unshift(adminRow);
    }
  }

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

      await fetch("https://swaptome-api.onrender.com/mark-read", {
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

  const writerInput = document.getElementById("bookWriter");
  const writer = writerInput ? writerInput.value.trim() : "";

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

const imageInput = document.getElementById("bookImages");
const files = imageInput.files;

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

  if (!title || !writer || !price || !category) {
    alert("All fields required ❗");
    return;
  }

  if (document.getElementById("bookCategory")?.value === "Other" && !category) {
    alert("Please write your custom category ❗");
    return;
  }

formData.append("title", title);
formData.append("writer", writer);
formData.append("price", price);
formData.append("seller", seller);
formData.append("category", category);
formData.append("location", location || savedLocation || "Location not shared");

Array.from(files).forEach((file) => {
   formData.append("images", file);
});

  try {

    setUploadingState(true);

    const response = await fetch(
      "https://swaptome-api.onrender.com/api/add-book",
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
  const termsAccepted = Boolean(
    document.getElementById("signupTerms")?.checked ||
    document.getElementById("termsAccept")?.checked
  );

  if (password !== confirmPassword) {
    alert("Password and re-enter password must be the same ❗");
    return;
  }

  if (!termsAccepted) {
    alert("You must accept the Terms & Conditions before signing up.");
    return;
  }

  try {
    const res = await fetch(apiUrl("/api/auth/signup"), {
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
    if (data.message && data.message.toLowerCase().includes("verification email")) {
      alert(data.message + " Check your inbox and click the link to activate your account.");
      setVerificationPending(email);

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
      alert(data.message || "Signup failed ❌"); // user exists etc.
    }

  } catch (err) {
    console.error(err);
    alert("Signup failed ❌");
  }
}

async function resendVerificationEmail() {
  const email = getFirstExistingInputValue(["loginEmail", "email"]).trim();
  if (!email) {
    alert("Enter your email first ❗");
    return;
  }

  try {
    const res = await fetch(apiUrl("/api/auth/resend-verification"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    const message = String(data.message || '');
    if (message.toLowerCase().includes('smtp') || message.toLowerCase().includes('not configured') || message.toLowerCase().includes('smtp_service')) {
      alert('Email service is not configured on the server. The verification email could not be sent. Please contact support or try again later.');
      console.warn('Resend verification failed (SMTP not configured):', message);
      return;
    }
    if (!res.ok) {
      alert(message || 'Unable to send verification email ❌');
      return;
    }

    alert(message || "Verification email sent ✅");
  } catch (err) {
    console.error(err);
    alert("Unable to resend verification email ❌");
  }
}

async function forgotPassword() {
  const email = getFirstExistingInputValue(["loginEmail", "email"]).trim() || prompt("Enter your email for password reset:");
  if (!email) return;

  try {
    const res = await fetch(apiUrl("/api/auth/forgot-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    alert(data.message || "Reset link sent ✅");
  } catch (err) {
    console.error(err);
    alert("Unable to send reset link ❌");
  }
}

// 🔥 LOGIN FUNCTION
async function loginUser() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const adminEmail = "ansarimdezaz01@gmail.com";

  try {
    const res = await fetch(apiUrl("/api/auth/login"), {
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
      localStorage.setItem("role", data.role || "user");
      clearVerificationPending();
      if (data.role === "admin" || normalizedEmail === adminEmail) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminEmail", normalizedEmail);
      } else {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminEmail");
      }
      showAutoPopup("Login success 🎉", 1000);
      const redirectTarget = (data.role === "admin" || normalizedEmail === adminEmail)
        ? "admin.html"
        : (sessionStorage.getItem("postLoginRedirect") || "dashboard.html");
      sessionStorage.removeItem("postLoginRedirect");
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 1000);
    } else if ((data.message || '').toLowerCase().includes('verify your email first')) {
      const retry = confirm("Please verify your email first. Resend the verification email now?");
      if (retry) await resendVerificationEmail();
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
    return `https://swaptome-api.onrender.com${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
  }

  return `https://swaptome-api.onrender.com/uploads/${normalizedPath}`;
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
    const res = await fetch("https://swaptome-api.onrender.com/api/books");
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
    const limitedBooks = [...books]
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
      .slice(0, 4);

    limitedBooks.forEach(book => {
  const featuredLabel = book.featured ? `<span class="book-badge featured">${book.featured}</span>` : '';
  container.innerHTML += `
    <div class="book-card">

      <img 
          src="${resolveBookImageSrc(book.images && book.images.length > 0 ? book.images[0] : '')}"
        style="width:100%; height:120px; object-fit:cover; border-radius:8px;"
      />

      <div class="book-info">
        <div class="book-badges">${featuredLabel}</div>
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

    const res = await fetch("https://swaptome-api.onrender.com/api/books");
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
    const res = await fetch("https://swaptome-api.onrender.com/api/books");
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
    const featuredBooks = (books || [])
      .filter((book) => book.featured)
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
      .slice(0, 6);

    if (!featuredBooks.length) {
      slider.innerHTML = `
        <div class="slide active slide-placeholder">
          <div class="slide-info">
            <h2>No featured books yet</h2>
            <p>Admin-marked featured books will show up here.</p>
          </div>
        </div>
      `;
      return;
    }

    const sliderBooks = featuredBooks;

    while (sliderBooks.length < 6 && sliderBooks.length > 0) {
      sliderBooks.push(sliderBooks[sliderBooks.length % sliderBooks.length]);
    }

    slider.innerHTML = sliderBooks.map((book, index) => {
      const imageUrl = resolveBookImageSrc(book.images && book.images.length > 0 ? book.images[0] : '');
      const sellerName = book.seller || 'Unknown seller';
      const bookTitle = book.title || 'Untitled book';
      const bookLocation = getBookLocation(book);
      const price = Number(book.price) || 0;

      return `
        <div class="slide ${index === 0 ? 'active' : ''}">
          <img src="${imageUrl}" alt="${bookTitle}">
          <div class="slide-info">
            ${book.featured ? `<span class="book-badge featured">${book.featured}</span>` : ''}
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
    const res = await fetch("https://swaptome-api.onrender.com/profile", {
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
  const socket = io("https://swaptome-api.onrender.com");

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

  socket.on("adminNotification", (notification) => {
    persistBroadcast(notification);
    if (notification?.important) {
      renderBroadcastBanner(notification);
    }
    if (!shouldShowBroadcast(notification)) return;
    const label = notification?.title || "Admin notice";
    showAutoPopup(label, 2500, notification?.message || '');
  });

  socket.on("announcementUpdated", (announcement) => {
    renderStickyAnnouncement(announcement);
  });

  socket.on("forceLogout", (payload) => {
    localStorage.clear();
    sessionStorage.clear();
    showAutoPopup(payload?.reason || "You have been logged out", 2500);
    setTimeout(() => {
      window.location.href = "index.html";
    }, 600);
  });
}

function renderStickyAnnouncement(announcement) {
  if (!isDashboardPage()) return;
  const existing = document.getElementById("stickyAnnouncementBar");
  if (existing) existing.remove();
  if (!announcement || !announcement.active) return;

  const announcementKey = [
    String(announcement.title || '').trim(),
    String(announcement.message || '').trim(),
    String(announcement.updatedAt || announcement.createdAt || '').trim(),
    String(Boolean(announcement.active))
  ].join('|');

  const seenAnnouncementKey = localStorage.getItem('lastSeenAnnouncementKey') || '';
  if (seenAnnouncementKey === announcementKey) return;

  // Save announcement text to admin chat history source as latest broadcast-style notice
  persistBroadcast({
    title: announcement.title || 'Announcement',
    message: announcement.message || '',
    important: false,
    createdAt: announcement.updatedAt || announcement.createdAt || new Date().toISOString(),
    source: 'announcement'
  });

  const bar = document.createElement("div");
  bar.id = "stickyAnnouncementBar";
  bar.style.position = "sticky";
  bar.style.top = "0";
  bar.style.zIndex = "9999";
  bar.style.background = "linear-gradient(90deg, #0f172a, #1d4ed8)";
  bar.style.color = "white";
  bar.style.padding = "10px 16px";
  bar.style.display = "flex";
  bar.style.justifyContent = "space-between";
  bar.style.alignItems = "center";
  bar.style.gap = "12px";
  bar.innerHTML = `
    <div>
      <strong>${announcement.title || 'Announcement'}</strong>
      <span style="margin-left:8px;opacity:.95">${announcement.message || ''}</span>
    </div>
    <button type="button" aria-label="Dismiss announcement" style="background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:6px 10px;cursor:pointer">×</button>
  `;
  const markSeenAndRemove = () => {
    localStorage.setItem('lastSeenAnnouncementKey', announcementKey);
    bar.remove();
  };

  bar.querySelector('button').addEventListener('click', markSeenAndRemove);
  document.body.prepend(bar);

  // One-time visibility: auto-hide after user has had a chance to see it
  setTimeout(markSeenAndRemove, 6000);
}

async function loadStickyAnnouncement() {
  try {
    if (!isDashboardPage()) return;
    const res = await fetch('https://swaptome-api.onrender.com/announcements/active');
    if (!res.ok) return;
    const data = await res.json();
    renderStickyAnnouncement(data.announcement);
  } catch (err) {
    console.warn('Announcement load failed', err);
  }
}

async function loadLatestBroadcast() {
  try {
    const res = await fetch('https://swaptome-api.onrender.com/notifications/latest');
    if (!res.ok) {
      const cached = JSON.parse(localStorage.getItem('latestBroadcast') || 'null');
      if (cached?.important && isDashboardPage()) renderBroadcastBanner(cached);
      return;
    }
    const data = await res.json();
    const notification = data.notification;
    if (!notification?.message) {
      const cached = JSON.parse(localStorage.getItem('latestBroadcast') || 'null');
      if (cached?.important && isDashboardPage()) renderBroadcastBanner(cached);
      return;
    }

    persistBroadcast(notification);

    const lastSeen = localStorage.getItem('lastBroadcastSeen');
    if (lastSeen !== String(notification.createdAt || '')) {
      localStorage.setItem('lastBroadcastSeen', String(notification.createdAt || ''));
    }

    if (notification.important && isDashboardPage()) {
      renderBroadcastBanner(notification);
    } else {
      if (!isDashboardPage() || !shouldShowBroadcast(notification)) return;
      showAutoPopup(notification.title || 'Broadcast', 2500, notification.message || '');
    }
  } catch (err) {
    console.warn('Broadcast load failed', err);
    try {
      const cached = JSON.parse(localStorage.getItem('latestBroadcast') || 'null');
      if (cached?.important && isDashboardPage()) renderBroadcastBanner(cached);
    } catch (cacheErr) {
      console.warn('Cached broadcast load failed', cacheErr);
    }
  }
}

window.addEventListener('DOMContentLoaded', loadStickyAnnouncement);
window.addEventListener('DOMContentLoaded', loadLatestBroadcast);

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