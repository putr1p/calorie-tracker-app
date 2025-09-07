import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Initialize database
const dbPath = path.join(process.cwd(), 'calorie_tracker.db');
const db = new Database(dbPath);

// Drop tables if they exist to ensure schema is updated
db.exec(`
  DROP TABLE IF EXISTS meals;
  DROP TABLE IF EXISTS users;
`);

// Create tables
db.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE meals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein REAL,
    carbs REAL,
    fats REAL,
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

// Add macro columns to existing meals table if they don't exist
try {
  db.exec(`ALTER TABLE meals ADD COLUMN protein REAL;`);
} catch (error) {
  // Column might already exist, ignore error
}

try {
  db.exec(`ALTER TABLE meals ADD COLUMN carbs REAL;`);
} catch (error) {
  // Column might already exist, ignore error
}

try {
  db.exec(`ALTER TABLE meals ADD COLUMN fats REAL;`);
} catch (error) {
  // Column might already exist, ignore error
}

// User operations
export const createUser = (username: string, password: string) => {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)');
  stmt.run(id, username, password);
  return id;
};

export const getUserByUsername = (username: string) => {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
};

export const getUserById = (id: string) => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
};

// Meal operations
export const createMeal = (userId: string, name: string, calories: number, protein?: number | null, carbs?: number | null, fats?: number | null, imageUrl?: string | null) => {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO meals (id, user_id, name, calories, protein, carbs, fats, created_at, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, userId, name, calories, protein || null, carbs || null, fats || null, new Date().toISOString(), imageUrl || null);
  return id;
};

export const getMealsByUserId = (userId: string) => {
  const stmt = db.prepare('SELECT * FROM meals WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId);
};

export const deleteMeal = (mealId: string, userId: string) => {
  const stmt = db.prepare('DELETE FROM meals WHERE id = ? AND user_id = ?');
  return stmt.run(mealId, userId);
};

export const getMealsByUserAndDateRange = (userId: string, startDate: string, endDate: string) => {
  const stmt = db.prepare('SELECT * FROM meals WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC');
  return stmt.all(userId, startDate, endDate);
};