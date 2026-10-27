import { BASE_URL } from '../constants/api';

// Curated high-resolution covers for different categories when backend uploads return 404
const CATEGORY_COVERS = {
  novel: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
  fiction: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
  academic: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',
  technology: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&q=80&w=800',
  comics: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=800',
  'self-help': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800',
  business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
  default: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
};

/**
 * Resolves the primary image URL for a book.
 * Handles Cloudinary URLs, relative uploads/ paths, and fallbacks.
 */
export function resolveBookImage(book) {
  if (!book) return CATEGORY_COVERS.default;

  let raw = '';

  // Check images array first (from MongoDB schema)
  if (Array.isArray(book.images) && book.images.length > 0 && typeof book.images[0] === 'string') {
    raw = book.images[0].trim();
  } else if (typeof book.image === 'string' && book.image.trim()) {
    raw = book.image.trim();
  } else if (typeof book.imageUrl === 'string' && book.imageUrl.trim()) {
    raw = book.imageUrl.trim();
  } else if (typeof book.coverImage === 'string' && book.coverImage.trim()) {
    raw = book.coverImage.trim();
  }

  if (!raw) {
    return getCategoryFallback(book.category);
  }

  const normalized = raw.replace(/\\/g, '/');

  // If already absolute URL (Cloudinary or any web link)
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('data:')) {
    return normalized;
  }

  // If it's a relative upload path like "uploads/..."
  if (normalized.startsWith('uploads/')) {
    return `${BASE_URL}/${normalized}`;
  }

  if (normalized.startsWith('/')) {
    return `${BASE_URL}${normalized}`;
  }

  return `${BASE_URL}/uploads/${normalized}`;
}

export function getCategoryFallback(category) {
  const cat = (category || '').toLowerCase();
  for (const key of Object.keys(CATEGORY_COVERS)) {
    if (cat.includes(key)) {
      return CATEGORY_COVERS[key];
    }
  }
  return CATEGORY_COVERS.default;
}
