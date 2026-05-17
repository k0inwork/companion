const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://yanistabuns@localhost:5432/traceback",
});

/**
 * Run all SQL files in migrations/ directory in alphabetical order.
 * Uses CREATE IF NOT EXISTS so it's safe to re-run.
 */
async function migrate() {
  const dir = path.join(__dirname, "migrations");
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    await pool.query(sql);
    console.log(`  migrated ${file}`);
  }
}

module.exports = pool;
module.exports.migrate = migrate;
