// Vercel turns this file into a serverless function. It exports the exact
// same Express app used locally — vercel.json routes all /api/* traffic
// here, and Express's own router (routes/articles.js, routes/auth.js)
// handles the rest exactly as it does in local dev.

module.exports = require("../app");
