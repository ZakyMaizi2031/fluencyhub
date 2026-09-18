require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const order = await sql`SELECT * FROM "orders" WHERE "order_number" = 'FH-20260918-517656'`;
  console.log("Order:", order);
}
main();
