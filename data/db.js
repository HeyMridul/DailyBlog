// Talks to Postgres via Neon's serverless driver — the current recommended
// way to connect from Vercel (the old @vercel/postgres package is
// deprecated). This is the ONLY file that knows how articles are actually
// stored — every route calls these functions, so swapping databases later
// would only mean editing this file.
//
// Needs a DATABASE_URL environment variable. When you attach a Postgres
// database to your Vercel project via the Marketplace (Neon), this is set
// for you automatically.

const { neon } = require("@neondatabase/serverless");

// Created lazily (on first real query) rather than at import time, so a
// missing DATABASE_URL fails gracefully as a per-request 500 instead of
// crashing the whole server/function on startup.
let sql = null;
function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is not set. Add a Postgres database to your Vercel project " +
          "(Storage → Marketplace → Neon), or set DATABASE_URL in your local .env."
      );
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

// Creates the table on first use if it doesn't exist yet — so there's no
// separate manual migration step to remember. Runs once per cold start.
let ensured = null;
function ensureTable() {
  if (!ensured) {
    const sql = getSql();
    ensured = sql`
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tag TEXT NOT NULL DEFAULT 'General',
        created_at BIGINT NOT NULL,
        updated_at BIGINT
      );
    `;
  }
  return ensured;
}

function rowToArticle(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tag: row.tag,
    createdAt: Number(row.created_at),
    updatedAt: row.updated_at !== null ? Number(row.updated_at) : null,
  };
}

async function getAllArticles() {
  await ensureTable();
  const rows = await getSql()`
    SELECT * FROM articles ORDER BY created_at DESC;
  `;
  return rows.map(rowToArticle);
}

async function getArticleById(id) {
  await ensureTable();
  const rows = await getSql()`
    SELECT * FROM articles WHERE id = ${id};
  `;
  return rows[0] ? rowToArticle(rows[0]) : null;
}

async function createArticle({ title, content, tag }) {
  await ensureTable();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const createdAt = Date.now();
  const cleanTag = (tag || "General").trim();
  const cleanTitle = title.trim();
  const cleanContent = content.trim();

  await getSql()`
    INSERT INTO articles (id, title, content, tag, created_at, updated_at)
    VALUES (${id}, ${cleanTitle}, ${cleanContent}, ${cleanTag}, ${createdAt}, NULL);
  `;

  return {
    id,
    title: cleanTitle,
    content: cleanContent,
    tag: cleanTag,
    createdAt,
    updatedAt: null,
  };
}

async function updateArticle(id, { title, content, tag }) {
  await ensureTable();
  const existing = await getArticleById(id);
  if (!existing) return null;

  const updatedAt = Date.now();
  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newContent = content !== undefined ? content.trim() : existing.content;
  const newTag = tag !== undefined ? tag.trim() : existing.tag;

  await getSql()`
    UPDATE articles
    SET title = ${newTitle}, content = ${newContent}, tag = ${newTag}, updated_at = ${updatedAt}
    WHERE id = ${id};
  `;

  return { ...existing, title: newTitle, content: newContent, tag: newTag, updatedAt };
}

async function deleteArticle(id) {
  await ensureTable();
  const result = await getSql()`
    DELETE FROM articles WHERE id = ${id} RETURNING id;
  `;
  return result.length > 0;
}

module.exports = {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
};
