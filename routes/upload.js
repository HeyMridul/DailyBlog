
const express = require("express");
const router = express.Router();
const { put } = require("@vercel/blob");
const { requireAdmin } = require("../middleware/auth");
 
// POST /api/upload -> admin only. Body: { image: "data:image/png;base64,....", filename: "cover.png" }
// Returns: { url: "https://....public.blob.vercel-storage.com/...." }
router.post("/upload", requireAdmin, async (req, res) => {
  const { image, filename } = req.body;
 
  if (!image) {
    return res.status(400).json({ error: "No image provided." });
  }
 
  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ error: "Image must be a base64 data URL." });
  }
 
  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
 
  // Basic size guard — keep cover images reasonable (5MB)
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: "Image is too large (max 5MB)." });
  }
 
  const extension = mimeType.split("/")[1] || "jpg";
  const safeName = (filename || "cover").replace(/[^a-zA-Z0-9._-]/g, "_");
  const blobPath = `articles/${Date.now()}-${safeName}.${extension}`;
 
  try {
    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: mimeType,
    });
    res.json({ url: blob.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error:
        "Couldn't upload image. Make sure a Blob store is attached to this project in Vercel (Storage → Marketplace).",
    });
  }
});
 
module.exports = router;
 