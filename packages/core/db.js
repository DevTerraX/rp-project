const fs = require('fs');
const path = require('path');

let pool;

function loadConfig() {
  const configPath = path.join(__dirname, '..', '..', 'conf.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.warn('[db] conf.json missing or invalid, using defaults', err.message);
    return {};
  }
}

async function init() {
  if (pool) return pool;

  const config = loadConfig().db || {};
  const mysql = require('mysql2/promise');

  pool = mysql.createPool({
    host: config.host || '127.0.0.1',
    user: config.user || 'root',
    password: config.password || '',
    database: config.database || 'rage_rp',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
  });

  await ensureSchema();
  console.log('[db] pool ready');
  return pool;
}

async function ensureSchema() {
  const sqlAccounts = `
    CREATE TABLE IF NOT EXISTS accounts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(32) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      reg_ip VARCHAR(32),
      last_ip VARCHAR(32),
      last_login TIMESTAMP NULL,
      admin_level INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const sqlCharacters = `
    CREATE TABLE IF NOT EXISTS characters (
      id INT PRIMARY KEY AUTO_INCREMENT,
      account_id INT NOT NULL,
      name VARCHAR(32) NOT NULL,
      cash INT DEFAULT 0,
      bank INT DEFAULT 0,
      pos_x FLOAT DEFAULT 0,
      pos_y FLOAT DEFAULT 0,
      pos_z FLOAT DEFAULT 0,
      dimension INT DEFAULT 0,
      health INT DEFAULT 100,
      armor INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await queryRaw(sqlAccounts);
  await queryRaw(sqlCharacters);
}

async function queryRaw(sql, params = []) {
  const p = pool || (await init());
  return p.query(sql, params);
}

module.exports = {
  init,
  query: queryRaw,
};
