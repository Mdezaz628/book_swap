export const BASE_URL = 'https://swaptome-api.onrender.com';

export const ENDPOINTS = {
  books: `${BASE_URL}/api/books`,
  login: `${BASE_URL}/api/auth/login`,
  register: `${BASE_URL}/api/auth/register`,
  googleAuth: `${BASE_URL}/api/auth/google`,
  contact: `${BASE_URL}/api/send-email`,
  inbox: (user) => `${BASE_URL}/inbox/${encodeURIComponent(user)}`,
  messages: (roomId) => `${BASE_URL}/messages/${encodeURIComponent(roomId)}`,
  markRead: `${BASE_URL}/mark-read`,
  deals: (roomId) => `${BASE_URL}/deals/${encodeURIComponent(roomId)}/latest`,
};
