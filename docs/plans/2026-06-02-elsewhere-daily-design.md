# Elsewhere Daily — V1 Design

**Date:** 2026-06-02
**Status:** Approved

## Overview

A reader-first website for Elsewhere Daily, an AI-powered daily newsletter. V1 delivers two things: a public-facing article feed with strong SEO, and a CMS with an API endpoint that OpenClaw (a self-hosted agentic LLM harness) can push articles to directly. The site replaces the manual copy-and-upload workflow currently used with Substack.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle |
| Styling | Tailwind CSS |
| Markdown rendering | react-markdown + rehype-highlight |
| RSS | feed library |
| Hosting | Vercel |

ISR (Incremental Static Regeneration) is used for article pages. Publishing an article calls `revalidatePath` to regenerate the static page immediately — crawlers receive fully pre-rendered HTML with no client-side JS dependency.

## Data Model

```sql
authors
├── id    uuid (primary key)
├── name  text (not null)
├── slug  text (unique)        -- reserved for future /authors/[slug] pages
└── bio   text (nullable)

articles
├── id           uuid (primary key)
├── title        text (not null)
├── slug         text (unique, not null)  -- URL: /the-article-slug
├── content      text                     -- raw markdown
├── excerpt      text                     -- ~160 chars; auto-derived if not provided
├── status       enum: draft | published
├── tags         text[]                   -- stored in V1, not surfaced in UI yet
├── is_premium   boolean (default false)  -- for future paywall support
├── author_id    uuid → authors.id
├── created_at   timestamptz
├── published_at timestamptz (nullable)
└── updated_at   timestamptz
```

V1 seeds one author row. `tags` and `is_premium` are stored now to avoid future migrations.

## Routes

### Public (statically generated + ISR)

| Route | Description |
|---|---|
| `/` | Paginated newsfeed — article cards (title, date, excerpt), newest first, ~20/page |
| `/[slug]` | Full article page — content, metadata, OG tags |
| `/rss.xml` | RSS 2.0 feed of published articles |
| `/sitemap.xml` | Auto-generated from published articles |
| `/robots.txt` | Allows all crawlers |

### Admin (server-rendered, password-protected)

| Route | Description |
|---|---|
| `/admin/login` | Password form; sets session cookie on success |
| `/admin` | Drafts queue + published articles list |
| `/admin/articles/[id]` | Review/edit draft; publish button triggers ISR revalidation |

Admin auth is a single password stored as `ADMIN_PASSWORD` env var, checked by Next.js middleware. No auth library needed for a single user.

### API

| Endpoint | Caller | Description |
|---|---|---|
| `POST /api/articles` | OpenClaw | Submit a new draft |
| `PATCH /api/articles/[id]` | Admin UI | Save edits to a draft |
| `PATCH /api/articles/[id]/publish` | Admin UI | Publish draft → triggers revalidation |

## OpenClaw API Contract

**`POST /api/articles`**

```http
Authorization: Bearer <OPENCLAW_API_KEY>
Content-Type: application/json

{
  "title": "The Case for Slowing Down",
  "content": "# The Case for Slowing Down\n\nFull markdown body...",
  "excerpt": "Optional. Auto-derived from first non-heading paragraph if omitted.",
  "tags": ["philosophy", "productivity"]
}
```

- `title` and `content` are required
- Slug is auto-generated from title, deduplicated with a numeric suffix on collision
- Always creates a `draft` — never auto-publishes
- Returns `201` with `{ id, slug }` on success
- Returns `401` on bad/missing API key, `422` on missing required fields

The API key is stored as `OPENCLAW_API_KEY` env var and rotated by updating Vercel env vars and OpenClaw config.

## SEO

- `generateMetadata` per article: title, excerpt as meta description, OG tags, `og:type=article`, `og:published_time`
- Canonical URL set to the slug-based URL on this site (avoids Substack duplicate-content issues)
- Sitemap updates automatically on publish via ISR — no rebuild required
- Homepage and article cards include enough text for crawlers to understand content without JS

## Future Considerations (not in V1)

The following are out of scope for V1 but accounted for in the data model and route structure:

- **Tag filtering:** `tags` column stored; `/tags/[tag]` route structure is clean
- **Author pages:** `authors.slug` reserved; `/authors/[slug]` is addable without migration
- **Monetization:** `is_premium` boolean ready; paywall logic and ad slots to be layered in
- **Email subscriptions:** Requires email service provider + subscriber storage; separate project
- **Social features:** Comments, saves, sharing — no schema today; article `id` is stable as a reference
- **Search:** Full-text search via Postgres `tsvector` on `title + content`; indexable without schema changes
