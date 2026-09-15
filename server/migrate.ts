import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db, client } from './db/index.js'

await migrate(db, { migrationsFolder: './drizzle' })
console.log('Migrations aplicadas com sucesso.')
// O pool do postgres-js fica aberto por padrão, o que nunca deixa este processo terminar sozinho.
// Isso é inofensivo rodando à mão, mas se o comando de start encadear "migrate && start" (ex: no
// Render), o processo trava aqui pra sempre e a API nunca chega a abrir a porta.
await client.end()
process.exit(0)
