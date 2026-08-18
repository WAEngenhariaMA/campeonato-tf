import { drizzle } from 'drizzle-orm/postgres-js'
import dotenv from 'dotenv'
import postgres from 'postgres'
import * as schema from './schema.js'

dotenv.config({ path: '.env.local' })
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não foi configurada.')
const client = postgres(process.env.DATABASE_URL, { prepare: false })
export const db = drizzle(client, { schema })
