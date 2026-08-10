// require("dotenv").config();
// const express = require("express");
// const path = require("path");

// const articlesRouter = require("./routes/articles");
// const authRouter = require("./routes/auth");

// // Basic safety checks so you don't accidentally run with insecure defaults
// if (!process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
//   console.error(
//     "\n Missing ADMIN_PASSWORD or JWT_SECRET.\n" +
//       "   Set them in .env (local) or in your Vercel project's Environment Variables (production).\n"
//   );
// }

// const app = express();

// app.use(express.json());
// // Serving /public here too so `npm start` still works identically for local dev.
// // In production on Vercel, the public/ folder is served as static files directly
// // (see vercel.json), so this line is mostly a local-dev convenience.
// app.use(express.static(path.join(__dirname, "public")));

// app.use("/api/articles", articlesRouter);
// app.use("/api", authRouter);

// module.exports = app;


require("dotenv").config();
const express = require("express");
const path = require("path");
 
const articlesRouter = require("./routes/articles");
const authRouter = require("./routes/auth");
const uploadRouter = require("./routes/upload");
 
// Basic safety checks so you don't accidentally run with insecure defaults
if (!process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
  console.error(
    "\n Missing ADMIN_PASSWORD or JWT_SECRET.\n" +
      "   Set them in .env (local) or in your Vercel project's Environment Variables (production).\n"
  );
}
 
const app = express();
 
// Raised from Express's 100kb default so a base64-encoded cover image
// (which runs ~33% larger than the original file) can fit in the request.
app.use(express.json({ limit: "8mb" }));
// Serving /public here too so `npm start` still works identically for local dev.
// In production on Vercel, the public/ folder is served as static files directly
// (see vercel.json), so this line is mostly a local-dev convenience.
app.use(express.static(path.join(__dirname, "public")));
 
app.use("/api/articles", articlesRouter);
app.use("/api", authRouter);
app.use("/api", uploadRouter);
 
module.exports = app;
 