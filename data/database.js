import * as SQLite from 'expo-sqlite';

let database;

export async function getDatabase() {
  if (!database) {
    database = await SQLite.openDatabaseAsync('splitwise_app.db');
    await database.execAsync('PRAGMA foreign_keys = ON;');
    await migrate(database);
  }
  return database;
}

async function migrate(db) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      is_current_user INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      deleted_at TEXT,
      deleted_by TEXT,
      restore_code TEXT
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL,
      left_at TEXT,
      PRIMARY KEY (group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY NOT NULL,
      group_id TEXT NOT NULL,
      invited_email TEXT NOT NULL,
      invited_name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      accepted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      group_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_by TEXT NOT NULL,
      category TEXT NOT NULL,
      split_type TEXT NOT NULL,
      notes TEXT,
      expense_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expense_shares (
      expense_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      PRIMARY KEY (expense_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY NOT NULL,
      group_id TEXT NOT NULL,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      settlement_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_notifications (
      id TEXT PRIMARY KEY NOT NULL,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT
    );
  `);

  await ensureColumn(db, 'groups', 'deleted_at', 'TEXT');
  await ensureColumn(db, 'groups', 'deleted_by', 'TEXT');
  await ensureColumn(db, 'groups', 'restore_code', 'TEXT');
  await ensureColumn(db, 'group_members', 'left_at', 'TEXT');

  const users = await db.getAllAsync('SELECT id FROM users LIMIT 1;');
  if (users.length === 0) {
    await db.runAsync(
      'INSERT INTO users (id, name, email, color, is_current_user, created_at) VALUES (?, ?, ?, ?, 1, ?);',
      'you',
      'You',
      '',
      '#1CC29F',
      new Date().toISOString()
    );
  }
}

async function ensureColumn(db, table, column, definition) {
  const columns = await db.getAllAsync(`PRAGMA table_info(${table});`);
  if (!columns.some((item) => item.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}
