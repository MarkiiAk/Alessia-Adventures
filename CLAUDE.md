# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive birthday invitation platform for Alessia's 3rd birthday Disneyland trip (Aug 31 – Sep 3, 2026). Combines a personalized Disney-themed invitation page with an admin dashboard for guest management.

**Hosted on Vercel. Database: PostgreSQL via Neon (serverless). Avatar storage: Dropbox.**

## Commands

### Root project
```bash
npm run build          # Build root project
```

### Invitation subproject (`invites/turns3/`)
```bash
npm run build          # Webpack bundle + Prisma generate
npm run build:dev      # Development mode bundle
npm start              # Run server.js
npm run dev            # Build dev + start
npm run db:generate    # Regenerate Prisma client
npm run db:push        # Push schema changes to Neon DB
npm run vercel-build   # Vercel CI build
```

## Architecture

Two semi-independent layers share the same Neon database:

### 1. Event Management Layer (root)
- `index.html` + `src/scripts/events.js` — public events listing
- `admin-event.html` + `src/scripts/admin-event.js` — full admin CRUD dashboard
- `api/` — Vercel serverless functions (no framework, plain Node.js `req/res`)

### 2. Invitation Layer (`invites/turns3/`)
- `turns3.html` — the personalized invitation page guests receive
- `js/main.js` — `InvitationManager` class handles URL param parsing, personalization, countdown, animations
- `js/guests-manager.js` — loads and renders the guest team section
- Bundled by Webpack into `dist/`

### Database Schema
```
events (id UUID, name, description, event_date, invitation_route)
guests (id UUID, name, nickname, avatar URL, email, phone)
invitations (id UUID, guest_id→guests, event_id→events, status: 1=Confirmed 2=Declined 3=Pending)
```

### API Endpoints (`api/`)
| File | Methods | Purpose |
|------|---------|---------|
| `events.js` | GET | Public event listing |
| `rsvp.js` | POST | Guest RSVP (creates guest + invitation row) |
| `admin-events.js` | GET/POST/PUT/DELETE | Full event + guest management |
| `get-guests.js` | GET | Fetch guests with avatars and status |
| `upload-avatar.js` | POST | Upload avatar to Dropbox, returns public URL |

### Environment Variables Required
- `DATABASE_URL` — Neon PostgreSQL connection string
- Dropbox credentials (for `upload-avatar.js`)

## Key Patterns

**Personalized guest URLs**: Each guest receives a URL with params that `InvitationManager` reads to personalize the page (name, nickname, avatar, status).

**Avatar flow**: Admin uploads file → `upload-avatar.js` posts to Dropbox → returns public URL → stored in `guests.avatar` column → rendered in invitation and admin table.

**Guest reordering**: Admin panel holds in-memory array order, sends full reordered list to `PUT /api/admin-events` which updates DB sequence.

**Invitation subproject is standalone**: `invites/turns3/` has its own `package.json`, Prisma client, and can be deployed independently. Its `api/` folder mirrors some root endpoints.
