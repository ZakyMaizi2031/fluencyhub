require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const logs = await sql`SELECT * FROM "webhook_logs" ORDER BY id DESC LIMIT 20`;
  console.log("Logs count:", logs.length);
  const paidLogs = logs.filter(l => l.payload_json && l.payload_json.payment_id && !l.payload_json.event);
  console.log("FVA Paid Logs:", JSON.stringify(paidLogs, null, 2));
}
main();
