import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);`;
  await sql`ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS account_name VARCHAR(100);`;
  console.log("Columns added successfully");
}

main().catch(console.error);
