require("dotenv").config();
const express = require("express");
const path = require("path");

const articlesRouter = require("./routes/articles");
const authRouter = require("./routes/auth");

// Basic safety checks so you don't accidentally run with insecure defaults
if (!process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
  console.error(
    "\n Missing ADMIN_PASSWORD or JWT_SECRET.\n" +
      "   Set them in .env (local) or in your Vercel project's Environment Variables (production).\n"
  );
}

const app = express();

app.use(express.json());
// Serving /public here too so `npm start` still works identically for local dev.
// In production on Vercel, the public/ folder is served as static files directly
// (see vercel.json), so this line is mostly a local-dev convenience.
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/articles", articlesRouter);
app.use("/api", authRouter);

module.exports = app;
