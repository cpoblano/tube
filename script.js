const form = document.getElementById('video-form');
const input = document.getElementById('youtube-url');
const errorMessage = document.getElementById('error-message');
const playerWrapper = document.getElementById('player-wrapper');
const emptyState = document.getElementById('empty-state');
const videoFrame = document.getElementById('video-frame');
const historyList = document.getElementById('history-list');

const STORAGE_KEY = 'tube-loader-history';
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

function loadVideo(videoId) {
  videoFrame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`;
  playerWrapper.classList.remove('hidden');
  emptyState.classList.add('hidden');
  clearError();
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
      input.value = button.dataset.url;
      handleVideoLoad(button.dataset.url);
    });
  });
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

renderHistory();
