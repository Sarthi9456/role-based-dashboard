require('dotenv').config();

// SQLite is used by default so the project runs with zero external DB setup.
// Swap `dialect`/credentials here (or via env vars) to point at MySQL/Postgres instead.
const sqliteBase = {
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite',
  logging: false,
};

module.exports = {
  development: { ...sqliteBase },
  test: { ...sqliteBase, storage: './database.test.sqlite' },
  production: { ...sqliteBase },
};
