import Database from 'better-sqlite3';
import path from 'path';

// Initialize database
const dbPath = path.join(process.cwd(), 'calorie_tracker.db');
const db = new Database(dbPath);

// Create tables
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
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

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
export const createMeal = (userId: number, name: string, calories: number, date: string) => {
  const stmt = db.prepare('INSERT INTO meals (user_id, name, calories, date) VALUES (?, ?, ?, ?)');
  const result = stmt.run(userId, name, calories, date);
  return result.lastInsertRowid;
};

export const getMealsByUserId = (userId: number) => {
  const stmt = db.prepare('SELECT * FROM meals WHERE user_id = ? ORDER BY date DESC, created_at DESC');
  return stmt.all(userId);
};

export const deleteMeal = (mealId: number, userId: number) => {
  const stmt = db.prepare('DELETE FROM meals WHERE id = ? AND user_id = ?');
  return stmt.run(mealId, userId);
};

export const getMealsByUserAndDateRange = (userId: number, startDate: string, endDate: string) => {
  const stmt = db.prepare('SELECT * FROM meals WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC');
  return stmt.all(userId, startDate, endDate);
};