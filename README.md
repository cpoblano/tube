const form = document.getElementById('video-form');
const input = document.getElementById('youtube-url');
const errorMessage = document.getElementById('error-message');
const playerWrapper = document.getElementById('player-wrapper');
const emptyState = document.getElementById('empty-state');
const videoFrame = document.getElementById('video-frame');
const historyList = document.getElementById('history-list');

const STORAGE_KEY = 'tube-loader-history';
const MAX_HISTORY_ITEMS = 5;

function getVideoIdFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname === 'youtu.be') {
      return parsedUrl.pathname.slice(1).split('/')[0] || null;
    }

    if (hostname.includes('youtube.com')) {
      const vParam = parsedUrl.searchParams.get('v');
      if (vParam) return vParam;

      const shortPath = parsedUrl.pathname.split('/')[1];
      if (shortPath === 'shorts' || shortPath === 'embed' || shortPath === 'live') {
        return parsedUrl.pathname.split('/')[2] || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function showError(message) {
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.textContent = '';
}

function loadVideo(videoId) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  videoFrame.src = embedUrl;
  playerWrapper.classList.remove('hidden');
  emptyState.classList.add('hidden');
  clearError();
}

function saveToHistory(url) {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const next = [url, ...existing.filter((item) => item !== url)].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  renderHistory();
}

function renderHistory() {
  const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  if (!items.length) {
    historyList.innerHTML = '<li class="history-item">No recent videos</li>';
    return;
  }

  historyList.innerHTML = items
    .map(
      (url) => `
        <li>
          <button type="button" class="history-item" data-url="${escapeHtml(url)}">${escapeHtml(url)}</button>
        </li>
      `
    )
    .join('');

  historyList.querySelectorAll('.history-item').forEach((button) => {
    button.addEventListener('click', () => {
      const url = button.dataset.url;
      input.value = url;
      handleVideoLoad(url);
    });
  });
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function handleVideoLoad(url) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    showError('Please enter a YouTube link.');
    return;
  }

  const videoId = getVideoIdFromUrl(trimmedUrl);
  if (!videoId) {
    showError('That does not look like a valid YouTube video URL.');
    return;
  }

  loadVideo(videoId);
  saveToHistory(trimmedUrl);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  handleVideoLoad(input.value);
});

renderHistory();
