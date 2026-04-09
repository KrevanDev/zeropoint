import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

const CHANGELOG_URL = '../changelog.md';
const STORAGE_KEY = 'lastSeenChangelogHash';

async function hashText(text) {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function maybeShowChangelog() {
  const res = await fetch(CHANGELOG_URL, { cache: 'no-store' });
  const md = await res.text();

  const hash = await hashText(md);
  const lastSeen = localStorage.getItem(STORAGE_KEY);

  if (hash === lastSeen) return;

  showChangelogModal(marked.parse(md), hash);
}

function showChangelogModal(html, hash) {
  const modal = document.getElementById('changelogModal');
  const content = document.getElementById('changelogContent');
  const checkbox = document.getElementById('changelogAcknowledge');

  content.innerHTML = html;
  modal.classList.add('active');

  // Add the ?. before .onclick
  document.getElementById('closeChangelogBtn')?.addEventListener('click', () => {
    if (checkbox.checked) {
      localStorage.setItem(STORAGE_KEY, hash);
    }
    modal.classList.remove('active');
  });
}

async function getChangelogDate() {
  try {
    // Replace with your actual GitHub username and repo name
    const response = await fetch('https://api.github.com/repos/krevandev/zeropoint/commits?path=CHANGELOG.md&page=1&per_page=1');
    const data = await response.json();
    if (data && data.length > 0) {
      const commitDate = new Date(data[0].commit.committer.date);
      return commitDate.toLocaleDateString(); // e.g., "5/20/2024"
    }
  } catch (e) {
    console.error("Could not fetch changelog date", e);
  }
  return "Recently"; // Fallback
}
