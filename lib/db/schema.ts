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
