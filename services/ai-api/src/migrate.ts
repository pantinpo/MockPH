import fs from 'node:fs/promises'
import path from 'node:path'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const pool = new Pool({ connectionString: databaseUrl })
const migration = await fs.readFile(path.join(process.cwd(), 'migrations', '001_init.sql'), 'utf8')
await pool.query(migration)
await pool.end()
console.log('AI database migration completed')
