import dotenv from "dotenv";
dotenv.config();
import dns from "dns";
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
import jwt from "jsonwebtoken";
import crypto from "crypto";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt"; // ✅ FIX
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";
import cloudinary from "./config/cloudinary.js";
import upload from "./middleware/multer.js";
import Book from "./models/Book.js";
import User from "./models/User.js";
import Message from "./models/Message.js";
import DealVerification from "./models/DealVerification.js";
import Report from "./models/Report.js";
import Feedback from "./models/Feedback.js";
import Announcement from "./models/Announcement.js";
import AdminLog from "./models/AdminLog.js";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const pendingDeals = new Map();
const onlineUsers = new Map();
const socketUsers = new Map();
const activeRooms = new Set();
const ADMIN_INBOX_USER = process.env.ADMIN_INBOX_USER || 'admin';
let legacyImageMigrationPromise = null;

// Admin emails list for assigning admin role on Google sign-in
const adminEmails = [
  "ezazmdrk3929@gmail.com"
];

function getJwtSecret() {
  return process.env.JWT_SECRET || 'secretkey123';
}

function getAppBaseUrl() {
  return process.env.APP_BASE_URL || 'https://swaptome-api.onrender.com';
}

function isCloudinaryImage(value) {
  return /^https?:\/\//i.test(String(value || '')) && String(value || '').includes('cloudinary.com');
}

function isLegacyUploadPath(value) {
  const normalized = String(value || '').replace(/\\/g, '/').trim();
  return Boolean(normalized) && !/^https?:\/\//i.test(normalized) && normalized.startsWith('uploads/');
}

async function migrateLegacyBookImages() {
  if (!legacyImageMigrationPromise) {
    legacyImageMigrationPromise = (async () => {
      const books = await Book.find({ images: { $exists: true, $ne: [] } });

      for (const book of books) {
        const images = Array.isArray(book.images) ? book.images : [];
        let changed = false;

        const migratedImages = [];

        for (const imagePath of images) {
          if (!isLegacyUploadPath(imagePath) || isCloudinaryImage(imagePath)) {
            migratedImages.push(imagePath);
            continue;
          }

          const normalizedPath = String(imagePath).replace(/\\/g, '/').trim();
          const absolutePath = path.resolve(normalizedPath);

          try {
            await fs.access(absolutePath);
            const result = await cloudinary.uploader.upload(absolutePath, { folder: 'books' });
            migratedImages.push(result.secure_url || result.url || imagePath);
            changed = true;
            await fs.unlink(absolutePath).catch(() => {});
          } catch {
            migratedImages.push(imagePath);
          }
        }

        if (changed) {
          book.images = migratedImages;
          await book.save();
        }
      }
    })().catch((err) => {
      console.warn('Legacy book image migration skipped:', err?.message || err);
    });
  }

  return legacyImageMigrationPromise;
}

let mailTransportPromise;

function firstDefinedEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function getSmtpConfig() {
  const transportUrl = firstDefinedEnv('SMTP_URL', 'MAIL_URL', 'EMAIL_URL');
  if (transportUrl) return { transportUrl };

  // Previous hardcoded fallback credentials (commented out: blocked on Render free tier):
  // const user = firstDefinedEnv('SMTP_USER', 'EMAIL_USER', 'GMAIL_USER', 'MAIL_USER') || 'ezazmdrk3929@gmail.com';
  // const pass = firstDefinedEnv('SMTP_PASS', 'EMAIL_PASS', 'GMAIL_PASS', 'MAIL_PASS', 'GMAIL_APP_PASSWORD') || 'khvbcrgfphybpxgx';

  const user = firstDefinedEnv('SMTP_USER', 'EMAIL_USER', 'GMAIL_USER', 'MAIL_USER');
  const pass = firstDefinedEnv('SMTP_PASS', 'EMAIL_PASS', 'GMAIL_PASS', 'MAIL_PASS', 'GMAIL_APP_PASSWORD');
  const service = firstDefinedEnv('SMTP_SERVICE', 'EMAIL_SERVICE', 'MAIL_SERVICE') || 'gmail';
  const host = firstDefinedEnv('SMTP_HOST', 'EMAIL_HOST', 'MAIL_HOST') || 'smtp.gmail.com';
  const port = Number(firstDefinedEnv('SMTP_PORT', 'EMAIL_PORT', 'MAIL_PORT') || 465);
  const secure = String(firstDefinedEnv('SMTP_SECURE', 'EMAIL_SECURE') || 'true') === 'true';

  return { user, pass, service, host, port, secure };
}

function hasSmtpConfig() {
  const config = getSmtpConfig();
  if (config.transportUrl) return true;
  return Boolean(config.user && config.pass);
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeout
  ]);
}

async function getMailTransporter() {
  if (!mailTransportPromise) {
    mailTransportPromise = (async () => {
      const config = getSmtpConfig();

      if (config.transportUrl) {
        return nodemailer.createTransport(config.transportUrl);
      }

      if (config.user && config.pass) {
        let transportOptions;

        if (config.service && config.service.toLowerCase() === 'gmail') {
          transportOptions = {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: { user: config.user, pass: config.pass },
            tls: { rejectUnauthorized: false },
            family: 4, // 👈 Force IPv4 to fix ENETUNREACH on Render/Cloud hosts
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000
          };
        } else {
          transportOptions = {
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: { user: config.user, pass: config.pass },
            tls: { rejectUnauthorized: false },
            family: 4,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000
          };
        }

        return nodemailer.createTransport(transportOptions);
      }

      throw new Error('Mail is not configured.');
    })().catch((err) => {
      mailTransportPromise = null;
      throw err;
    });
  }

  return mailTransportPromise;
}

function renderVerificationPage(title, message) {
  const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://swaptome.vercel.app';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f5f0e8; color: #1a1208; }
    .card { background: #fff; padding: 32px 28px; border-radius: 18px; box-shadow: 0 18px 45px rgba(26,18,8,.12); max-width: 520px; width: calc(100% - 32px); text-align: center; }
    h1 { margin: 0 0 12px; font-size: 28px; }
    p { margin: 0; line-height: 1.6; color: #53493c; }
    a { display: inline-block; margin-top: 20px; color: #fff; background: #e8820c; padding: 12px 18px; border-radius: 12px; text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${clientUrl}">Go to app</a>
  </div>
</body>
</html>`;
}

async function sendUnifiedEmail({ to, subject, html, text, fromName = 'SwapToMe' }) {
  const brevoApiKey = firstDefinedEnv('BREVO_API_KEY', 'SENDINBLUE_API_KEY');
  const resendApiKey = firstDefinedEnv('RESEND_API_KEY');
  const fromEmail = firstDefinedEnv('MAIL_FROM', 'SMTP_USER', 'EMAIL_USER', 'GMAIL_USER') || 'ezazmdrk3929@gmail.com';

  // 1. Try Brevo HTTPS REST API (Port 443 - Never blocked on Render)
  if (brevoApiKey) {
    console.log(`[Email] Sending via Brevo REST API (HTTPS) to ${to}...`);
    const res = await withTimeout(
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text || undefined
        })
      }),
      8000,
      'Brevo API request timed out'
    );
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Brevo API Error (${res.status}): ${errBody}`);
    }
    const data = await res.json();
    console.log(`[Email] ✅ Sent via Brevo API! MessageId: ${data.messageId || 'ok'}`);
    return { success: true, provider: 'brevo', info: data };
  }

  // 2. Try Resend HTTPS REST API (Port 443 - Never blocked on Render)
  if (resendApiKey) {
    console.log(`[Email] Sending via Resend REST API (HTTPS) to ${to}...`);
    const resendFrom = firstDefinedEnv('RESEND_FROM', 'MAIL_FROM_RESEND') || `${fromName} <onboarding@resend.dev>`;
    const recipients = Array.isArray(to) ? to : [String(to).trim()];

    const res = await withTimeout(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendFrom,
          to: recipients,
          subject,
          html,
          text: text || undefined
        })
      }),
      8000,
      'Resend API request timed out'
    );

    if (!res.ok) {
      const errBody = await res.text();
      let errorMsg = errBody;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.message) errorMsg = parsed.message;
      } catch (_) {}
      throw new Error(`Resend API Error (${res.status}): ${errorMsg}`);
    }

    const data = await res.json();
    console.log(`[Email] ✅ Sent via Resend API! ID: ${data.id || 'ok'}`);
    return { success: true, provider: 'resend', info: data };
  }

  // 3. Fallback to Nodemailer SMTP (e.g. Gmail for local development)
  if (hasSmtpConfig()) {
    console.log(`[Email] Sending via SMTP to ${to}...`);
    const transporter = await getMailTransporter();
    const info = await withTimeout(
      transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
        text
      }),
      8000,
      'SMTP connection timed out (Render blocks standard SMTP ports 465/587 on free tier; add RESEND_API_KEY or BREVO_API_KEY in Render for instant HTTP email delivery)'
    );
    console.log(`[Email] ✅ Sent via SMTP! MessageId: ${info.messageId}`);
    return { success: true, provider: 'smtp', info };
  }

  throw new Error('Email service is not configured. Set RESEND_API_KEY or BREVO_API_KEY in environment variables.');
}

async function sendVerificationEmail(user, verifyToken, otp) {
  const verifyLink = `${getAppBaseUrl()}/api/auth/verify/${verifyToken}`;

  try {
    const result = await sendUnifiedEmail({
      to: user.email,
      subject: 'Verify Your Email - SwapToMe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #e8820c; margin-top: 0;">SwapToMe Email Verification</h2>
          <p>Hi <strong>${user.name || 'there'}</strong>,</p>
          <p>Thank you for signing up on SwapToMe! Please click the button below to verify your email address:</p>
          <p style="margin: 24px 0;">
            <a href="${verifyLink}" style="display:inline-block;padding:14px 24px;background:#e8820c;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">Verify My Account</a>
          </p>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #888; font-size: 13px; word-break: break-all;">${verifyLink}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    });

    return { info: result.info, verifyLink };
  } catch (error) {
    console.error(`[Email] ❌ Verification email failed for ${user.email}:`, error?.message || error);
    mailTransportPromise = null;
    return { skipped: true, reason: error?.message || 'Verification email send failed', verifyLink, otp };
  }
}

async function sendPasswordResetEmail(user, resetToken) {
  const resetLink = `${getAppBaseUrl()}/api/auth/reset-password/${resetToken}`;

  try {
    const result = await sendUnifiedEmail({
      to: user.email,
      subject: 'Reset Your Password - SwapToMe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #e8820c; margin-top: 0;">Password Reset Request</h2>
          <p>Hi <strong>${user.name || 'there'}</strong>,</p>
          <p>We received a request to reset your SwapToMe password. Click the button below to set a new password:</p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}" style="display:inline-block;padding:14px 24px;background:#e8820c;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">Reset Password</a>
          </p>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #888; font-size: 13px; word-break: break-all;">${resetLink}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `
    });

    return { info: result.info, resetLink };
  } catch (error) {
    console.error(`[Email] ❌ Password reset email failed for ${user.email}:`, error?.message || error);
    mailTransportPromise = null;
    return { skipped: true, reason: error?.message || 'Password reset email send failed', resetLink };
  }
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows, headers) {
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(','))
  ].join('\n');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function getRiskScore(text) {
  const spamWords = ['cheap', 'urgent', 'fake', 'pirated', 'hack', 'abuse', 'scam', 'duplicate'];
  const normalized = normalizeText(text);
  let score = 0;
  spamWords.forEach((word) => {
    if (normalized.includes(word)) score += 18;
  });
  if (normalized.length > 120) score += 10;
  if ((normalized.match(/\d/g) || []).length > 8) score += 10;
  return Math.min(score, 100);
}

function getUserRiskScore(userDoc) {
  let score =
    (userDoc?.reportCount || 0) * 20 +
    (userDoc?.blocked ? 40 : 0) +
    (userDoc?.shadowBanned ? 25 : 0);

  const createdAt = userDoc?.createdAt ? new Date(userDoc.createdAt) : null;
  if (createdAt && Number.isFinite(createdAt.getTime())) {
    const accountAgeHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (accountAgeHours < 24) score += 10;
    if (accountAgeHours < 6) score += 10;
  }

  if (userDoc?.authProvider === 'google') score += 2;

  return Math.min(100, score);
}

async function logAdminAction(adminEmail, action, targetType, targetId, meta = {}, ip = '') {
  try {
    await AdminLog.create({ adminEmail, action, targetType, targetId, meta, ip });
  } catch (err) {
    console.warn('Admin log save failed', err?.message || err);
  }
}

function socketPayloadCounts() {
  return {
    onlineUsers: onlineUsers.size,
    activeChats: activeRooms.size,
    ongoingDeals: pendingDeals.size
  };
}

function emitLiveStats() {
  io.emit('liveStatsUpdate', socketPayloadCounts());
}

app.use(express.json());
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use("/uploads", express.static("uploads"));

// ✅ BOOK MODEL (FIX)




// ✅ TEST
app.get("/", (req, res) => {
  res.send("API running ✅");
});

// 🔥 SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  try {
    let { name, email, college, location, password } = req.body;

    email = String(email || '').toLowerCase().trim();
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified === false) {
        existingUser.name = name;
        existingUser.college = college;
        existingUser.location = location;
        existingUser.authProvider = 'manual';
        existingUser.signupProvider = 'manual';
        existingUser.lastLoginProvider = 'manual';
        existingUser.verifyToken = verifyToken;
        existingUser.verifyTokenExpiresAt = verifyTokenExpiresAt;
        await existingUser.save();
        const sendResult = await sendVerificationEmail(existingUser, verifyToken);
        return res.json({
          message: sendResult?.skipped
            ? (sendResult?.reason && sendResult.reason !== 'SMTP is not configured'
                ? `Email delivery failed (${sendResult.reason}). Open this link to verify: ${sendResult.verifyLink}`
                : `Verification link generated but email service is not configured. Open this link to verify: ${sendResult.verifyLink}`)
            : "Verification link sent to your email ✅",
          verificationLink: sendResult?.verifyLink
        });
      }

      return res.status(400).json({ message: "Email already registered ❌" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      college,
      location,
      password: hashedPassword,
      authProvider: 'manual',
      signupProvider: 'manual',
      lastLoginProvider: 'manual',
      isVerified: false,
      verifyToken,
      verifyTokenExpiresAt,
    });

    const sendResult = await sendVerificationEmail(user, verifyToken);

    res.json({
      success: true,
      message: sendResult?.skipped
        ? (sendResult?.reason && sendResult.reason !== 'SMTP is not configured'
            ? `Email delivery failed (${sendResult.reason}). Open this link to verify: ${sendResult.verifyLink}`
            : `Verification link generated but email service is not configured. Open this link to verify: ${sendResult.verifyLink}`)
        : "Verification link sent to your email ✅",
      verificationLink: sendResult?.verifyLink
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err?.message || "Server error ❌" });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const now = new Date().toISOString();
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: name || email.split('@')[0],
        email,
        password: '',
        role: adminEmails.includes(email) ? 'admin' : 'user',
        isVerified: true,
        verificationStatus: 'approved',
        collegeVerified: false,
        authProvider: 'google',
        signupProvider: 'google',
        lastLoginProvider: 'google',
        lastLoginAt: now
      });
    } else {
      // Ensure existing admin users keep role; otherwise default remains
      if (!user.role) user.role = adminEmails.includes(email) ? 'admin' : 'user';
      user.name = name || user.name;
      user.isVerified = true;
      user.verificationStatus = 'approved';
      user.authProvider = 'google';
      if (!user.signupProvider) user.signupProvider = 'google';
      user.lastLoginProvider = 'google';
      user.lastLoginAt = now;
    }

    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

    res.json({ message: 'Google login successful', token, name: user.name, role: user.role, email: user.email });
  } catch (err) {
    console.error('Google auth error', err);
    res.status(500).json({ message: 'Server error ❌' });
  }
});

// 🔐 LOGIN (IMPORTANT FIX ROUTE)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.json({ message: "User not found ❌" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ message: "Wrong password ❌" });

    if (user.blocked) return res.status(403).json({ message: "Account blocked" });

    if (user.role !== 'admin' && user.isVerified === false) {
      return res.status(400).json({ message: "Please verify your email first" });
    }

    user.lastLoginAt = new Date().toISOString();
    user.lastLoginIp = req.ip;
    user.lastLoginProvider = 'manual';
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

    res.json({ message: 'Login successful', token, name: user.name, role: user.role, email: user.email });

  } catch (err) {
    res.status(500).json({ message: "Server error ❌" });
  }
});

app.get('/api/auth/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verifyToken: req.params.token,
      verifyTokenExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).send(renderVerificationPage('Invalid link', 'This verification link is invalid or has expired.'));
    }

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiresAt = undefined;
    user.verificationStatus = 'approved';
    await user.save();

    res.send(renderVerificationPage('Email verified successfully', 'Your account is now active. You can log in from the app.'));
  } catch (err) {
    console.error('Email verification error', err);
    res.status(500).send(renderVerificationPage('Verification failed', 'Something went wrong while verifying your email.'));
  }
});

app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If that email exists, a verification link has been sent ✅' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Email is already verified ✅' });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.verifyToken = verifyToken;
    user.verifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const sendResult = await sendVerificationEmail(user, verifyToken);

    return res.json({
      message: sendResult?.skipped
        ? (sendResult?.reason && sendResult.reason !== 'SMTP is not configured'
            ? `Email delivery failed (${sendResult.reason}). Open this link to verify: ${sendResult.verifyLink}`
            : `Verification link generated but email service is not configured on the server. Open this link to verify: ${sendResult.verifyLink}`)
        : 'Verification link resent ✅',
      skipped: !!sendResult?.skipped,
      verificationLink: sendResult?.verifyLink
    });
  } catch (err) {
    console.error('Resend verification error', err);
    res.status(500).json({ message: err?.message || 'Server error ❌' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      const sendResult = await sendPasswordResetEmail(user, resetToken);

      return res.json({
        message: sendResult?.skipped
          ? (sendResult?.reason && sendResult.reason !== 'SMTP is not configured'
              ? `Email delivery failed (${sendResult.reason}). Open this link to reset password:`
              : 'Password reset link generated. Email service is not configured on the server.')
          : 'If that email exists, a reset link has been sent ✅',
        skipped: !!sendResult?.skipped,
        resetLink: sendResult?.resetLink
      });
    }

    res.json({ message: 'If that email exists, a reset link has been sent ✅' });
  } catch (err) {
    console.error('Forgot password error', err);
    res.status(500).json({ message: err?.message || 'Server error ❌' });
  }
});

app.get('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).send(renderVerificationPage('Invalid link', 'This password reset link is invalid or has expired.'));
    }

    res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reset Password</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f5f0e8; color: #1a1208; }
    .card { background: #fff; padding: 32px 28px; border-radius: 18px; box-shadow: 0 18px 45px rgba(26,18,8,.12); max-width: 520px; width: calc(100% - 32px); }
    h1 { margin: 0 0 12px; }
    label { display:block; margin: 14px 0 6px; font-weight: 700; }
    input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid #d4cdb8; }
    button { margin-top: 18px; width: 100%; padding: 12px 14px; border: none; border-radius: 12px; background: #e8820c; color: #fff; font-weight: 700; cursor: pointer; }
    p { color: #53493c; line-height: 1.6; }
    .msg { margin-top: 14px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Reset Password</h1>
    <p>Set a new password for your account.</p>
    <label>New Password</label>
    <input id="password" type="password" placeholder="New password">
    <label>Confirm Password</label>
    <input id="confirmPassword" type="password" placeholder="Confirm password">
    <button id="submitBtn">Update Password</button>
    <div class="msg" id="msg"></div>
  </div>
  <script>
    const msg = document.getElementById('msg');
    document.getElementById('submitBtn').addEventListener('click', async () => {
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      if (!password || password.length < 6) {
        msg.textContent = 'Password must be at least 6 characters.';
        return;
      }
      if (password !== confirmPassword) {
        msg.textContent = 'Passwords do not match.';
        return;
      }
      const res = await fetch(window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword })
      });
      const data = await res.json().catch(() => ({}));
      msg.textContent = data.message || (res.ok ? 'Password updated successfully.' : 'Unable to update password.');
      if (res.ok) setTimeout(() => window.location.href = '${getAppBaseUrl()}', 1200);
    });
  </script>
</body>
</html>`);
  } catch (err) {
    console.error('Reset password page error', err);
    res.status(500).send(renderVerificationPage('Reset failed', 'Something went wrong while loading the reset form.'));
  }
});

app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    res.json({ message: 'Password reset successful ✅' });
  } catch (err) {
    console.error('Reset password error', err);
    res.status(500).json({ message: 'Server error ❌' });
  }
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token ❌" });

  try {
    const decoded = jwt.verify(token.replace(/^Bearer\s+/i, ''), getJwtSecret());
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token ❌" });
  }
}

// 📚 ADD BOOK
async function createBook(req, res) {
  try {
    console.log("FILES:", req.files);

    const uploader = req.user?.userId ? await User.findById(req.user.userId) : null;
    if (!uploader) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (uploader.blocked) {
      return res.status(403).json({ success: false, error: 'Account blocked' });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const imageUrls = [];

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "books"
      });

      imageUrls.push(result.secure_url || result.url || file.path);

      await fs.unlink(file.path).catch(() => {});
    }

    const book = new Book({
      title: req.body.title,
      author: req.body.author || req.body.writer || uploader.name,
      writer: req.body.writer || req.body.author || uploader.name,
      price: req.body.price,
      seller: uploader.name || req.body.seller,
      uploaderEmail: uploader.email || req.body.uploaderEmail || req.body.email || '',
      category: req.body.category,
      location: req.body.location,
      images: imageUrls
    });

    await book.save();

    res.json({
      success: true,
      book
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

app.post(
  "/add-book",
  authMiddleware,
  upload.array("images", 5),
  createBook
);

app.post(
  "/api/add-book",
  authMiddleware,
  upload.array("images", 5),
  createBook
);

// 📚 GET BOOKS
async function listBooks(req, res) {
  await migrateLegacyBookImages();

  const moderatedUsers = await User.find({ $or: [{ shadowBanned: true }, { blocked: true }] }).select('name email');
  const moderatedNames = new Set(moderatedUsers.map((user) => String(user.name || '').trim().toLowerCase()).filter(Boolean));
  const moderatedEmails = new Set(moderatedUsers.map((user) => String(user.email || '').trim().toLowerCase()).filter(Boolean));
  const books = await Book.find();
  const visibleBooks = books
    .filter((book) => {
      const sellerName = String(book.seller || '').trim().toLowerCase();
      const uploaderEmail = String(book.uploaderEmail || book.email || '').trim().toLowerCase();
      return !moderatedNames.has(sellerName) && !moderatedEmails.has(uploaderEmail);
    })
    .sort((a, b) => {
      const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      if (featuredDelta !== 0) return featuredDelta;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  res.json(visibleBooks);
  }

  app.get("/books", listBooks);
  app.get("/api/books", listBooks);

  async function deleteBook(req, res) {
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
}

app.delete("/books/:id", deleteBook);
app.delete("/api/books/:id", deleteBook);

async function updateBookPrice(req, res) {
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
}

app.put("/books/:id/price", updateBookPrice);
app.put("/api/books/:id/price", updateBookPrice);

// 📊 STATS
app.get("/stats", async (req, res) => {
  const usersCount = await User.countDocuments();
  const booksCount = await Book.countDocuments();

  res.json({ users: usersCount, books: booksCount, saved: booksCount * 200 });
});

app.post('/reports', async (req, res) => {
  try {
    const { type, targetId, targetLabel, reporterName, reporterEmail, reason, details, createdBy } = req.body;
    if (!type || !reason) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const riskScore = getRiskScore([type, targetLabel, reason, details].join(' '));
    const report = await Report.create({
      type,
      targetId,
      targetLabel,
      reporterName,
      reporterEmail,
      reason,
      details,
      createdBy,
      riskScore
    });

    if (type === 'book' && targetId) {
      await Book.findByIdAndUpdate(targetId, { $inc: { reportCount: 1, suspiciousScore: riskScore } });
    }

    if (type === 'user' && targetId) {
      const userDoc = await User.findById(targetId);
      if (userDoc) {
        userDoc.reportCount = (userDoc.reportCount || 0) + 1;
        userDoc.riskScore = getUserRiskScore(userDoc);
        await userDoc.save();
      }
    }

    if (type === 'chat' && targetId) {
      await Message.findByIdAndUpdate(targetId, { moderatedStatus: 'pending', flaggedReason: reason });
    }

    res.json({ message: 'Report submitted', report });
  } catch (err) {
    console.error('Create report error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/feedback', async (req, res) => {
  try {
    const { type = 'feedback', category = '', rating = 0, name = '', email = '', pageUrl = '', targetType = '', targetLabel = '', message = '' } = req.body;
    const trimmedMessage = String(message || '').trim();
    if (!trimmedMessage) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const entry = await Feedback.create({
      type: String(type || 'feedback').trim().toLowerCase(),
      category: String(category || '').trim(),
      rating: Number(rating) || 0,
      name: String(name || '').trim(),
      email: String(email || '').trim(),
      pageUrl: String(pageUrl || '').trim(),
      targetType: String(targetType || '').trim(),
      targetLabel: String(targetLabel || '').trim(),
      message: trimmedMessage
    });

    res.json({ message: 'Feedback submitted', feedback: entry });
  } catch (err) {
    console.error('Feedback submit error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- JWT ADMIN MIDDLEWARE ---
function adminMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  
  // Admin does not need token - allow access without one
  if (!token) {
    req.admin = { userId: 'admin', role: 'admin', email: 'admin' };
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'secretkey123';
    const decoded = jwt.verify(token, secret);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// ADMIN: create an audit log entry helper route (used by admin actions)
async function adminAction(req, action, targetType, targetId, meta = {}) {
  const adminEmail = req.admin?.email || req.admin?.userId || 'admin';
  await logAdminAction(adminEmail, action, targetType, targetId, meta, req.ip);
}

// ADMIN: list all books
app.get('/admin/books', adminMiddleware, async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json({ books });
  } catch (err) {
    console.error('Admin list books error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: delete any book
app.delete('/admin/books/:id', adminMiddleware, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    await Book.findByIdAndDelete(req.params.id);
    await adminAction(req, 'delete_book', 'book', req.params.id, { title: book.title, seller: book.seller });
    res.json({ message: 'Book deleted by admin' });
  } catch (err) {
    console.error('Admin delete book error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: list users
app.get('/admin/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error('Admin list users error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/users/:id/profile', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -verifyToken -verifyTokenExpiresAt -resetPasswordToken -resetPasswordExpiresAt');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [books, reports, deals, messages] = await Promise.all([
      Book.find({ seller: new RegExp(`^${String(user.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).sort({ createdAt: -1 }).limit(20),
      Report.find({ $or: [{ reporterEmail: user.email }, { createdBy: user.email }, { targetLabel: new RegExp(String(user.name || ''), 'i') }] }).sort({ createdAt: -1 }).limit(20),
      DealVerification.find({ $or: [{ buyer: user.name }, { seller: user.name }] }).sort({ createdAt: -1 }).limit(20),
      Message.find({ $or: [{ sender: user.name }, { receiver: user.name }] }).sort({ createdAt: -1 }).limit(20)
    ]);

    res.json({
      user,
      books,
      reports,
      deals,
      messages,
      summary: {
        books: books.length,
        reports: reports.length,
        deals: deals.length,
        messages: messages.length
      }
    });
  } catch (err) {
    console.error('Admin user profile error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: block/unblock user
app.put('/admin/users/:id/block', adminMiddleware, async (req, res) => {
  try {
    const { block } = req.body; // true/false
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.blocked = !!block;
    await user.save();
    await adminAction(req, block ? 'block_user' : 'unblock_user', 'user', req.params.id, { email: user.email });
    res.json({ message: `User ${block ? 'blocked' : 'unblocked'}` });
  } catch (err) {
    console.error('Admin block user error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin/users/:id/shadowban', adminMiddleware, async (req, res) => {
  try {
    const { shadowBanned } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.shadowBanned = !!shadowBanned;
    await user.save();
    await adminAction(req, shadowBanned ? 'shadowban_user' : 'unshadowban_user', 'user', req.params.id, { email: user.email });
    res.json({ message: `User ${shadowBanned ? 'shadow banned' : 'restored'}` });
  } catch (err) {
    console.error('Admin shadowban error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: enhanced stats (users, books, deals)
app.get('/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const booksCount = await Book.countDocuments();
    const dealsCount = await DealVerification.countDocuments();
    const reportsCount = await Report.countDocuments();
    const messagesCount = await Message.countDocuments();
    res.json({ users: usersCount, books: booksCount, deals: dealsCount, reports: reportsCount, messages: messagesCount });
  } catch (err) {
    console.error('Admin stats error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/reports', adminMiddleware, async (req, res) => {
  try {
    const status = String(req.query.status || 'pending');
    const reports = await Report.find(status === 'all' ? {} : { status }).sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    console.error('Admin reports error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/admin/reports/:id/resolve', adminMiddleware, async (req, res) => {
  try {
    const { action = 'resolved', adminNote = '' } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.status = action;
    report.adminAction = adminNote || action;
    await report.save();
    await adminAction(req, 'resolve_report', 'report', req.params.id, { action, adminNote });
    res.json({ message: 'Report updated', report });
  } catch (err) {
    console.error('Resolve report error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/deals', adminMiddleware, async (req, res) => {
  try {
    const status = String(req.query.status || 'all');
    const completedDeals = await DealVerification.find(status === 'all' || status === 'pending' ? {} : { status }).sort({ createdAt: -1 });
    const pending = Array.from(pendingDeals.values()).map((deal) => ({ ...deal, status: 'pending', id: deal.roomId }));
    const failed = await DealVerification.find({ status: 'failed' }).sort({ createdAt: -1 });
    const combined = []
      .concat(status === 'all' || status === 'completed' ? completedDeals.filter((deal) => deal.status !== 'failed') : [])
      .concat(status === 'all' || status === 'pending' ? pending : [])
      .concat(status === 'all' || status === 'failed' ? failed : []);
    res.json({ deals: combined });
  } catch (err) {
    console.error('Admin deals error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/admin/deals/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const deal = await DealVerification.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    deal.status = status || deal.status;
    await deal.save();
    await adminAction(req, 'update_deal_status', 'deal', req.params.id, { status });
    res.json({ message: 'Deal updated', deal });
  } catch (err) {
    console.error('Admin deal status error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/search', adminMiddleware, async (req, res) => {
  try {
    const type = String(req.query.type || 'all');
    const q = String(req.query.q || '').trim();
    const regex = new RegExp(q, 'i');
    const results = {};
    if (type === 'all' || type === 'user') results.users = q ? await User.find({ $or: [{ email: regex }, { name: regex }, { college: regex }, { location: regex }] }).limit(20) : [];
    if (type === 'all' || type === 'book') results.books = q ? await Book.find({ $or: [{ title: regex }, { writer: regex }, { seller: regex }, { category: regex }, { location: regex }] }).limit(20) : [];
    if (type === 'all' || type === 'deal') {
      const dealQuery = q && mongoose.Types.ObjectId.isValid(q)
        ? { $or: [{ _id: q }, { roomId: regex }, { code: regex }] }
        : { $or: [{ roomId: regex }, { code: regex }] };
      results.deals = q ? await DealVerification.find(dealQuery).limit(20) : [];
    }
    if (type === 'all' || type === 'report') results.reports = q ? await Report.find({ $or: [{ reason: regex }, { targetLabel: regex }] }).limit(20) : [];
    if (type === 'all' || type === 'feedback') results.feedback = q ? await Feedback.find({ $or: [{ category: regex }, { message: regex }, { name: regex }, { email: regex }] }).limit(20) : [];
    res.json(results);
  } catch (err) {
    console.error('Admin search error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/analytics', adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const last7 = new Date(now);
    last7.setDate(now.getDate() - 6);

    const books = await Book.find({ createdAt: { $gte: last7 } });
    const deals = await DealVerification.find({ createdAt: { $gte: last7 } });
    const users = await User.find();
    const messages = await Message.find({ createdAt: { $gte: last7 } });

    const perDay = {};
    const dayLabel = (dt) => new Date(dt).toLocaleDateString('en-US', { weekday: 'short' });
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      perDay[d.toDateString()] = { label: d.toLocaleDateString('en-US', { weekday: 'short' }), books: 0, deals: 0, messages: 0, users: 0 };
    }
    books.forEach((b) => { const key = new Date(b.createdAt).toDateString(); if (perDay[key]) perDay[key].books += 1; });
    deals.forEach((d) => { const key = new Date(d.createdAt).toDateString(); if (perDay[key]) perDay[key].deals += 1; });
    messages.forEach((m) => { const key = new Date(m.createdAt).toDateString(); if (perDay[key]) perDay[key].messages += 1; });
    users.forEach((u) => { if (u.lastLoginAt) { const key = new Date(u.lastLoginAt).toDateString(); if (perDay[key]) perDay[key].users += 1; } });

    const categories = {};
    books.forEach((b) => { const c = b.category || 'Uncategorized'; categories[c] = (categories[c] || 0) + 1; });

    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, value: 0 }));
    messages.forEach((m) => { const hour = new Date(m.createdAt).getHours(); hourly[hour].value += 1; });

    const activeUsers = onlineUsers.size;
    const completedDeals = deals.filter((d) => (d.status || 'completed') === 'completed').length;

    res.json({
      daily: Object.values(perDay).map((item) => ({ name: item.label, books: item.books, deals: item.deals, messages: item.messages, users: item.users })),
      topCategories: Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10),
      heatmap: hourly,
      activeUsers,
      successfulDeals: completedDeals,
      booksUploaded: books.length,
      totalMessages: messages.length,
      topUsers: await Promise.all(users.slice(0, 20).map(async (user) => ({ name: user.name, email: user.email, riskScore: getUserRiskScore(user), blocked: user.blocked, shadowBanned: user.shadowBanned })))
    });
  } catch (err) {
    console.error('Admin analytics error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/live', adminMiddleware, (req, res) => {
  res.json({
    onlineUsers: Array.from(onlineUsers.keys()),
    activeChats: Array.from(activeRooms.values()),
    ongoingDeals: Array.from(pendingDeals.values())
  });
});

app.get('/admin/leaderboard', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    const books = await Book.find();
    const leaderboard = users.map((user) => ({
      name: user.name,
      email: user.email,
      score: (user.reportCount || 0) * -15 + (user.blocked ? -40 : 0) + (user.shadowBanned ? -20 : 0) + (books.filter((book) => (book.seller || '').trim() === (user.name || '').trim()).length * 10)
    })).sort((a, b) => b.score - a.score).slice(0, 10);
    res.json({ leaderboard });
  } catch (err) {
    console.error('Leaderboard error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/fraud-scores', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    const books = await Book.find();
    const flaggedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      riskScore: getUserRiskScore(user),
      blocked: user.blocked,
      shadowBanned: user.shadowBanned,
      authProvider: user.authProvider || 'manual',
      signupProvider: user.signupProvider || 'manual',
      signupAt: user.createdAt,
      lastLoginProvider: user.lastLoginProvider || 'manual',
      lastLoginAt: user.lastLoginAt
    })).sort((a, b) => b.riskScore - a.riskScore).slice(0, 20);
    const flaggedBooks = books.map((book) => ({
      _id: book._id,
      title: book.title,
      seller: book.seller,
      suspiciousScore: book.suspiciousScore || 0,
      reviewStatus: book.reviewStatus || 'pending'
    })).sort((a, b) => b.suspiciousScore - a.suspiciousScore).slice(0, 20);
    res.json({ flaggedUsers, flaggedBooks });
  } catch (err) {
    console.error('Fraud score error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/feedback', adminMiddleware, async (req, res) => {
  try {
    const status = String(req.query.status || 'all');
    const items = await Feedback.find(status === 'all' ? {} : { status }).sort({ createdAt: -1 });
    res.json({ feedback: items });
  } catch (err) {
    console.error('Admin feedback error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/admin/feedback/:id/resolve', adminMiddleware, async (req, res) => {
  try {
    const { status = 'resolved', adminNote = '' } = req.body;
    const entry = await Feedback.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Feedback not found' });
    entry.status = status;
    entry.adminNote = adminNote;
    await entry.save();
    await adminAction(req, 'resolve_feedback', 'feedback', req.params.id, { status, adminNote });
    res.json({ message: 'Feedback updated', feedback: entry });
  } catch (err) {
    console.error('Resolve feedback error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/admin/feedback/:id', adminMiddleware, async (req, res) => {
  try {
    const entry = await Feedback.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Feedback not found' });
    await Feedback.findByIdAndDelete(req.params.id);
    await adminAction(req, 'delete_feedback', 'feedback', req.params.id, { category: entry.category, type: entry.type });
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    console.error('Delete feedback error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin/notifications', adminMiddleware, async (req, res) => {
  try {
    const { title, message, important = false } = req.body;
    const notification = { title, message, important: !!important, createdAt: new Date().toISOString() };
    io.emit('adminNotification', notification);
    await adminAction(req, 'broadcast_notification', 'notification', title || 'broadcast', { title, message, important: !!important });
    res.json({ message: 'Notification broadcasted', notification });
  } catch (err) {
    console.error('Broadcast notification error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/notifications/latest', async (req, res) => {
  try {
    const latest = await AdminLog.findOne({ action: 'broadcast_notification' }).sort({ createdAt: -1 });
    if (!latest) return res.json({ notification: null });
    res.json({
      notification: {
        title: latest.meta?.title || latest.targetId || 'Broadcast',
        message: latest.meta?.message || '',
        important: !!latest.meta?.important,
        createdAt: latest.createdAt
      }
    });
  } catch (err) {
    console.error('Latest notification error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/notifications/history', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const notifications = await AdminLog.find({ action: 'broadcast_notification' })
      .sort({ createdAt: 1 })
      .limit(limit);

    res.json({
      notifications: notifications.map((item) => ({
        title: item.meta?.title || item.targetId || 'Broadcast',
        message: item.meta?.message || '',
        important: !!item.meta?.important,
        createdAt: item.createdAt,
        adminEmail: item.adminEmail
      }))
    });
  } catch (err) {
    console.error('Broadcast history error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin/announcements', adminMiddleware, async (req, res) => {
  try {
    const { title, message, active = true } = req.body;
    const announcement = await Announcement.create({ title, message, active, createdBy: req.admin?.userId });
    io.emit('announcementUpdated', announcement);
    await adminAction(req, 'sticky_announcement', 'announcement', announcement._id.toString(), { title, active });
    res.json({ message: 'Announcement saved', announcement });
  } catch (err) {
    console.error('Announcement error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/announcements/active', async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ active: true }).sort({ createdAt: -1 });
    res.json({ announcement: announcement || null });
  } catch (err) {
    console.error('Announcement fetch error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin/books/:id/feature', adminMiddleware, async (req, res) => {
  try {
    const { featured } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    book.featured = String(featured || '').trim();
    await book.save();
    await adminAction(req, 'feature_book', 'book', req.params.id, { featured: book.featured, title: book.title });
    res.json({ message: 'Book updated', book });
  } catch (err) {
    console.error('Feature book error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/admin/books/:id/review', adminMiddleware, async (req, res) => {
  try {
    const { reviewStatus = 'approved' } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    book.reviewStatus = reviewStatus;
    await book.save();
    await adminAction(req, 'review_book_image', 'book', req.params.id, { reviewStatus });
    res.json({ message: 'Book review updated', book });
  } catch (err) {
    console.error('Book review error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/admin/users/:id/verification', adminMiddleware, async (req, res) => {
  try {
    const { verificationStatus = 'approved', collegeVerified = true } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.verificationStatus = verificationStatus;
    user.collegeVerified = !!collegeVerified;
    await user.save();
    await adminAction(req, 'college_verification', 'user', req.params.id, { verificationStatus, collegeVerified });
    res.json({ message: 'Verification updated', user });
  } catch (err) {
    console.error('Verification error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin/users/:id/logout', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    io.to(user.name).emit('forceLogout', { reason: 'Admin forced logout' });
    await adminAction(req, 'force_logout', 'user', req.params.id, { email: user.email });
    res.json({ message: 'Logout signal sent' });
  } catch (err) {
    console.error('Force logout error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/export/:resource', adminMiddleware, async (req, res) => {
  try {
    const resource = String(req.params.resource || '').toLowerCase();
    let rows = [];
    let headers = [];
    if (resource === 'users') {
      const users = await User.find();
      headers = ['name', 'email', 'blocked', 'shadowBanned', 'role', 'collegeVerified', 'verificationStatus'];
      rows = users.map((u) => ({ name: u.name, email: u.email, blocked: u.blocked, shadowBanned: u.shadowBanned, role: u.role, collegeVerified: u.collegeVerified, verificationStatus: u.verificationStatus }));
    } else if (resource === 'books') {
      const books = await Book.find();
      headers = ['title', 'seller', 'category', 'price', 'featured', 'reviewStatus', 'reportCount'];
      rows = books.map((b) => ({ title: b.title, seller: b.seller, category: b.category, price: b.price, featured: b.featured, reviewStatus: b.reviewStatus, reportCount: b.reportCount }));
    } else if (resource === 'deals') {
      const deals = await DealVerification.find();
      headers = ['roomId', 'buyer', 'seller', 'price', 'status', 'code', 'confirmedAt'];
      rows = deals.map((d) => ({ roomId: d.roomId, buyer: d.buyer, seller: d.seller, price: d.price, status: d.status, code: d.code, confirmedAt: d.confirmedAt }));
    } else if (resource === 'reports') {
      const reports = await Report.find();
      headers = ['type', 'targetLabel', 'reporterName', 'reason', 'status', 'riskScore'];
      rows = reports.map((r) => ({ type: r.type, targetLabel: r.targetLabel, reporterName: r.reporterName, reason: r.reason, status: r.status, riskScore: r.riskScore }));
    } else {
      return res.status(400).json({ message: 'Unknown resource' });
    }

    const csv = toCsv(rows, headers);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${resource}.csv`);
    res.send(csv);
    await adminAction(req, 'export_csv', resource, resource, { count: rows.length });
  } catch (err) {
    console.error('Export error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create admin user (one-time) - protected by ADMIN_SECRET env
app.post('/api/auth/create-admin', async (req, res) => {
  try {
    const secret = req.headers['x-admin-secret'] || req.query.admin_secret;
    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'adminsecret';
    if (!secret || secret !== ADMIN_SECRET) return res.status(401).json({ message: 'Admin secret required' });

    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User exists' });

    const hashed = await bcrypt.hash(password, 10);
    const admin = new User({ name, email, password: hashed, role: 'admin' });
    await admin.save();
    res.json({ message: 'Admin created' });
  } catch (err) {
    console.error('Create admin error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// MongoDB
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://127.0.0.1:27017/book1';

async function startServer() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected ✅');

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} ✅`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed', err);
  process.exit(1);
});

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
    if (!roomId || typeof roomId !== "string") return;

    socket.join(roomId);
    activeRooms.add(roomId);

    const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    const currentUsername = socketUsers.get(socket.id) || "";
    const participants = roomId.split("_").map((name) => String(name || "").trim()).filter(Boolean);
    const otherParticipant = participants.find((name) => name !== currentUsername) || "";
    const otherParticipantOnline = otherParticipant ? onlineUsers.has(otherParticipant) : false;

    console.log(
      `Joined Room Channel: ${roomId} | socketsInRoom=${roomSize} | otherParticipantOnline=${otherParticipantOnline ? "yes" : "no"}`
    );
    emitLiveStats();

  });

  // JOIN USER
  socket.on("joinUser", (username) => {

    socket.join(username);
    onlineUsers.set(username, socket.id);
    socketUsers.set(socket.id, username);

    console.log(
      "User Room Joined:",
      username
    );

    emitLiveStats();

  });

  // SEND MESSAGE
  socket.on("sendMessage", async (data) => {

    console.log(data);

    try {
      const senderUser = await User.findOne({ name: data.sender });
      const isShadowBanned = !!senderUser?.shadowBanned;
      const newMessage = new Message({
        ...data,
        isRead: false,
        moderatedStatus: isShadowBanned ? 'shadow' : 'approved'
      });
      await newMessage.save();

      if (String(data.sender || '').trim() !== ADMIN_INBOX_USER && String(data.receiver || '').trim() !== ADMIN_INBOX_USER) {
        const adminRoomId = [String(data.sender || '').trim(), ADMIN_INBOX_USER].sort().join('_');
        const adminCopy = new Message({
          ...data,
          roomId: adminRoomId,
          receiver: ADMIN_INBOX_USER,
          isRead: false,
          moderatedStatus: isShadowBanned ? 'shadow' : 'approved'
        });
        await adminCopy.save();
        io.to(ADMIN_INBOX_USER).emit("receiveMessage", adminCopy);
      }

      if (isShadowBanned) {
        io.to(data.sender).emit("receiveMessage", data);
        return;
      }
    } catch (err) {
      console.warn('Error while saving message', err);
    }

    io.to(data.receiver).emit("receiveMessage", data);

    io.to(data.roomId).emit("receiveMessage", data);

    emitLiveStats();

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

          console.error("Deal verification save error", saveErr);
        }

        pendingDeals.delete(dealKey);
        io.to(roomId).emit("dealConfirmed", payload);
        emitLiveStats();
      }
    } catch (err) {
      console.error("Deal confirmation error", err);
      socket.emit("dealError", { message: "Could not confirm deal" });
    }
  });

  socket.on("disconnect", () => {
    const username = socketUsers.get(socket.id);
    if (username) {
      onlineUsers.delete(username);
      socketUsers.delete(socket.id);
    }
    emitLiveStats();
  });

});

app.get('/admin/ai-insights', adminMiddleware, async (req, res) => {
  try {
    const books = await Book.find();
    const reports = await Report.find();
    const flagged = books.filter((book) => (book.suspiciousScore || 0) >= 60 || (book.reviewStatus || '') !== 'approved').length;
    const topCategory = books.reduce((acc, book) => {
      const key = book.category || 'Uncategorized';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const winningCategory = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0];
    const fallbackSummary = winningCategory
      ? `${winningCategory[0]} books are trending this week. ${flagged} listings are flagged for review. ${reports.length} reports are pending moderation.`
      : 'Not enough data yet.';

    if (process.env.OPENAI_API_KEY) {
      try {
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        const completion = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are an admin analytics assistant for a college marketplace moderation dashboard. Summarize insights in one short sentence.' },
              { role: 'user', content: JSON.stringify({ flaggedListings: flagged, totalReports: reports.length, topCategory: winningCategory || null, booksCount: books.length }) }
            ],
            temperature: 0.2
          })
        });

        if (completion.ok) {
          const json = await completion.json();
          const summary = json?.choices?.[0]?.message?.content?.trim();
          if (summary) {
            return res.json({ summary, flaggedListings: flagged, totalReports: reports.length, topCategory: winningCategory || null, source: 'openai' });
          }
        }
      } catch (openAiErr) {
        console.warn('OpenAI insights fallback', openAiErr?.message || openAiErr);
      }
    }

    res.json({ summary: fallbackSummary, flaggedListings: flagged, totalReports: reports.length, topCategory: winningCategory || null, source: 'heuristic' });
  } catch (err) {
    console.error('AI insights error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

