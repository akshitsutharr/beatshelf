# 🎵 BeatShelf - Music Discovery Platform

<div align="center">
  <img src="/icon1.png?height=120&width=120" alt="BeatShelf Logo" width="120" height="120">
  
  **Discover, Review, and Share Your Musical Journey**
  
  [![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![Spotify API](https://img.shields.io/badge/Spotify-API-1DB954?style=for-the-badge&logo=spotify)](https://developer.spotify.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  
  [Live Demo](https://beatshelf.vercel.app) • [Documentation](#documentation) • [Contributing](#contributing) • [Support](#support)
</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Performance](#performance)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## 🌟 Overview

**BeatShelf** is a full-stack music discovery platform built with Next.js 14 and Spotify's API. Users can discover music, write reviews, rate songs, and build collections.

### 🎯 Mission
Create a community-driven music discovery experience for exploring, reviewing, and sharing tracks.

### 🏆 Key Highlights
- Access to 50M+ songs via Spotify
- Real-time reviews and ratings
- Advanced search and social features
- Responsive, modern UI

---

## ✨ Features

### 🎵 Music Discovery
- Search by song, artist, album, or genre
- Trending tracks, new releases, and charts
- Genre exploration and random discovery

### 👤 User Experience
- Personalized profiles with stats and activity
- Rich text reviews and 5-star ratings
- Favorites collection and dashboard
- Customizable settings

### 🔍 Advanced Features
- Real-time sync and dark theme
- Optimized performance and accessibility
- Intuitive navigation with animations and notifications

---

## 🛠 Tech Stack

### Frontend
- Next.js 14 (App Router) with TypeScript
- Tailwind CSS, Radix UI, shadcn/ui
- Lucide React icons, React Context for state

### Backend
- Node.js (Next.js API Routes)
- Supabase (PostgreSQL, Auth, Realtime, Storage)
- Spotify Web API

### Tools
- npm, ESLint, Prettier, TypeScript
- Vercel for hosting and analytics

---

## 🏗 Architecture

The system uses a client-server model: Frontend (Next.js) interacts with Backend API Routes, which connect to Supabase for data/storage and Spotify for music data. Data flows from user interactions to API calls, database updates, and real-time UI syncs via Supabase Realtime.

### Component Structure
- Pages/Components for UI
- Contexts/Hooks for state
- Utils/API Routes for logic

---

## 🚀 Installation

### Prerequisites

- Node.js 18+, npm 9+, Git
- Supabase and Spotify accounts

### Steps

```bash
# Clone the repo
git clone https://github.com/akshitsuthar/beatshelf.git && cd beatshelf

# Install dependencies
npm install

# Create environment file
touch .env.local
```

### Add the following to `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

```bash
# Run the development server
npm run dev

# Visit the app
http://localhost:3000
```

---

## ⚙️ Configuration

### Supabase
- Create project in Supabase Dashboard
- Enable email auth
- Run SQL scripts for tables, policies, and functions (see scripts/ folder)

### Spotify
- Create app in Spotify Developer Dashboard
- Note Client ID/Secret and set redirect URIs

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase URL | ✅ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Anon key | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | Service key | ✅ |
| SPOTIFY_CLIENT_ID | Spotify ID | ✅ |
| SPOTIFY_CLIENT_SECRET | Spotify secret | ✅ |

---

## 📱 Usage

### Authentication
- Sign up at /auth/signup (email, username, password)
- Sign in at /auth/signin

### Core Usage
- Search music: Use /search or API like `/api/spotify/search?q=Beatles`
- Write reviews: Go to /write-review, select song, rate, and publish
- Manage favorites: Heart icon on songs; view at /favorites
- Dashboard: View stats at /dashboard

---

## 🔌 API Documentation

### Auth

- `POST /api/auth/signup` – Register new user

### Music

- `GET /api/spotify/search?q=` – Search music
- `GET /api/spotify/trending` – Trending tracks
- `GET /api/spotify/track/[id]` – Song details

### User

- `GET /api/user/profile` – Get user profile
- `GET /api/user/reviews` – Get user's reviews
- `GET /api/user/favorites` – Get favorite songs

---

## 🗄️ Database Schema

### Tables

- `profiles`: Users (UUID, username, avatar)
- `songs`: Tracks (ID, name, artist, album)
- `reviews`: Reviews (UUID, user\_id, song\_id, content)
- `ratings`: Ratings (UUID, user\_id, song\_id, rating)
- `favorites`: Favorite songs (UUID, user\_id, song\_id)

### Relationships

- One-to-Many (Users → Reviews, Ratings, Favorites)
- Indexed on `user_id`, `song_id`, `artist_name` for speed

---

## 🔐 Authentication

Flow: Register/login with email/password/username; JWT sessions via Supabase.

Security: RLS, password hashing, rate limiting.

Protected Routes: /dashboard, /write-review, /favorites, /settings.

Public Routes: /, /search, /song/[id], /trending.

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

- Add environment variables in Vercel Dashboard
- Configure domain and HTTPS

```json
// Build config
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

---

## ⚡ Performance

Optimizations: Code splitting, lazy loading, image optimization, API caching, database indexing.

Monitoring: Vercel Analytics for vitals and errors.

---

## 🤝 Contributing

Fork, clone, branch, change, test, PR.

Guidelines: Use TypeScript, follow code style, meaningful commits (e.g., "feat: add feature").

Areas: Bug fixes, features, docs, UI, performance.

Report issues on GitHub.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details. Allows commercial use, modification, distribution.

---

## 🙏 Credits

Created by **Akshit Suthar**:
- Portfolio: [Akshit Suthar](https://akshitsuthar.vercel.app)
- LinkedIn: [Akshitsuthar](https://www.linkedin.com/in/akshit-suthar-312407314)
- GitHub: [github.com/akshitsutharr](https://github.com/akshitsutharr)

Thanks to Spotify, Supabase, Vercel, Next.js, Tailwind, Radix UI, shadcn/ui.

Inspiration: Letterboxd, Spotify, Apple Music.

---

<div align="center">
  <h3>🎵 Made with ❤️ by Akshit Suthar</h3>
  <p>BeatShelf - Where Music Meets Community</p>
  
  [![GitHub stars](https://img.shields.io/github/stars/akshitsuthar/beatshelf?style=social)](https://github.com/akshitsutharr/beatshelf/stargazers)
  [![GitHub issues](https://img.shields.io/github/issues/akshitsuthar/beatshelf)](https://github.com/akshitsutharr/beatshelf/issues)
  
  **⭐ Star if helpful!**
</div>
