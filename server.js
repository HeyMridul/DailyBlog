// Local development entry point.
// On Vercel, api/index.js exports the same app instead — Vercel runs it as
// a serverless function and never calls .listen() itself.

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n DailyLog is running: http://localhost:${PORT}`);
  console.log(` Admin portal:        http://localhost:${PORT}/admin.html\n`);
});
