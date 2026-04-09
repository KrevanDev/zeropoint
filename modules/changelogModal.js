import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

const CHANGELOG_URL = './CHANGELOG.md';
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
