import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data', 'flight.db');
const DB_DIR = path.dirname(DB_PATH);

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;

async function initDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  insertSeedData();

  return db;
}

function createTables(): void {
  if (!db) return;

  db.run(`
    CREATE TABLE IF NOT EXISTS flight_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_time REAL NOT NULL,
      end_time REAL NOT NULL,
      data_points TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS navigation_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      type TEXT NOT NULL,
      frequency TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS navigation_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_radial REAL NOT NULL,
      target_distance REAL NOT NULL,
      start_lat REAL NOT NULL,
      start_lng REAL NOT NULL,
      navigation_station_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (navigation_station_id) REFERENCES navigation_stations(id)
    )
  `);

  saveDatabase();
}

function insertSeedData(): void {
  if (!db) return;

  const stationResult = db.exec('SELECT COUNT(*) as count FROM navigation_stations');
  if (stationResult.length > 0 && stationResult[0].values[0][0] === 0) {
    const stations = [
      { name: 'LAX VORTAC', lat: 33.9425, lng: -118.4081, type: 'VORTAC', frequency: '115.30' },
      { name: 'SFO VOR', lat: 37.6213, lng: -122.3790, type: 'VOR', frequency: '116.80' },
      { name: 'PHX VORTAC', lat: 33.4342, lng: -112.0080, type: 'VORTAC', frequency: '115.70' },
      { name: 'LAS VOR', lat: 36.0840, lng: -115.1537, type: 'VOR', frequency: '116.00' },
      { name: 'SAN VORTAC', lat: 32.7338, lng: -117.1933, type: 'VORTAC', frequency: '115.10' },
    ];

    stations.forEach(station => {
      db!.run(
        'INSERT INTO navigation_stations (name, lat, lng, type, frequency) VALUES (?, ?, ?, ?, ?)',
        [station.name, station.lat, station.lng, station.type, station.frequency]
      );
    });
  }

  const exerciseResult = db.exec('SELECT COUNT(*) as count FROM navigation_exercises');
  if (exerciseResult.length > 0 && exerciseResult[0].values[0][0] === 0) {
    const exercises = [
      { name: 'LAX 径向线 090° 截获', targetRadial: 90, targetDistance: 10, startLat: 33.9425, startLng: -118.5081, stationId: 1 },
      { name: 'LAX 径向线 180° 截获', targetRadial: 180, targetDistance: 15, startLat: 33.8425, startLng: -118.4081, stationId: 1 },
      { name: 'SFO 径向线 270° 截获', targetRadial: 270, targetDistance: 8, startLat: 37.6213, startLng: -122.4790, stationId: 2 },
      { name: 'PHX 径向线 000° 截获', targetRadial: 0, targetDistance: 12, startLat: 33.5342, startLng: -112.0080, stationId: 3 },
      { name: 'LAS 径向线 135° 截获', targetRadial: 135, targetDistance: 10, startLat: 36.0140, startLng: -115.0837, stationId: 4 },
    ];

    exercises.forEach(exercise => {
      db!.run(
        'INSERT INTO navigation_exercises (name, target_radial, target_distance, start_lat, start_lng, navigation_station_id) VALUES (?, ?, ?, ?, ?, ?)',
        [exercise.name, exercise.targetRadial, exercise.targetDistance, exercise.startLat, exercise.startLng, exercise.stationId]
      );
    });
  }

  saveDatabase();
}

function saveDatabase(): void {
  if (!db) return;

  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export { initDatabase, getDatabase, saveDatabase };
