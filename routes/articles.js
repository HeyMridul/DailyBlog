// const express = require("express");
// const router = express.Router();
// const db = require("../data/db");
// const { requireAdmin } = require("../middleware/auth");

// // GET /api/articles  -> public, anyone can read
// router.get("/", async (req, res) => {
//   try {
//     const articles = await db.getAllArticles();
//     res.json(articles);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Couldn't load articles." });
//   }
// });

// // GET /api/articles/:id -> public, single article
// router.get("/:id", async (req, res) => {
//   try {
//     const article = await db.getArticleById(req.params.id);
//     if (!article) return res.status(404).json({ error: "Article not found." });
//     res.json(article);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Couldn't load article." });
//   }
// });

// // POST /api/articles -> admin only, create new article
// router.post("/", requireAdmin, async (req, res) => {
//   const { title, content, tag } = req.body;

//   if (!title || !title.trim()) {
//     return res.status(400).json({ error: "Title is required." });
//   }
//   if (!content || !content.trim()) {
//     return res.status(400).json({ error: "Content is required." });
//   }

//   try {
//     const article = await db.createArticle({ title, content, tag });
//     res.status(201).json(article);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Couldn't publish article." });
//   }
// });

// // PUT /api/articles/:id -> admin only, edit existing article
// router.put("/:id", requireAdmin, async (req, res) => {
//   const { title, content, tag } = req.body;
//   try {
//     const updated = await db.updateArticle(req.params.id, { title, content, tag });
//     if (!updated) return res.status(404).json({ error: "Article not found." });
//     res.json(updated);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Couldn't update article." });
//   }
// });

// // DELETE /api/articles/:id -> admin only
// router.delete("/:id", requireAdmin, async (req, res) => {
//   try {
//     const ok = await db.deleteArticle(req.params.id);
//     if (!ok) return res.status(404).json({ error: "Article not found." });
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Couldn't delete article." });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const db = require("../data/db");
const { requireAdmin } = require("../middleware/auth");
 
// GET /api/articles  -> public, anyone can read
router.get("/", async (req, res) => {
  try {
    const articles = await db.getAllArticles();
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't load articles." });
  }
});
 
// GET /api/articles/:id -> public, single article
router.get("/:id", async (req, res) => {
  try {
    const article = await db.getArticleById(req.params.id);
    if (!article) return res.status(404).json({ error: "Article not found." });
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't load article." });
  }
});
 
// POST /api/articles -> admin only, create new article
router.post("/", requireAdmin, async (req, res) => {
  const { title, content, tag, coverImage } = req.body;
 
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required." });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Content is required." });
  }
 
  try {
    const article = await db.createArticle({ title, content, tag, coverImage });
    res.status(201).json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't publish article." });
  }
});
 
// PUT /api/articles/:id -> admin only, edit existing article
router.put("/:id", requireAdmin, async (req, res) => {
  const { title, content, tag, coverImage } = req.body;
  try {
    const updated = await db.updateArticle(req.params.id, { title, content, tag, coverImage });
    if (!updated) return res.status(404).json({ error: "Article not found." });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't update article." });
  }
});
 
// DELETE /api/articles/:id -> admin only
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const ok = await db.deleteArticle(req.params.id);
    if (!ok) return res.status(404).json({ error: "Article not found." });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't delete article." });
  }
});
 
module.exports = router;