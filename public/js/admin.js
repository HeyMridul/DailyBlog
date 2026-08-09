const TOKEN_KEY = "dailylog_admin_token";

const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const articleForm = document.getElementById("articleForm");
const articleMsg = document.getElementById("articleMsg");
const manageList = document.getElementById("manageList");
const logoutBtn = document.getElementById("logoutBtn");

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setMsg(el, text, type) {
  el.textContent = text;
  el.className = "form-msg" + (type ? ` form-msg--${type}` : "");
}

function showDashboard() {
  loginView.style.display = "none";
  dashboardView.style.display = "block";
  loadManageList();
}

function showLogin() {
  loginView.style.display = "block";
  dashboardView.style.display = "none";
}

// ---------- Login ----------

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("password").value;
  setMsg(loginMsg, "Logging in…");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMsg(loginMsg, data.error || "Login failed.", "error");
      return;
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    setMsg(loginMsg, "");
    loginForm.reset();
    showDashboard();
  } catch (err) {
    setMsg(loginMsg, "Couldn't reach the server.", "error");
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  showLogin();
});

// ---------- Publish new article ----------

articleForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const tag = document.getElementById("tag").value;
  const content = document.getElementById("content").value;

  setMsg(articleMsg, "Publishing…");

  try {
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ title, tag, content }),
    });
    const data = await res.json();

    if (res.status === 401) {
      setMsg(articleMsg, "Session expired — please log in again.", "error");
      localStorage.removeItem(TOKEN_KEY);
      showLogin();
      return;
    }

    if (!res.ok) {
      setMsg(articleMsg, data.error || "Couldn't publish entry.", "error");
      return;
    }

    setMsg(articleMsg, "Published! It's now live on the public site.", "success");
    articleForm.reset();
    loadManageList();
  } catch (err) {
    setMsg(articleMsg, "Couldn't reach the server.", "error");
  }
});

// ---------- Manage existing entries ----------

async function loadManageList() {
  manageList.innerHTML = `<li class="manage-item"><span>Loading…</span></li>`;

  try {
    const res = await fetch("/api/articles");
    const articles = await res.json();

    if (articles.length === 0) {
      manageList.innerHTML = `<li class="manage-item"><span>No entries yet.</span></li>`;
      return;
    }

    manageList.innerHTML = articles
      .map(
        (a) => `
        <li class="manage-item" data-id="${a.id}">
          <div class="manage-item__info">
            <h3>${a.title}</h3>
            <span>${new Date(a.createdAt).toLocaleString()} · ${a.tag}</span>
          </div>
          <div class="manage-item__actions">
            <button data-action="delete" class="danger">Delete</button>
          </div>
        </li>
      `
      )
      .join("");

    manageList.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        const li = btn.closest("[data-id]");
        const id = li.dataset.id;
        if (!confirm("Delete this entry? This can't be undone.")) return;

        const res = await fetch(`/api/articles/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        });

        if (res.ok) {
          li.remove();
        } else {
          alert("Couldn't delete this entry. Try logging in again.");
        }
      });
    });
  } catch (err) {
    manageList.innerHTML = `<li class="manage-item"><span>Couldn't load entries.</span></li>`;
  }
}

// ---------- Init ----------

if (getToken()) {
  showDashboard();
} else {
  showLogin();
}
