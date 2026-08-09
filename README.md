# DailyLog

A simple tech blog with two parts:

- **Public site** (`/`) — shows your articles, newest first, with a glowing
  **NEW** marker on anything a visitor hasn't seen yet.
- **Admin portal** (`/admin.html`) — password-protected page where you write
  and publish new entries, and delete old ones.

Built to run on **Vercel**, using **Vercel Postgres** to store articles.

## Folder structure

```
dailylog/
├── app.js                  # Express app (routes + middleware) — no .listen() here
├── server.js                # Local dev only: runs app.js with .listen()
├── api/
│   └── index.js              # Vercel serverless function — reuses app.js as-is
├── vercel.json               # Routes /api/* to the function, everything else to /public
├── package.json
├── .env.example               # copy to .env for local dev
├── data/
│   └── db.js                  # ALL database logic lives here (Postgres queries)
├── routes/
│   ├── articles.js           # GET/POST/PUT/DELETE /api/articles
│   └── auth.js                 # POST /api/login
├── middleware/
│   └── auth.js                 # protects admin-only routes
└── public/                     # static frontend, served as-is
    ├── index.html               # public blog
    ├── admin.html                # admin login + dashboard
    ├── css/style.css
    └── js/
        ├── main.js                # public feed logic + "seen/unseen" tracking
        └── admin.js                # login + publish/delete logic
```

## Deploying to Vercel

### 1. Push this project to GitHub

Create a new repo and push this folder to it (`.env` is already excluded via
`.gitignore` — never commit it).

### 2. Import the project into Vercel

Go to [vercel.com/new](https://vercel.com/new), import the GitHub repo, and
deploy. Vercel will detect it as a plain Node project automatically — no
build command needed.

### 3. Attach a Postgres database

In your new Vercel project: **Storage → Marketplace Database Providers →
Neon** (Vercel's own Postgres product was retired in favor of a direct Neon
integration — this is the current standard way to add Postgres on Vercel).
Once attached, Vercel sets a `DATABASE_URL` environment variable for you —
you don't need to type a connection string anywhere.

### 4. Set your other environment variables

In **Project Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | the password you'll log in with |
| `JWT_SECRET` | any long random string (e.g. `openssl rand -hex 32`) |

### 5. Redeploy

Trigger a redeploy (Vercel does this automatically on your next push, or
use the "Redeploy" button) so the new environment variables take effect.

That's it — your site is live. The articles table is created automatically
the first time the app queries it, so there's no manual migration step.

## Running it locally

```bash
npm install
vercel env pull .env.development.local   # pulls DATABASE_URL from your Vercel project
```

Then either:

- Rename `.env.development.local` to `.env` and add `ADMIN_PASSWORD` +
  `JWT_SECRET` to it, **or**
- Copy `.env.example` to `.env`, fill in `ADMIN_PASSWORD` + `JWT_SECRET`
  yourself, and paste the `DATABASE_URL` value from the pulled file into it.

Then:

```bash
npm start
```

- Public site: http://localhost:3000
- Admin portal: http://localhost:3000/admin.html

Local dev talks to the same real Postgres database as production — there's
no separate local database to keep in sync.

## How the "NEW" tag works

Each visitor's browser remembers (via `localStorage`) the last time they
looked at the site. On each visit, any article published after that
timestamp gets the amber **NEW** dot and badge, then the timestamp updates
so it naturally disappears next visit. This is per-browser, not global.

## Writing an entry

In the admin dashboard, paragraphs are separated by a **blank line** — hit
Enter twice between paragraphs. There's no rich-text/Markdown support by
design, to keep things simple.

## If something goes wrong on Vercel

- **"Missing ADMIN_PASSWORD or JWT_SECRET" in logs** → you haven't set them
  in Project Settings → Environment Variables yet, or haven't redeployed
  since adding them.
- **500 errors from `/api/articles`** → check the Vercel function logs
  (Project → Deployments → your deployment → Functions). Almost always
  means `DATABASE_URL` isn't set — confirm a Postgres database is attached
  under Storage.
- **Public site loads but looks unstyled / admin page 404s** → check
  `vercel.json` is present at the project root and wasn't excluded from the
  deploy.

## Extending it later

- Edit-in-place for existing articles (the backend already supports `PUT`)
- Basic Markdown formatting in the content field
- Cover images per article
- Tag-based filtering on the public page
