const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

async function main() {
  console.log("Connecting to Postgres...");
  try {
    const start = Date.now();
    const res = await pool.query("SELECT 1 AS ok");
    console.log(`Success! Took ${Date.now() - start}ms:`, res.rows);
  } catch (err) {
    console.error("DB Connection Error:", err);
  } finally {
    pool.end();
  }
}

main();
