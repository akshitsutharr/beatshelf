<div align="center">
  <img src="https://github.com/akshitsutharr/beatshelf/blob/main/public/icon1.png" alt="BeatShelf Logo" width="120" height="120">

  <p>
    A modern music discovery + review platform powered by <b>Next.js</b>, <b>TypeScript</b>, <b>Spotify API</b>, and <b>Supabase</b>.
  </p>

  <p>
    <a href="https://beatshelf.vercel.app"><b>Live Demo</b></a>
    ·
    <a href="#-features"><b>Features</b></a>
    ·
    <a href="#-getting-started"><b>Getting Started</b></a>
    ·
    <a href="#-environment-variables"><b>Env</b></a>
    ·
    <a href="#-deployment"><b>Deployment</b></a>
  </p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/github/stars/akshitsutharr/beatshelf?style=for-the-badge" />
    <img src="https://img.shields.io/github/forks/akshitsutharr/beatshelf?style=for-the-badge" />
    <img src="https://img.shields.io/github/issues/akshitsutharr/beatshelf?style=for-the-badge" />
    <img src="https://img.shields.io/github/license/akshitsutharr/beatshelf?style=for-the-badge" />
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
    <img src="https://img.shields.io/badge/React-19-087ea4?style=for-the-badge&logo=react" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" />
    <img src="https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwindcss" />
    <img src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=for-the-badge&logo=supabase" />
    <img src="https://img.shields.io/badge/Spotify-Web%20API-1DB954?style=for-the-badge&logo=spotify" />
  </p>
</div>

---

## ✨ What is BeatShelf?

**BeatShelf** is a full-stack music discovery & community review platform inspired by the “Letterboxd for music” vibe — built for people who love discovering tracks and writing opinions that *look good and feel personal*.

You can:
- Explore tracks via Spotify
- Write reviews + rate songs
- Curate favorites/collections
- Share stylish review cards for socials
- Enjoy a fast, modern UI (Tailwind + Radix + shadcn/ui style stack)

> Live: https://beatshelf.vercel.app

---

## 🔥 Features

### 🎵 Discovery
- Search tracks / artists / albums
- Browse trending & curated music experiences
- Track detail pages with rich metadata

### ✍️ Reviews & Ratings
- Write in-depth reviews
- Rate tracks (1.0 → 5.0)
- Community-first engagement patterns

### 💾 Collections
- Favorites / saved music
- Personal library and revisitable taste graph

### 🌙 Modern UI/UX
- Tailwind CSS styling
- Radix UI primitives + shadcn/ui approach
- Animations (Framer Motion)
- Icons (Lucide)
- Toasts/notifications (Sonner)

### 🔐 Auth + Data
- Auth: **Clerk** (`@clerk/nextjs`)
- Database + realtime-ready backend: **Supabase** (`@supabase/supabase-js`)
- Spotify Web API integration

---

## 🧱 Tech Stack

**Frontend**
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS (+ `tailwindcss-animate`)
- Radix UI + shadcn/ui ecosystem utilities
- Framer Motion

**Backend / Data**
- Supabase (PostgreSQL + policies)
- Spotify Web API
- Prisma (`prisma`, `@prisma/client`) *(present in deps — used for DB access if configured)*

**DX / Tooling**
- ESLint (via `next lint`)
- next-sitemap

---

## 📁 Project Structure (high-level)

Common folders you have in this repo:
- `app/` — Next.js App Router routes, layouts, pages
- `components/` — UI building blocks (Radix/shadcn-like components)
- `contexts/` — React contexts (global state)
- `hooks/` — custom hooks
- `lib/` — utilities (API clients, helpers, constants)
- `public/` — static assets (logo/icons, etc.)
- `styles/` — global styles/theme tokens
- `sql/` — database scripts (policies, etc.)
- `scripts/` — utility scripts (if any)

---

## ✅ Requirements

- **Node.js**: 18+ recommended (works best with modern Next/React)
- **npm**: repo currently uses `package-lock.json` (npm workflow)
- Accounts/keys:
  - Spotify Developer account (Client ID/Secret)
  - Supabase project (URL + keys)
  - Clerk project (publishable + secret keys)

---

## 🚀 Getting Started

### 1) Clone
```bash
git clone https://github.com/akshitsutharr/beatshelf.git
cd beatshelf
```

### 2) Install
```bash
npm install
```

### 3) Create `.env.local`
```bash
touch .env.local
```

### 4) Run Dev Server
```bash
npm run dev
```

Now open:
- http://localhost:3000

---

## 🔑 Environment Variables

Create `.env.local` and add your keys.

### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Spotify
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### Clerk (Auth)
> Clerk is installed in dependencies (`@clerk/nextjs`). If your app uses it (likely), you’ll need:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

> If you’re using OAuth callbacks, also configure your **Spotify Redirect URI** + Clerk domain URLs accordingly.

---

## 🗄️ Database (Supabase)

This repo includes SQL scripts under `sql/`.

### Policies
There is at least one policy file:
- `sql/scripts/02-create-policies.sql`

It includes RLS-style policies and constraints.  
**Important:** It references tables like `movies` and `reviews` — if you renamed tables during development, verify your schema is aligned before running scripts in production.

### Suggested Setup Flow
1. Create a Supabase project
2. Enable authentication providers you use (if any)
3. Create your tables/schema
4. Enable RLS + apply policies
5. Paste and run SQL from `sql/scripts/*` in Supabase SQL Editor

---

## 🧪 Scripts

From `package.json`:

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Lint (Next.js ESLint) |
| `npm run postbuild` | Generates sitemap via `next-sitemap` |

---

## 🖼️ Screenshots / Preview

Add screenshots here to make the README even more “crazy modern”:

```md
![Home](./public/screenshots/home.png)
![Track Page](./public/screenshots/track.png)
![Review Composer](./public/screenshots/review.png)
```

> Tip: Create `public/screenshots/` and drop images in.

---

## 🌍 Deployment

### Vercel (Recommended)
1. Push repo to GitHub (already done)
2. Import project in Vercel
3. Add environment variables in Vercel Project Settings:
   - Supabase keys
   - Spotify keys
   - Clerk keys (if used)
4. Deploy

---

## 🧠 Notes / Implementation Details

- `next.config.mjs` currently has:
  - `typescript.ignoreBuildErrors = true`  
  - `images.unoptimized = true`

If you want stricter production safety, consider removing `ignoreBuildErrors` once the codebase is stable.

---

## 🤝 Contributing

PRs are welcome.

### Workflow
1. Fork the repo
2. Create a branch: `git checkout -b feat/amazing-feature`
3. Commit: `git commit -m "feat: add amazing feature"`
4. Push and open a PR

### What you can improve
- UI polish & accessibility
- Search/filters and discovery pages
- Review editor experience
- Better DB migrations + schema documentation
- Add tests (unit/e2e)

---

## 📄 License

MIT — see [`LICENSE`](./LICENSE)

---

## 🙏 Credits

Built by **Akshit Suthar**  
- GitHub: https://github.com/akshitsutharr  
- Live App: https://beatshelf.vercel.app

Shout-out to:
- Spotify Web API
- Supabase
- Next.js + React
- Tailwind CSS
- Radix UI / shadcn/ui ecosystem
- Vercel

---

<div align="center">
  <h3>⭐ If you like BeatShelf, give it a star!</h3>
  <p>BeatShelf — where music meets community.</p>
</div>
