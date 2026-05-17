const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://yanistabuns@localhost:5432/traceback",
});

module.exports = pool;
