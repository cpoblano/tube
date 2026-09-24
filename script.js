const form = document.getElementById('video-form');
const input = document.getElementById('youtube-url');
const errorMessage = document.getElementById('error-message');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-query');
const searchError = document.getElementById('search-error');
const apiKeyInput = document.getElementById('api-key');
const saveKeyButton = document.getElementById('save-key-btn');
const resultsPanel = document.getElementById('results-panel');
const searchResults = document.getElementById('search-results');
const playerWrapper = document.getElementById('player-wrapper');
const emptyState = document.getElementById('empty-state');
const videoFrame = document.getElementById('video-frame');
const historyList = document.getElementById('history-list');

const STORAGE_KEY = 'tube-loader-history';
const API_KEY_STORAGE_KEY = 'tube-youtube-api-key';
const MAX_HISTORY_ITEMS = 5;

function getVideoIdFromUrl(value) {
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      const videoId = url.searchParams.get('v');
      if (videoId) return videoId;

      const parts = url.pathname.split('/').filter(Boolean);
      if (['shorts', 'embed', 'live'].includes(parts[0])) {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function showError(message) {
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.textContent = '';
}

function showSearchError(message) {
  searchError.textContent = message;
}

function clearSearchError() {
  searchError.textContent = '';
}

function getStoredApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

function saveApiKey() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    apiKeyInput.value = '';
    showSearchError('Please enter a YouTube Data API key before searching.');
    return;
  }

  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  apiKeyInput.value = apiKey;
  showSearchError('YouTube API key saved.');
}

function loadVideo(videoId) {
  videoFrame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
  resultsPanel.classList.add('hidden');
  playerWrapper.classList.remove('hidden');
  emptyState.classList.add('hidden');
  clearError();
  clearSearchError();
}

function readHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

function saveToHistory(url) {
  const next = [url, ...readHistory().filter((item) => item !== url)].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  renderHistory();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

function renderHistory() {
  const items = readHistory();
  historyList.innerHTML = items.length
    ? items.map((url) => `<li><button type="button" class="history-item" data-url="${escapeHtml(url)}">${escapeHtml(url)}</button></li>`).join('')
    : '<li class="history-item">No recent videos</li>';

  historyList.querySelectorAll('[data-url]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.url;
      input.value = value;
      handleVideoLoad(value);
    });
  });
}

function renderSearchResults(items) {
  if (!items.length) {
    searchResults.innerHTML = '<div class="no-results">No videos matched that search.</div>';
    resultsPanel.classList.remove('hidden');
    return;
  }

  searchResults.innerHTML = items
    .map(
      (item) => `
        <article class="result-card">
          <img src="${item.snippet.thumbnails.medium.url}" alt="${escapeHtml(item.snippet.title)}" />
          <div class="result-details">
            <h3>${escapeHtml(item.snippet.title)}</h3>
            <p>${escapeHtml(item.snippet.channelTitle)}</p>
            <button type="button" data-video-id="${item.id.videoId}" class="result-button">Load video</button>
          </div>
        </article>
      `
    )
    .join('');

  resultsPanel.classList.remove('hidden');

  searchResults.querySelectorAll('[data-video-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const videoId = button.getAttribute('data-video-id');
      loadVideo(videoId);
    });
  });
}

async function handleVideoSearch(value) {
  const query = value.trim();
  if (!query) {
    showSearchError('Please enter a search term.');
    return;
  }

  const apiKey = getStoredApiKey();
  if (!apiKey) {
    showSearchError('Add a YouTube Data API key above before searching.');
    return;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('YouTube search request failed.');
    }

    const data = await response.json();
    if (!data.items || !data.items.length) {
      searchResults.innerHTML = '<div class="no-results">No videos matched that search.</div>';
      resultsPanel.classList.remove('hidden');
      return;
    }

    renderSearchResults(data.items);
  } catch (error) {
    showSearchError('Search failed. Check your API key and try again.');
  }
}

function handleVideoLoad(value) {
  const url = value.trim();
  if (!url) {
    showError('Please paste a YouTube link.');
    return;
  }

  const videoId = getVideoIdFromUrl(url);
  if (!videoId) {
    showError('Use a valid YouTube watch, Shorts, live, embed, or youtu.be link.');
    return;
  }

  loadVideo(videoId);
  saveToHistory(url);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  handleVideoLoad(input.value);
});

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await handleVideoSearch(searchInput.value);
});

saveKeyButton.addEventListener('click', () => {
  saveApiKey();
  apiKeyInput.value = getStoredApiKey();
});

apiKeyInput.value = getStoredApiKey();
renderHistory();
