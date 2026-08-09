const feedEl = document.getElementById("feed");
const LAST_VISIT_KEY = "dailylog_last_visit";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(ts) {
  return new Date(ts).toISOString().slice(0, 10); // YYYY-MM-DD, terminal-log style
}

function contentToParagraphs(content) {
  return content
    .split(/\n\s*\n/) // blank line = new paragraph
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function excerptOf(content, maxLen = 160) {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length > maxLen ? flat.slice(0, maxLen).trim() + "…" : flat;
}

async function loadArticles() {
  // Record "now" before we show anything — anything published after this
  // moment will be tomorrow's NEW entry, not today's.
  const now = Date.now();
  const lastVisit = Number(localStorage.getItem(LAST_VISIT_KEY) || 0);

  let articles = [];
  try {
    const res = await fetch("/api/articles");
    if (!res.ok) throw new Error("Request failed");
    articles = await res.json();
  } catch (err) {
    feedEl.innerHTML = `<p class="empty-state">Couldn't load entries. Is the server running?</p>`;
    return;
  }

  if (articles.length === 0) {
    feedEl.innerHTML = `<p class="empty-state">No entries yet. Check back soon.</p>`;
    return;
  }

  feedEl.innerHTML = articles
    .map((a) => {
      const isNew = a.createdAt > lastVisit;
      return `
        <article class="entry ${isNew ? "entry--new" : ""}" data-id="${a.id}">
          <div class="entry__dot"></div>
          <div class="entry__meta">
            <span class="entry__date">${formatDate(a.createdAt)}</span>
            <span class="entry__tag">${escapeHtml(a.tag)}</span>
            ${isNew ? `<span class="entry__badge-new">NEW</span>` : ""}
          </div>
          <h2>${escapeHtml(a.title)}</h2>
          <p class="entry__excerpt">${escapeHtml(excerptOf(a.content))}</p>
          <div class="entry__content">${contentToParagraphs(a.content)}</div>
          <button class="entry__toggle" data-action="toggle">Read entry →</button>
        </article>
      `;
    })
    .join("");

  // Wire up read-more toggles
  feedEl.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const contentEl = btn.previousElementSibling;
      const open = contentEl.classList.toggle("is-open");
      btn.textContent = open ? "Show less ←" : "Read entry →";
    });
  });

  // Now that today's NEW badges have been shown, move the marker forward.
  localStorage.setItem(LAST_VISIT_KEY, String(now));
}

loadArticles();
