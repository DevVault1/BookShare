const INTERNAL_CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Technology', 'Literature', 'Arts', 'Children', 'Other'];

function normalizeIsbn(isbn = '') {
  return String(isbn).replace(/[^0-9Xx]/g, '').toUpperCase();
}

function isValidHttpUrl(value = '') {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractPublishedYear(value) {
  if (!value) return undefined;
  const match = String(value).match(/(18|19|20)\d{2}/);
  return match ? Number(match[0]) : undefined;
}

function mapToInternalCategory(values = []) {
  const haystack = values.join(' ').toLowerCase();
  if (!haystack) return 'Other';
  const rules = [
    ['Mathematics', ['math', 'mathematics', 'algebra', 'geometry', 'calculus', 'statistics']],
    ['Science', ['science', 'physics', 'chemistry', 'biology', 'astronomy', 'environment']],
    ['Technology', ['technology', 'computer', 'programming', 'software', 'engineering', 'ai', 'data']],
    ['History', ['history', 'historical', 'civilization', 'war', 'biography', 'memoir']],
    ['Literature', ['literature', 'poetry', 'drama', 'essays', 'criticism']],
    ['Arts', ['art', 'arts', 'music', 'painting', 'drawing', 'design', 'photography']],
    ['Children', ['children', 'kids', 'juvenile', 'young reader', 'picture book']],
    ['Fiction', ['fiction', 'novel', 'fantasy', 'mystery', 'romance', 'thriller', 'story']],
    ['Non-Fiction', ['nonfiction', 'non-fiction', 'self-help', 'business', 'psychology', 'education', 'travel', 'philosophy']],
  ];

  for (const [category, keywords] of rules) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return category;
  }

  return 'Other';
}

async function fetchJson(url, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BookShare/1.0 (+metadata lookup)',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Lookup failed (${res.status}): ${text.slice(0, 120)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeGoogleBooks(volume) {
  if (!volume?.volumeInfo) return null;
  const info = volume.volumeInfo;
  const industryIdentifiers = Array.isArray(info.industryIdentifiers) ? info.industryIdentifiers : [];
  const isbn13 = industryIdentifiers.find((item) => item.type === 'ISBN_13')?.identifier;
  const isbn10 = industryIdentifiers.find((item) => item.type === 'ISBN_10')?.identifier;
  const image = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
  return {
    source: 'google_books',
    title: info.title || '',
    author: Array.isArray(info.authors) ? info.authors.join(', ') : '',
    description: info.description || '',
    pages: Number.isFinite(info.pageCount) ? info.pageCount : undefined,
    publishedYear: extractPublishedYear(info.publishedDate),
    isbn: normalizeIsbn(isbn13 || isbn10 || ''),
    language: info.language ? String(info.language).toUpperCase() : '',
    image: image ? image.replace(/^http:/i, 'https:') : '',
    category: mapToInternalCategory(Array.isArray(info.categories) ? info.categories : []),
    externalIds: {
      googleBooksId: volume.id || '',
    },
    rawCategories: Array.isArray(info.categories) ? info.categories : [],
  };
}

function normalizeOpenLibrary(entry, requestedIsbn) {
  if (!entry) return null;
  const authors = Array.isArray(entry.authors) ? entry.authors.map((item) => item?.name).filter(Boolean) : [];
  const subjects = Array.isArray(entry.subjects) ? entry.subjects.map((item) => item?.name || item) : [];
  const publishDate = entry.publish_date || entry.publishDate || '';
  const coverImage = entry.cover?.large || entry.cover?.medium || entry.cover?.small || '';
  return {
    source: 'open_library',
    title: entry.title || '',
    author: authors.join(', '),
    description: typeof entry.description === 'string' ? entry.description : entry.description?.value || '',
    pages: Number.isFinite(entry.number_of_pages) ? entry.number_of_pages : undefined,
    publishedYear: extractPublishedYear(publishDate),
    isbn: normalizeIsbn(requestedIsbn),
    language: '',
    image: coverImage,
    category: mapToInternalCategory(subjects),
    externalIds: {
      openLibraryKey: entry.key || '',
      openLibraryUrl: entry.url || '',
    },
    rawCategories: subjects,
  };
}

function mergeMetadata(primary, secondary) {
  if (!primary && !secondary) return null;
  if (!primary) return secondary;
  if (!secondary) return primary;

  const merged = {
    title: primary.title || secondary.title || '',
    author: primary.author || secondary.author || '',
    description: primary.description || secondary.description || '',
    pages: primary.pages || secondary.pages,
    publishedYear: primary.publishedYear || secondary.publishedYear,
    isbn: primary.isbn || secondary.isbn || '',
    language: primary.language || secondary.language || '',
    image: primary.image || secondary.image || '',
    category: primary.category && primary.category !== 'Other' ? primary.category : (secondary.category || 'Other'),
    metadataSource: `${primary.source}+${secondary.source}`,
    externalIds: {
      ...(secondary.externalIds || {}),
      ...(primary.externalIds || {}),
    },
    rawCategories: [...(primary.rawCategories || []), ...(secondary.rawCategories || [])],
  };

  return merged;
}

async function fetchGoogleBooksByIsbn(isbn) {
  const normalized = normalizeIsbn(isbn);
  if (!normalized) return null;
  const params = new URLSearchParams({ q: `isbn:${normalized}`, maxResults: '1', projection: 'full' });
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set('key', process.env.GOOGLE_BOOKS_API_KEY);
  }
  const data = await fetchJson(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
  if (!Array.isArray(data.items) || !data.items.length) return null;
  return normalizeGoogleBooks(data.items[0]);
}

async function fetchOpenLibraryByIsbn(isbn) {
  const normalized = normalizeIsbn(isbn);
  if (!normalized) return null;
  const data = await fetchJson(`https://openlibrary.org/api/books?bibkeys=ISBN:${normalized}&format=json&jscmd=data`);
  const entry = data[`ISBN:${normalized}`];
  if (!entry) return null;
  return normalizeOpenLibrary(entry, normalized);
}

async function lookupBookMetadataByIsbn(isbn) {
  const normalized = normalizeIsbn(isbn);
  if (!normalized) {
    const err = new Error('Invalid ISBN');
    err.status = 400;
    throw err;
  }

  const issues = [];
  let google = null;
  let openLibrary = null;

  try {
    google = await fetchGoogleBooksByIsbn(normalized);
  } catch (err) {
    issues.push(`Google Books: ${err.message}`);
  }

  try {
    openLibrary = await fetchOpenLibraryByIsbn(normalized);
  } catch (err) {
    issues.push(`Open Library: ${err.message}`);
  }

  const merged = mergeMetadata(google, openLibrary) || google || openLibrary;
  if (!merged) {
    const err = new Error('No metadata found for that ISBN');
    err.status = 404;
    err.details = issues;
    throw err;
  }

  return {
    ...merged,
    isbn: merged.isbn || normalized,
    category: INTERNAL_CATEGORIES.includes(merged.category) ? merged.category : 'Other',
    providers: {
      googleBooks: !!google,
      openLibrary: !!openLibrary,
    },
    lookupIssues: issues,
    metadataSyncedAt: new Date(),
  };
}

async function enrichBookDataFromIsbn(bookData = {}, { overwrite = false } = {}) {
  const normalizedIsbn = normalizeIsbn(bookData.isbn);
  if (!normalizedIsbn) return bookData;

  const metadata = await lookupBookMetadataByIsbn(normalizedIsbn);
  const merged = { ...bookData };

  const setIfAllowed = (field, value) => {
    if (value === undefined || value === null || value === '') return;
    if (overwrite || !merged[field]) merged[field] = value;
  };

  setIfAllowed('title', metadata.title);
  setIfAllowed('author', metadata.author);
  setIfAllowed('description', metadata.description);
  setIfAllowed('pages', metadata.pages);
  setIfAllowed('publishedYear', metadata.publishedYear);
  setIfAllowed('language', metadata.language || 'English');
  setIfAllowed('category', metadata.category);
  setIfAllowed('image', metadata.image);
  merged.isbn = metadata.isbn || normalizedIsbn;
  merged.metadataSource = metadata.metadataSource || (metadata.providers.googleBooks ? 'google_books' : 'open_library');
  merged.metadataSyncedAt = metadata.metadataSyncedAt;
  if (metadata.externalIds?.googleBooksId) merged.googleBooksId = metadata.externalIds.googleBooksId;
  if (metadata.externalIds?.openLibraryKey) merged.openLibraryKey = metadata.externalIds.openLibraryKey;
  return merged;
}

module.exports = {
  INTERNAL_CATEGORIES,
  normalizeIsbn,
  isValidHttpUrl,
  lookupBookMetadataByIsbn,
  enrichBookDataFromIsbn,
};
