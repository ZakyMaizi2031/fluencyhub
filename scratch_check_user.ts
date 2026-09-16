import { sql } from './src/lib/db/client.ts';
async function main() {
  const users = await sql`SELECT id, name, email, role FROM users WHERE name ILIKE '%mzaky maizi%'`;
  console.log(users);
}
main().catch(console.error);
