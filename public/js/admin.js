const TOKEN_KEY = "dailylog_admin_token";
 
const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const articleForm = document.getElementById("articleForm");
const articleMsg = document.getElementById("articleMsg");
const manageList = document.getElementById("manageList");
const logoutBtn = document.getElementById("logoutBtn");
 
const formHeading = document.getElementById("formHeading");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const titleInput = document.getElementById("title");
const tagInput = document.getElementById("tag");
const contentInput = document.getElementById("content");
const coverImageInput = document.getElementById("coverImage");
const coverImagePreviewWrap = document.getElementById("coverImagePreviewWrap");
const coverImagePreview = document.getElementById("coverImagePreview");
const removeCoverImageBtn = document.getElementById("removeCoverImage");
 
// Tracks which article we're editing. null = creating a new one.
let editingId = null;
// Holds the cover image as a base64 data URL while the user is editing the
// form (either a freshly chosen file, or the existing image when editing).
let pendingCoverImage = null;
// True once the user has explicitly removed the image on an existing article.
let coverImageRemoved = false;
 
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
 
// ---------- Cover image handling ----------
 
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
 
function showCoverPreview(dataUrlOrHttpUrl) {
  coverImagePreview.src = dataUrlOrHttpUrl;
  coverImagePreviewWrap.style.display = "flex";
}
 
function hideCoverPreview() {
  coverImagePreview.src = "";
  coverImagePreviewWrap.style.display = "none";
}
 
coverImageInput.addEventListener("change", async () => {
  const file = coverImageInput.files[0];
  if (!file) return;
 
  try {
    const dataUrl = await fileToDataUrl(file);
    pendingCoverImage = dataUrl;
    coverImageRemoved = false;
    showCoverPreview(dataUrl);
  } catch (err) {
    setMsg(articleMsg, "Couldn't read that image file.", "error");
  }
});
 
removeCoverImageBtn.addEventListener("click", () => {
  pendingCoverImage = null;
  coverImageRemoved = true;
  coverImageInput.value = "";
  hideCoverPreview();
});
 
// Uploads a base64 data URL to /api/upload and returns the hosted URL.
async function uploadCoverImage(dataUrl) {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ image: dataUrl, filename: "cover" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Image upload failed.");
  return data.url;
}
 
// ---------- Create / update article ----------
 
function resetFormToCreateMode() {
  editingId = null;
  pendingCoverImage = null;
  coverImageRemoved = false;
  articleForm.reset();
  hideCoverPreview();
  formHeading.textContent = "New entry";
  submitBtn.textContent = "Publish entry";
  cancelEditBtn.style.display = "none";
  setMsg(articleMsg, "");
}
 
cancelEditBtn.addEventListener("click", resetFormToCreateMode);
 
articleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
 
  const title = titleInput.value;
  const tag = tagInput.value;
  const content = contentInput.value;
 
  submitBtn.disabled = true;
  setMsg(articleMsg, editingId ? "Updating…" : "Publishing…");
 
  try {
    // Upload the image first (if a new one was chosen) so we have a real
    // URL to save with the article rather than a huge base64 blob.
    let coverImageUrl;
    if (pendingCoverImage && pendingCoverImage.startsWith("data:")) {
      setMsg(articleMsg, "Uploading image…");
      coverImageUrl = await uploadCoverImage(pendingCoverImage);
    } else if (coverImageRemoved) {
      coverImageUrl = ""; // explicit clear
    } else if (editingId) {
      coverImageUrl = undefined; // leave existing image untouched
    } else {
      coverImageUrl = null; // new article, no image
    }
 
    setMsg(articleMsg, editingId ? "Updating…" : "Publishing…");
 
    const url = editingId ? `/api/articles/${editingId}` : "/api/articles";
    const method = editingId ? "PUT" : "POST";
    const body = { title, tag, content };
    if (coverImageUrl !== undefined) body.coverImage = coverImageUrl;
 
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
 
    if (res.status === 401) {
      setMsg(articleMsg, "Session expired — please log in again.", "error");
      localStorage.removeItem(TOKEN_KEY);
      showLogin();
      return;
    }
 
    if (!res.ok) {
      setMsg(articleMsg, data.error || "Couldn't save entry.", "error");
      return;
    }
 
    setMsg(
      articleMsg,
      editingId ? "Updated! Changes are live on the public site." : "Published! It's now live on the public site.",
      "success"
    );
    resetFormToCreateMode();
    loadManageList();
  } catch (err) {
    setMsg(articleMsg, err.message || "Couldn't reach the server.", "error");
  } finally {
    submitBtn.disabled = false;
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
          <div class="manage-item__row">
            ${a.coverImage ? `<img src="${a.coverImage}" class="manage-item__thumb" alt="" />` : ""}
            <div class="manage-item__info">
              <h3>${escapeHtml(a.title)}</h3>
              <span>${new Date(a.createdAt).toLocaleString()} · ${escapeHtml(a.tag)}</span>
            </div>
          </div>
          <div class="manage-item__actions">
            <button data-action="edit">Edit</button>
            <button data-action="delete" class="danger">Delete</button>
          </div>
        </li>
      `
      )
      .join("");
 
    manageList.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const li = btn.closest("[data-id]");
        const article = articles.find((a) => a.id === li.dataset.id);
        if (article) startEditing(article);
      });
    });
 
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
          if (editingId === id) resetFormToCreateMode();
        } else {
          alert("Couldn't delete this entry. Try logging in again.");
        }
      });
    });
  } catch (err) {
    manageList.innerHTML = `<li class="manage-item"><span>Couldn't load entries.</span></li>`;
  }
}
 
function startEditing(article) {
  editingId = article.id;
  pendingCoverImage = null;
  coverImageRemoved = false;
  coverImageInput.value = "";
 
  titleInput.value = article.title;
  tagInput.value = article.tag;
  contentInput.value = article.content;
 
  if (article.coverImage) {
    showCoverPreview(article.coverImage);
  } else {
    hideCoverPreview();
  }
 
  formHeading.textContent = "Edit entry";
  submitBtn.textContent = "Save changes";
  cancelEditBtn.style.display = "inline-block";
  setMsg(articleMsg, "");
 
  document.querySelector(".admin-card").scrollIntoView({ behavior: "smooth" });
}
 
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
 
// ---------- Init ----------
 
if (getToken()) {
  showDashboard();
} else {
  showLogin();
}