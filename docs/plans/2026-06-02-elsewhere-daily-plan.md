# Elsewhere Daily — V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a reader-first article site with a CMS API for OpenClaw to push drafts to, a single-admin review/publish workflow, and strong SEO via ISR.

**Architecture:** Next.js 15 App Router on Vercel with Neon (serverless Postgres) via Drizzle ORM. Article pages are statically generated and revalidated on-demand when published. Admin is a password-protected section at `/admin`. OpenClaw submits drafts via `POST /api/articles` with a Bearer token.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Drizzle ORM, `@neondatabase/serverless`, `react-markdown`, `rehype-highlight`, `remark-gfm`, `feed`, `jose` (JWT auth), Vitest

---

> **Next.js 15 async APIs — read this before touching any page or route:**
> In Next.js 15, `params`, `searchParams`, `cookies()`, and `headers()` are all **async** and must be awaited.
> ```typescript
> // Pages / layouts
> export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
>   const { slug } = await params
> }
> // generateMetadata
> export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
>   const { slug } = await params
> }
> // Route handlers
> export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
>   const { id } = await params
> }
> // cookies / headers
> const cookieStore = await cookies()
> ```
> **If you forget this, TypeScript will not catch it — you'll get runtime errors.**

---

### Task 1: Initialize git and commit design doc

**Files:**
- Create: `.gitignore` (at project root)

**Step 1: Initialize git**

```bash
cd /data/projects/apps/elsewhere-daily
git init
```
Expected: `Initialized empty Git repository`

**Step 2: Create .gitignore**

Create `/data/projects/apps/elsewhere-daily/.gitignore`:
```
node_modules/
.next/
.env
.env.local
.env*.local
drizzle/
*.tsbuildinfo
```

**Step 3: Stage and commit design doc + gitignore**

```bash
git add docs/ .gitignore
git commit -m "docs: add V1 design document"
```
Expected: 1 commit on main

---

### Task 2: Scaffold Next.js project

**Files:**
- Creates everything via `create-next-app`

**Step 1: Scaffold**

```bash
cd /data/projects/apps/elsewhere-daily
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --no-turbopack
```

Accept all defaults. Say **no** to the example app if prompted.

**Step 2: Install additional dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless react-markdown rehype-highlight remark-gfm feed jose
npm install -D drizzle-kit tsx vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

**Step 3: Add scripts to package.json**

In `package.json`, add to the `"scripts"` block:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:seed": "tsx lib/db/seed.ts",
"test": "vitest",
"test:run": "vitest run"
```

**Step 4: Verify build works**

```bash
npm run build
```
Expected: Builds successfully with no errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with dependencies"
```

---

### Task 3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

**Step 1: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

**Step 2: Create tests/setup.ts**

```typescript
import '@testing-library/jest-dom'
```

**Step 3: Verify tests run (empty suite)**

```bash
npm test -- --run
```
Expected: `No test files found` or 0 tests passing — no errors.

**Step 4: Commit**

```bash
git add vitest.config.ts tests/
git commit -m "chore: configure Vitest test environment"
```

---

### Task 4: Slug utility (TDD)

**Files:**
- Create: `tests/utils/slug.test.ts`
- Create: `lib/utils/slug.ts`

**Step 1: Write failing tests**

Create `tests/utils/slug.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/utils/slug'

describe('generateSlug', () => {
  it('converts title to lowercase kebab-case', () => {
    expect(generateSlug('The Case for Slowing Down')).toBe('the-case-for-slowing-down')
  })

  it('strips special characters', () => {
    expect(generateSlug("What's Next?")).toBe('whats-next')
  })

  it('collapses multiple spaces', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world')
  })

  it('collapses consecutive hyphens', () => {
    expect(generateSlug('A -- B')).toBe('a-b')
  })

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('  hello  ')).toBe('hello')
  })
})
```

**Step 2: Run tests — verify they fail**

```bash
npm test -- --run tests/utils/slug.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/utils/slug'`

**Step 3: Create lib/utils/slug.ts**

```typescript
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
```

**Step 4: Run tests — verify they pass**

```bash
npm test -- --run tests/utils/slug.test.ts
```
Expected: 5 tests passing

**Step 5: Commit**

```bash
git add tests/utils/slug.test.ts lib/utils/slug.ts
git commit -m "feat: add slug generation utility"
```

---

### Task 5: Excerpt utility (TDD)

**Files:**
- Create: `tests/utils/excerpt.test.ts`
- Create: `lib/utils/excerpt.ts`

**Step 1: Write failing tests**

Create `tests/utils/excerpt.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { extractExcerpt } from '@/lib/utils/excerpt'

describe('extractExcerpt', () => {
  it('extracts first non-heading paragraph', () => {
    const md = '# Title\n\nFirst paragraph here.\n\nSecond paragraph.'
    expect(extractExcerpt(md)).toBe('First paragraph here.')
  })

  it('skips multiple heading levels', () => {
    const md = '# H1\n\n## H2\n\nActual content.'
    expect(extractExcerpt(md)).toBe('Actual content.')
  })

  it('truncates to maxLength', () => {
    const md = `# Title\n\n${'a'.repeat(200)}`
    expect(extractExcerpt(md)).toHaveLength(160)
  })

  it('respects custom maxLength', () => {
    const md = '# Title\n\nSome content here.'
    expect(extractExcerpt(md, 7)).toBe('Some co')
  })

  it('returns empty string when no prose found', () => {
    expect(extractExcerpt('# Only headings\n\n## Another')).toBe('')
  })

  it('skips blank lines', () => {
    expect(extractExcerpt('\n\n\n# Title\n\nContent.')).toBe('Content.')
  })
})
```

**Step 2: Run tests — verify they fail**

```bash
npm test -- --run tests/utils/excerpt.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/utils/excerpt'`

**Step 3: Create lib/utils/excerpt.ts**

```typescript
export function extractExcerpt(markdown: string, maxLength = 160): string {
  const lines = markdown.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      return trimmed.slice(0, maxLength)
    }
  }
  return ''
}
```

**Step 4: Run tests — verify they pass**

```bash
npm test -- --run tests/utils/excerpt.test.ts
```
Expected: 6 tests passing

**Step 5: Commit**

```bash
git add tests/utils/excerpt.test.ts lib/utils/excerpt.ts
git commit -m "feat: add excerpt extraction utility"
```

---

### Task 6: Article payload validation utility (TDD)

**Files:**
- Create: `tests/utils/validate-article-payload.test.ts`
- Create: `lib/utils/validate-article-payload.ts`

This is the validation logic used by `POST /api/articles`. Tested here as a pure function — the route handler stays thin.

**Step 1: Write failing tests**

Create `tests/utils/validate-article-payload.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { validateArticlePayload } from '@/lib/utils/validate-article-payload'

describe('validateArticlePayload', () => {
  it('accepts valid payload with required fields only', () => {
    const result = validateArticlePayload({ title: 'Hello', content: 'Body text' })
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.data.title).toBe('Hello')
      expect(result.data.tags).toEqual([])
    }
  })

  it('accepts valid payload with all optional fields', () => {
    const result = validateArticlePayload({
      title: 'Hello',
      content: 'Body',
      excerpt: 'Short',
      tags: ['a', 'b'],
    })
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.data.excerpt).toBe('Short')
      expect(result.data.tags).toEqual(['a', 'b'])
    }
  })

  it('rejects missing title', () => {
    const result = validateArticlePayload({ content: 'Body' })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toMatch(/title/)
  })

  it('rejects empty title', () => {
    const result = validateArticlePayload({ title: '   ', content: 'Body' })
    expect(result.valid).toBe(false)
  })

  it('rejects missing content', () => {
    const result = validateArticlePayload({ title: 'Hello' })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toMatch(/content/)
  })

  it('rejects non-string excerpt', () => {
    const result = validateArticlePayload({ title: 'H', content: 'C', excerpt: 123 })
    expect(result.valid).toBe(false)
  })

  it('rejects non-array tags', () => {
    const result = validateArticlePayload({ title: 'H', content: 'C', tags: 'tag' })
    expect(result.valid).toBe(false)
  })

  it('rejects non-string tag items', () => {
    const result = validateArticlePayload({ title: 'H', content: 'C', tags: [1, 2] })
    expect(result.valid).toBe(false)
  })

  it('rejects non-object body', () => {
    expect(validateArticlePayload(null).valid).toBe(false)
    expect(validateArticlePayload('string').valid).toBe(false)
  })
})
```

**Step 2: Run — verify fail**

```bash
npm test -- --run tests/utils/validate-article-payload.test.ts
```

**Step 3: Create lib/utils/validate-article-payload.ts**

```typescript
export interface ArticlePayload {
  title: string
  content: string
  excerpt?: string
  tags: string[]
}

type ValidationResult =
  | { valid: true; data: ArticlePayload }
  | { valid: false; error: string }

export function validateArticlePayload(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const { title, content, excerpt, tags } = body as Record<string, unknown>

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return { valid: false, error: 'title is required and must be a non-empty string' }
  }
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return { valid: false, error: 'content is required and must be a non-empty string' }
  }
  if (excerpt !== undefined && typeof excerpt !== 'string') {
    return { valid: false, error: 'excerpt must be a string' }
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')) {
      return { valid: false, error: 'tags must be an array of strings' }
    }
  }

  return {
    valid: true,
    data: {
      title: title.trim(),
      content: content.trim(),
      excerpt: typeof excerpt === 'string' ? excerpt.trim() : undefined,
      tags: Array.isArray(tags) ? (tags as string[]) : [],
    },
  }
}
```

**Step 4: Run — verify pass**

```bash
npm test -- --run tests/utils/validate-article-payload.test.ts
```
Expected: 9 tests passing

**Step 5: Commit**

```bash
git add tests/utils/validate-article-payload.test.ts lib/utils/validate-article-payload.ts
git commit -m "feat: add article payload validation utility"
```

---

### Task 7: Drizzle schema + database client

**Files:**
- Create: `lib/db/schema.ts`
- Create: `lib/db/index.ts`
- Create: `lib/db/seed.ts`
- Create: `drizzle.config.ts`
- Create: `.env.local` (not committed)

**Step 1: Create Drizzle config**

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

**Step 2: Create database schema**

Create `lib/db/schema.ts`:
```typescript
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'

export const articleStatusEnum = pgEnum('article_status', ['draft', 'published'])

export const authors = pgTable('authors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  bio: text('bio'),
})

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  content: text('content'),
  excerpt: text('excerpt'),
  status: articleStatusEnum('status').default('draft').notNull(),
  tags: text('tags').array().default([]).notNull(),
  isPremium: boolean('is_premium').default(false).notNull(),
  authorId: uuid('author_id').references(() => authors.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Author = typeof authors.$inferSelect
export type Article = typeof articles.$inferSelect
export type NewArticle = typeof articles.$inferInsert
```

**Step 3: Create database client**

Create `lib/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

**Step 4: Create seed file**

Create `lib/db/seed.ts`:
```typescript
import { db } from './index'
import { authors } from './schema'

async function seed() {
  await db.insert(authors).values({
    name: 'Elsewhere Daily',
    slug: 'elsewhere-daily',
  }).onConflictDoNothing()
  console.log('Seeded: 1 author')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

**Step 5: Create .env.local (not committed)**

Create `.env.local` at project root:
```
DATABASE_URL=<your-neon-connection-string>
SESSION_SECRET=<random-32-char-string>
ADMIN_PASSWORD=<your-chosen-admin-password>
OPENCLAW_API_KEY=<random-api-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Generate secrets with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**Step 6: Run migrations and seed**

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```
Expected: Migration files created in `drizzle/`, tables created in Neon, seed confirms 1 author.

**Step 7: Commit (exclude .env.local)**

```bash
git add lib/db/ drizzle.config.ts
git commit -m "feat: add Drizzle schema and database client"
```

---

### Task 8: Database query functions

**Files:**
- Create: `lib/db/queries.ts`

**Step 1: Create query functions**

Create `lib/db/queries.ts`:
```typescript
import { db } from './index'
import { articles, authors } from './schema'
import { eq, desc, count, and } from 'drizzle-orm'

export const PAGE_SIZE = 20

export async function getPublishedArticles(page: number) {
  const offset = (page - 1) * PAGE_SIZE
  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        publishedAt: articles.publishedAt,
        authorName: authors.name,
      })
      .from(articles)
      .leftJoin(authors, eq(articles.authorId, authors.id))
      .where(eq(articles.status, 'published'))
      .orderBy(desc(articles.publishedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(articles).where(eq(articles.status, 'published')),
  ])
  return { articles: rows, total: Number(countRows[0].total) }
}

export async function getPublishedArticleSlugs() {
  return db
    .select({ slug: articles.slug })
    .from(articles)
    .where(eq(articles.status, 'published'))
}

export async function getArticleBySlug(slug: string) {
  const [article] = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      content: articles.content,
      excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
      authorName: authors.name,
    })
    .from(articles)
    .leftJoin(authors, eq(articles.authorId, authors.id))
    .where(and(eq(articles.slug, slug), eq(articles.status, 'published')))
    .limit(1)
  return article ?? null
}

export async function getAllPublishedArticlesForFeed() {
  return db
    .select({
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
      authorName: authors.name,
    })
    .from(articles)
    .leftJoin(authors, eq(articles.authorId, authors.id))
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt))
    .limit(50)
}

export async function getDraftArticles() {
  return db
    .select()
    .from(articles)
    .where(eq(articles.status, 'draft'))
    .orderBy(desc(articles.createdAt))
}

export async function getArticleById(id: string) {
  const [article] = await db.select().from(articles).where(eq(articles.id, id)).limit(1)
  return article ?? null
}

export async function getDefaultAuthorId(): Promise<string | null> {
  const [author] = await db
    .select({ id: authors.id })
    .from(authors)
    .where(eq(authors.slug, 'elsewhere-daily'))
    .limit(1)
  return author?.id ?? null
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add lib/db/queries.ts
git commit -m "feat: add typed database query functions"
```

---

### Task 9: Admin auth utilities + middleware

**Files:**
- Create: `lib/auth.ts`
- Create: `middleware.ts`

**Step 1: Create auth utilities**

Create `lib/auth.ts`:
```typescript
import { SignJWT, jwtVerify } from 'jose'

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!)

export const COOKIE_NAME = 'elsewhere-admin-token'

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ isAdmin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret())
    return true
  } catch {
    return false
  }
}
```

**Step 2: Create middleware**

Create `middleware.ts` at project root:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth'

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/api/admin/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected =
    (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
    !PUBLIC_ADMIN_PATHS.includes(pathname)

  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verifySessionToken(token))) {
    if (pathname.startsWith('/api/')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add lib/auth.ts middleware.ts
git commit -m "feat: add JWT session auth and admin middleware"
```

---

### Task 10: Core layout

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/globals.css` (already exists, update it)
- Create: `components/Header.tsx`
- Create: `components/Footer.tsx`

**Step 1: Update globals.css**

Replace `app/globals.css` contents with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 2: Create Header component**

Create `components/Header.tsx`:
```typescript
import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-gray-200 py-4">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/" className="text-xl font-semibold tracking-tight text-gray-900 hover:text-gray-600">
          Elsewhere Daily
        </Link>
      </div>
    </header>
  )
}
```

**Step 3: Create Footer component**

Create `components/Footer.tsx`:
```typescript
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-6 mt-16">
      <div className="max-w-2xl mx-auto px-4 text-sm text-gray-500 flex gap-4">
        <span>© {new Date().getFullYear()} Elsewhere Daily</span>
        <Link href="/rss.xml" className="hover:text-gray-700">RSS</Link>
      </div>
    </footer>
  )
}
```

**Step 4: Update app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Elsewhere Daily',
  description: 'An AI-powered daily newsletter.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-white text-gray-900 antialiased`}>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-10">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

**Step 5: Verify dev server starts**

```bash
npm run dev
```
Open `http://localhost:3000` — should show header and footer.

**Step 6: Commit**

```bash
git add app/layout.tsx app/globals.css components/
git commit -m "feat: add core layout with header and footer"
```

---

### Task 11: ArticleCard and Pagination components

**Files:**
- Create: `components/ArticleCard.tsx`
- Create: `components/Pagination.tsx`

**Step 1: Create ArticleCard**

Create `components/ArticleCard.tsx`:
```typescript
import Link from 'next/link'

interface Props {
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | null
  authorName: string | null
}

export default function ArticleCard({ title, slug, excerpt, publishedAt, authorName }: Props) {
  const date = publishedAt
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(publishedAt)
    : null

  return (
    <article className="py-6 border-b border-gray-100 last:border-0">
      <Link href={`/${slug}`} className="group">
        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-gray-600 mb-1">
          {title}
        </h2>
      </Link>
      {excerpt && <p className="text-gray-600 text-sm leading-relaxed mb-2">{excerpt}</p>}
      <div className="text-xs text-gray-400 flex gap-2">
        {authorName && <span>{authorName}</span>}
        {date && <span>{date}</span>}
      </div>
    </article>
  )
}
```

**Step 2: Create Pagination**

Create `components/Pagination.tsx`:
```typescript
import Link from 'next/link'

interface Props {
  page: number
  total: number
  pageSize: number
}

export default function Pagination({ page, total, pageSize }: Props) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  return (
    <nav className="flex justify-between mt-8 text-sm">
      {page > 1 ? (
        <Link href={`/?page=${page - 1}`} className="text-gray-500 hover:text-gray-900">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-gray-400">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`/?page=${page + 1}`} className="text-gray-500 hover:text-gray-900">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
```

**Step 3: Commit**

```bash
git add components/ArticleCard.tsx components/Pagination.tsx
git commit -m "feat: add ArticleCard and Pagination components"
```

---

### Task 12: Homepage — article newsfeed

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace app/page.tsx**

```typescript
import { getPublishedArticles, PAGE_SIZE } from '@/lib/db/queries'
import ArticleCard from '@/components/ArticleCard'
import Pagination from '@/components/Pagination'

export const revalidate = false

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const { articles, total } = await getPublishedArticles(page)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Latest</h1>
      {articles.length === 0 && (
        <p className="text-gray-500">No articles yet.</p>
      )}
      {articles.map((article) => (
        <ArticleCard key={article.id} {...article} />
      ))}
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
    </div>
  )
}
```

**Step 2: Verify in browser**

```bash
npm run dev
```
Open `http://localhost:3000` — should render "Latest" and "No articles yet." (or articles if any exist in DB).

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add homepage newsfeed with pagination"
```

---

### Task 13: Article detail page

**Files:**
- Create: `app/[slug]/page.tsx`
- Create: `components/ArticleContent.tsx`

**Step 1: Create ArticleContent component**

Create `components/ArticleContent.tsx`:
```typescript
'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

export default function ArticleContent({ content }: { content: string }) {
  return (
    <div className="prose prose-gray max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
```

> Note: `highlight.js/styles/github.css` requires installing `highlight.js` — it's a dep of `rehype-highlight` so it's already present, but you may need to add `"moduleResolution": "bundler"` to tsconfig if the import fails.

**Step 2: Create app/[slug]/page.tsx**

```typescript
import { notFound } from 'next/navigation'
import { getArticleBySlug, getPublishedArticleSlugs } from '@/lib/db/queries'
import ArticleContent from '@/components/ArticleContent'
import type { Metadata } from 'next'

export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getPublishedArticleSlugs()
  return slugs.map((s) => ({ slug: s.slug }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  return {
    title: `${article.title} | Elsewhere Daily`,
    description: article.excerpt ?? undefined,
    alternates: { canonical: `${siteUrl}/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      url: `${siteUrl}/${slug}`,
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const date = article.publishedAt
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(article.publishedAt)
    : null

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
        <div className="text-sm text-gray-400 flex gap-2">
          {article.authorName && <span>{article.authorName}</span>}
          {date && <span>{date}</span>}
        </div>
      </header>
      <ArticleContent content={article.content ?? ''} />
    </article>
  )
}
```

**Step 3: Install Tailwind typography plugin (for prose classes)**

```bash
npm install -D @tailwindcss/typography
```

Add to `tailwind.config.ts`:
```typescript
plugins: [require('@tailwindcss/typography')],
```

**Step 4: Verify**

```bash
npm run build
```
Expected: Builds cleanly.

**Step 5: Commit**

```bash
git add app/[slug]/ components/ArticleContent.tsx tailwind.config.ts
git commit -m "feat: add article detail page with markdown rendering and SEO metadata"
```

---

### Task 14: Sitemap and robots.txt

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

**Step 1: Create sitemap**

Create `app/sitemap.ts`:
```typescript
import { MetadataRoute } from 'next'
import { getPublishedArticleSlugs } from '@/lib/db/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const slugs = await getPublishedArticleSlugs()

  return [
    { url: siteUrl, lastModified: new Date() },
    ...slugs.map((s) => ({
      url: `${siteUrl}/${s.slug}`,
      lastModified: new Date(),
    })),
  ]
}
```

**Step 2: Create robots.txt**

Create `app/robots.ts`:
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin' },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
```

**Step 3: Verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat: add sitemap and robots.txt"
```

---

### Task 15: RSS feed

**Files:**
- Create: `app/rss.xml/route.ts`

**Step 1: Create route**

Create `app/rss.xml/route.ts`:
```typescript
import { Feed } from 'feed'
import { getAllPublishedArticlesForFeed } from '@/lib/db/queries'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const feedArticles = await getAllPublishedArticlesForFeed()

  const feed = new Feed({
    title: 'Elsewhere Daily',
    description: 'An AI-powered daily newsletter.',
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    updated: feedArticles[0]?.publishedAt ?? new Date(),
    copyright: `© ${new Date().getFullYear()} Elsewhere Daily`,
    feedLinks: { rss2: `${siteUrl}/rss.xml` },
  })

  for (const article of feedArticles) {
    feed.addItem({
      title: article.title,
      id: `${siteUrl}/${article.slug}`,
      link: `${siteUrl}/${article.slug}`,
      description: article.excerpt ?? '',
      date: article.publishedAt ?? new Date(),
      author: [{ name: article.authorName ?? 'Elsewhere Daily' }],
    })
  }

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
```

> Note: In Next.js 15, GET route handlers are not cached by default, so `/rss.xml` will always reflect current data. No revalidation needed.

**Step 2: Verify**

```bash
npm run dev
```
Open `http://localhost:3000/rss.xml` — should return valid XML.

**Step 3: Commit**

```bash
git add app/rss.xml/
git commit -m "feat: add RSS 2.0 feed"
```

---

### Task 16: Admin login page and login API

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/api/admin/login/route.ts`
- Create: `app/admin/layout.tsx`

**Step 1: Create admin layout**

Create `app/admin/layout.tsx`:
```typescript
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
    </div>
  )
}
```

**Step 2: Create login API route**

Create `app/api/admin/login/route.ts`:
```typescript
import { cookies } from 'next/headers'
import { createSessionToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.password || body.password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = await createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return Response.json({ ok: true })
}
```

**Step 3: Create login page**

Create `app/admin/login/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Invalid password')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-24">
      <h1 className="text-xl font-semibold mb-6">Admin Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
```

**Step 4: Verify login flow**

```bash
npm run dev
```
- Open `http://localhost:3000/admin` — should redirect to `/admin/login`
- Enter wrong password — should show "Invalid password"
- Enter correct password (from `.env.local`) — should redirect to `/admin` (404 for now, that's fine)

**Step 5: Commit**

```bash
git add app/admin/ app/api/admin/
git commit -m "feat: add admin login page and JWT auth flow"
```

---

### Task 17: Admin dashboard

**Files:**
- Create: `app/admin/page.tsx`

**Step 1: Create dashboard**

Create `app/admin/page.tsx`:
```typescript
import Link from 'next/link'
import { getDraftArticles, getPublishedArticles } from '@/lib/db/queries'

export default async function AdminDashboard() {
  const [drafts, { articles: published }] = await Promise.all([
    getDraftArticles(),
    getPublishedArticles(1),
  ])

  const formatDate = (d: Date | null) =>
    d ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(d) : '—'

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
          View site →
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Drafts ({drafts.length})
        </h2>
        {drafts.length === 0 && <p className="text-gray-400 text-sm">No drafts.</p>}
        <ul className="space-y-2">
          {drafts.map((a) => (
            <li key={a.id} className="flex justify-between items-center bg-white border border-gray-200 rounded px-4 py-3">
              <Link href={`/admin/articles/${a.id}`} className="font-medium text-gray-900 hover:text-gray-600 text-sm">
                {a.title}
              </Link>
              <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Published
        </h2>
        {published.length === 0 && <p className="text-gray-400 text-sm">Nothing published yet.</p>}
        <ul className="space-y-2">
          {published.map((a) => (
            <li key={a.id} className="flex justify-between items-center bg-white border border-gray-200 rounded px-4 py-3">
              <Link href={`/admin/articles/${a.id}`} className="font-medium text-gray-900 hover:text-gray-600 text-sm">
                {a.title}
              </Link>
              <span className="text-xs text-gray-400">{formatDate(a.publishedAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
```

**Step 2: Verify**

```bash
npm run dev
```
Log in and confirm the dashboard loads at `/admin`.

**Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: add admin dashboard with drafts and published list"
```

---

### Task 18: Admin article review page

**Files:**
- Create: `app/admin/articles/[id]/page.tsx`
- Create: `app/admin/articles/[id]/ArticleEditor.tsx`

**Step 1: Create the client editor component**

Create `app/admin/articles/[id]/ArticleEditor.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Article } from '@/lib/db/schema'

export default function ArticleEditor({ article }: { article: Article }) {
  const [title, setTitle] = useState(article.title)
  const [slug, setSlug] = useState(article.slug)
  const [tags, setTags] = useState(article.tags.join(', '))
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    setMessage('')
    const res = await fetch(`/api/admin/articles/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    })
    setSaving(false)
    setMessage(res.ok ? 'Saved.' : 'Save failed.')
  }

  async function handlePublish() {
    setPublishing(true)
    const res = await fetch(`/api/admin/articles/${article.id}/publish`, { method: 'POST' })
    setPublishing(false)
    if (res.ok) {
      router.push('/admin')
    } else {
      setMessage('Publish failed.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <button onClick={handleSave} disabled={saving}
          className="bg-gray-200 text-gray-800 rounded px-4 py-2 text-sm hover:bg-gray-300 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        {article.status === 'draft' && (
          <button onClick={handlePublish} disabled={publishing}
            className="bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 disabled:opacity-50">
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        )}
        {message && <span className="text-sm text-gray-500">{message}</span>}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1 font-mono" />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide">Tags (comma-separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1" />
        </div>
      </div>

      <div className="border border-gray-200 rounded p-6">
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-4">Preview</h3>
        <div className="prose prose-gray max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content ?? ''}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Create the server page**

Create `app/admin/articles/[id]/page.tsx`:
```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArticleById } from '@/lib/db/queries'
import ArticleEditor from './ArticleEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminArticlePage({ params }: Props) {
  const { id } = await params
  const article = await getArticleById(id)
  if (!article) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
          ← Dashboard
        </Link>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          {article.status}
        </span>
      </div>
      <ArticleEditor article={article} />
    </div>
  )
}
```

**Step 3: Verify**

```bash
npm run dev
```
Navigate to `/admin/articles/<some-id>` if a draft exists. Confirm the editor and preview render.

**Step 4: Commit**

```bash
git add app/admin/articles/
git commit -m "feat: add admin article review and edit page"
```

---

### Task 19: Admin article edit API

**Files:**
- Create: `app/api/admin/articles/[id]/route.ts`

**Step 1: Create PATCH route**

Create `app/api/admin/articles/[id]/route.ts`:
```typescript
import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)

  if (!body) return Response.json({ error: 'Invalid body' }, { status: 400 })

  const { title, slug, tags } = body as Record<string, unknown>
  const update: Record<string, unknown> = { updatedAt: new Date() }

  if (typeof title === 'string' && title.trim()) update.title = title.trim()
  if (typeof slug === 'string' && slug.trim()) update.slug = slug.trim()
  if (Array.isArray(tags) && tags.every((t) => typeof t === 'string')) update.tags = tags

  const [updated] = await db
    .update(articles)
    .set(update as Parameters<typeof db.update>[0])
    .where(eq(articles.id, id))
    .returning()

  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ ok: true })
}
```

**Step 2: Commit**

```bash
git add app/api/admin/articles/
git commit -m "feat: add admin article edit API"
```

---

### Task 20: Admin publish API

**Files:**
- Create: `app/api/admin/articles/[id]/publish/route.ts`

**Step 1: Create publish route**

Create `app/api/admin/articles/[id]/publish/route.ts`:
```typescript
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [article] = await db
    .update(articles)
    .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(articles.id, id))
    .returning()

  if (!article) return Response.json({ error: 'Not found' }, { status: 404 })

  revalidatePath(`/${article.slug}`)
  revalidatePath('/')

  return Response.json({ ok: true, slug: article.slug })
}
```

**Step 2: End-to-end verify**

```bash
npm run dev
```
1. Check the dashboard — confirm a draft appears
2. Open the draft article, click "Publish"
3. Should redirect to `/admin`
4. Visit `/<slug>` — article should be live
5. Homepage should show the article

**Step 3: Commit**

```bash
git add app/api/admin/articles/[id]/publish/
git commit -m "feat: add publish API with ISR revalidation"
```

---

### Task 21: OpenClaw article submission API

**Files:**
- Create: `app/api/articles/route.ts`

This is the external-facing endpoint OpenClaw calls. Auth is an API key in the `Authorization: Bearer <key>` header. It creates articles as drafts only.

Slug deduplication happens here with a DB loop — `generateSlug` produces the base slug, then we check for collisions and append a counter.

**Step 1: Create the route**

Create `app/api/articles/route.ts`:
```typescript
import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateArticlePayload } from '@/lib/utils/validate-article-payload'
import { generateSlug } from '@/lib/utils/slug'
import { extractExcerpt } from '@/lib/utils/excerpt'
import { getDefaultAuthorId } from '@/lib/db/queries'

async function findUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1)
    if (existing.length === 0) return slug
    attempt++
    slug = `${baseSlug}-${attempt}`
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || authHeader !== `Bearer ${process.env.OPENCLAW_API_KEY}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const validation = validateArticlePayload(body)
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 422 })
  }

  const { title, content, excerpt, tags } = validation.data
  const baseSlug = generateSlug(title)
  const slug = await findUniqueSlug(baseSlug)
  const resolvedExcerpt = excerpt ?? extractExcerpt(content)
  const authorId = await getDefaultAuthorId()

  const [article] = await db
    .insert(articles)
    .values({ title, slug, content, excerpt: resolvedExcerpt, tags, authorId })
    .returning({ id: articles.id, slug: articles.slug })

  return Response.json({ id: article.id, slug: article.slug }, { status: 201 })
}
```

**Step 2: Manually verify the endpoint**

```bash
npm run dev
```

```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Authorization: Bearer $(grep OPENCLAW_API_KEY .env.local | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Article","content":"# Test\n\nSome content here."}'
```
Expected: `{"id":"...","slug":"test-article"}` with status 201.

Verify the article appears in `/admin` as a draft.

**Step 3: Test rejection cases**

```bash
# Missing auth
curl -X POST http://localhost:3000/api/articles -H "Content-Type: application/json" -d '{}'
# Expected: 401

# Missing title
curl -X POST http://localhost:3000/api/articles \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d '{"content":"body"}'
# Expected: 422
```

**Step 4: Run all tests**

```bash
npm test -- --run
```
Expected: All utility tests still pass.

**Step 5: Commit**

```bash
git add app/api/articles/
git commit -m "feat: add OpenClaw article submission API with slug dedup"
```

---

### Task 22: Deploy to Vercel

**Step 1: Create Neon production database**

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project named `elsewhere-daily`
3. Copy the connection string (looks like `postgresql://user:pass@host/dbname?sslmode=require`)

**Step 2: Run migrations against production DB**

```bash
DATABASE_URL="<your-neon-connection-string>" npm run db:migrate
DATABASE_URL="<your-neon-connection-string>" npm run db:seed
```
Expected: Tables created, 1 author seeded.

**Step 3: Push to GitHub**

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

**Step 4: Deploy to Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
2. Framework: Next.js (auto-detected)
3. Add environment variables:
   - `DATABASE_URL` — Neon connection string
   - `SESSION_SECRET` — 32+ char random string
   - `ADMIN_PASSWORD` — your admin password
   - `OPENCLAW_API_KEY` — your chosen API key
   - `NEXT_PUBLIC_SITE_URL` — your Vercel URL (e.g. `https://elsewhere-daily.vercel.app`)
4. Deploy

**Step 5: Smoke test production**

- Visit the site URL — homepage loads
- Visit `/rss.xml` — valid XML
- Visit `/sitemap.xml` — valid XML
- Visit `/admin` — redirects to `/admin/login`
- Log in with `ADMIN_PASSWORD`
- POST a test article to the production API:

```bash
curl -X POST https://<your-site>/api/articles \
  -H "Authorization: Bearer <OPENCLAW_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"title":"First Article","content":"# Hello\n\nWelcome to Elsewhere Daily."}'
```
- Find it in `/admin`, publish it, confirm it appears on homepage and at `/<slug>`.

**Step 6: Final commit**

```bash
git add .
git commit -m "chore: production deployment verified"
```

---

## Environment Variables Reference

| Variable | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | Server, drizzle-kit | Neon connection string |
| `SESSION_SECRET` | `lib/auth.ts` | Min 32 chars, random |
| `ADMIN_PASSWORD` | `app/api/admin/login/route.ts` | Your login password |
| `OPENCLAW_API_KEY` | `app/api/articles/route.ts` | Bearer token for OpenClaw |
| `NEXT_PUBLIC_SITE_URL` | Metadata, RSS, sitemap | No trailing slash |
