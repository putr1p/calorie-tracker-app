import Database from 'better-sqlite3';
import path from 'path';

// Initialize database
const dbPath = path.join(process.cwd(), 'calorie_tracker.db');
const db = new Database(dbPath);

// Create tables if they don't exist - preserves existing data
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

// Add image_url column to existing meals table if it doesn't exist
try {
  db.exec(`ALTER TABLE meals ADD COLUMN image_url TEXT;`);
} catch (error) {
  // Column might already exist, ignore error
}

// User operations
export const createUser = (username: string, password: string) => {
  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  const result = stmt.run(username, password);
  return result.lastInsertRowid;
};

export const getUserByUsername = (username: string) => {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
};

export const getUserById = (id: number) => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
};

// Meal operations
export const createMeal = (userId: number, name: string, calories: number, imageUrl?: string | null) => {
  const stmt = db.prepare('INSERT INTO meals (user_id, name, calories, created_at, image_url) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(userId, name, calories, new Date().toISOString(), imageUrl || null);
  return result.lastInsertRowid;
};

export const getMealsByUserId = (userId: number) => {
  const stmt = db.prepare('SELECT * FROM meals WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId);
};

export const deleteMeal = (mealId: number, userId: number) => {
  const stmt = db.prepare('DELETE FROM meals WHERE id = ? AND user_id = ?');
  return stmt.run(mealId, userId);
};

export const getMealsByUserAndDateRange = (userId: number, startDate: string, endDate: string) => {
  const stmt = db.prepare('SELECT * FROM meals WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC');
  return stmt.all(userId, startDate, endDate);
};