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
