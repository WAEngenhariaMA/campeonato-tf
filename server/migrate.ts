import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from './db/index.js'

await migrate(db, { migrationsFolder: './drizzle' })
console.log('Migrations aplicadas com sucesso.')
