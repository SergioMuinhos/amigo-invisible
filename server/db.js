const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

// Asegurar que el directorio de la base de datos existe (útil en Docker y desarrollo)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Habilitar claves foráneas
db.pragma('foreign_keys = ON');

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    profile_completed INTEGER DEFAULT 0,
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    creator_id TEXT NOT NULL,
    assigned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    assigned_to TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    UNIQUE(group_id, user_id)
  );
`);

// Migraciones para bases de datos existentes
try {
  db.exec('ALTER TABLE users ADD COLUMN first_name TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN last_name TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN profile_completed INTEGER DEFAULT 0');
} catch (e) {}
try {
  db.exec("ALTER TABLE members ADD COLUMN validation_status TEXT DEFAULT 'pending'");
} catch (e) {}
try {
  db.exec("ALTER TABLE groups ADD COLUMN emails_sent INTEGER DEFAULT 0");
} catch (e) {}

module.exports = db;
