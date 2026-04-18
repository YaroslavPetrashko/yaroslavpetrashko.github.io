// Goodreads RSS Integration
// Replace YOUR_GOODREADS_ID with your actual Goodreads user ID (numeric)
const GOODREADS_USER_ID = 'YOUR_GOODREADS_ID';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

async function fetchShelf(shelfName) {
  const feedUrl = `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=${shelfName}`;
  const response = await fetch(CORS_PROXY + encodeURIComponent(feedUrl));
  if (!response.ok) throw new Error(`Failed to fetch ${shelfName}`);
  const text = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  const items = xml.querySelectorAll('item');
  const books = [];

  items.forEach(item => {
    const title = item.querySelector('title')?.textContent || 'Unknown Title';
    const author = item.querySelector('author_name')?.textContent || 'Unknown Author';
    const link = item.querySelector('link')?.textContent || '#';
    const rating = item.querySelector('user_rating')?.textContent || '0';

    // Extract cover image from the description HTML
    const descHtml = item.querySelector('description')?.textContent || '';
    const imgMatch = descHtml.match(/<img[^>]+src="([^"]+)"/);
    let coverUrl = imgMatch ? imgMatch[1] : '';
    // Use larger image if possible
    if (coverUrl) {
      coverUrl = coverUrl.replace(/\._\w+_\./, '._SX200_.');
    }

    books.push({ title, author, link, rating, coverUrl });
  });

  return books;
}

function renderBooks(books, containerId) {
  const container = document.getElementById(containerId);
  if (!books.length) {
    container.innerHTML = '<p class="loading">No books found on this shelf.</p>';
    return;
  }

  container.innerHTML = books.map(book => `
    <a href="${book.link}" target="_blank" class="book-card" style="text-decoration:none;color:inherit;">
      ${book.coverUrl ? `<img src="${book.coverUrl}" alt="${book.title}" loading="lazy">` : '<div style="width:100px;height:150px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#999;">No cover</div>'}
      <div class="book-title">${book.title}</div>
      <div class="book-author">${book.author}</div>
      ${book.rating && book.rating !== '0' ? `<div class="book-rating">${'★'.repeat(parseInt(book.rating))}${'☆'.repeat(5 - parseInt(book.rating))}</div>` : ''}
    </a>
  `).join('');
}

async function loadShelves() {
  try {
    const currentlyReading = await fetchShelf('currently-reading');
    renderBooks(currentlyReading, 'currently-reading');
  } catch (e) {
    document.getElementById('currently-reading').innerHTML =
      '<p class="loading">Could not load shelf. Check Goodreads link below.</p>';
  }

  try {
    const readBooks = await fetchShelf('read');
    renderBooks(readBooks, 'read-books');
  } catch (e) {
    document.getElementById('read-books').innerHTML =
      '<p class="loading">Could not load shelf. Check Goodreads link below.</p>';
  }
}

loadShelves();
