-- Apply manually against the Neon DB before merging the matching schema.ts change.
-- Additive, has a default, safe to run on a live table.
--
-- Migration tracking is not yet wired up for this project; see issue/TODO to
-- adopt drizzle-kit migrations properly. Until then, SQL files in this folder
-- are the canonical record of schema changes.

ALTER TABLE articles
  ADD COLUMN view_count integer NOT NULL DEFAULT 0;
