import express, { Request, Response } from 'express';
import { getDatabase } from '../database';

const router = express.Router();

router.get('/stations', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT id, name, lat, lng, type, frequency FROM navigation_stations ORDER BY name');
    
    if (result.length === 0) {
      return res.json([]);
    }

    const stations = result[0].values.map(row => ({
      id: row[0],
      name: row[1],
      lat: row[2],
      lng: row[3],
      type: row[4],
      frequency: row[5],
    }));

    res.json(stations);
  } catch (error) {
    console.error('Error fetching navigation stations:', error);
    res.status(500).json({ error: 'Failed to fetch navigation stations' });
  }
});

router.get('/stations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const result = db.exec(
      'SELECT id, name, lat, lng, type, frequency FROM navigation_stations WHERE id = ?',
      [parseInt(id)]
    );
    
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Navigation station not found' });
    }

    const row = result[0].values[0];
    const station = {
      id: row[0],
      name: row[1],
      lat: row[2],
      lng: row[3],
      type: row[4],
      frequency: row[5],
    };

    res.json(station);
  } catch (error) {
    console.error('Error fetching navigation station:', error);
    res.status(500).json({ error: 'Failed to fetch navigation station' });
  }
});

router.get('/exercises', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT 
        ne.id, 
        ne.name, 
        ne.target_radial, 
        ne.target_distance, 
        ne.start_lat, 
        ne.start_lng, 
        ne.navigation_station_id,
        ns.name as station_name
      FROM navigation_exercises ne
      JOIN navigation_stations ns ON ne.navigation_station_id = ns.id
      ORDER BY ne.name
    `);
    
    if (result.length === 0) {
      return res.json([]);
    }

    const exercises = result[0].values.map(row => ({
      id: row[0],
      name: row[1],
      targetRadial: row[2],
      targetDistance: row[3],
      startLat: row[4],
      startLng: row[5],
      navigationStationId: row[6],
      stationName: row[7],
    }));

    res.json(exercises);
  } catch (error) {
    console.error('Error fetching navigation exercises:', error);
    res.status(500).json({ error: 'Failed to fetch navigation exercises' });
  }
});

router.get('/exercises/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const result = db.exec(
      `
      SELECT 
        ne.id, 
        ne.name, 
        ne.target_radial, 
        ne.target_distance, 
        ne.start_lat, 
        ne.start_lng, 
        ne.navigation_station_id,
        ns.name as station_name,
        ns.lat as station_lat,
        ns.lng as station_lng,
        ns.type as station_type,
        ns.frequency as station_frequency
      FROM navigation_exercises ne
      JOIN navigation_stations ns ON ne.navigation_station_id = ns.id
      WHERE ne.id = ?
      `,
      [parseInt(id)]
    );
    
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Navigation exercise not found' });
    }

    const row = result[0].values[0];
    const exercise = {
      id: row[0],
      name: row[1],
      targetRadial: row[2],
      targetDistance: row[3],
      startLat: row[4],
      startLng: row[5],
      navigationStationId: row[6],
      station: {
        name: row[7],
        lat: row[8],
        lng: row[9],
        type: row[10],
        frequency: row[11],
      },
    };

    res.json(exercise);
  } catch (error) {
    console.error('Error fetching navigation exercise:', error);
    res.status(500).json({ error: 'Failed to fetch navigation exercise' });
  }
});

router.post('/stations', async (req: Request, res: Response) => {
  try {
    const { name, lat, lng, type, frequency } = req.body;
    
    if (!name || lat === undefined || lng === undefined || !type || !frequency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validTypes = ['VOR', 'DME', 'VORTAC'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid station type. Must be one of: VOR, DME, VORTAC' });
    }

    const db = getDatabase();
    
    db.run(
      'INSERT INTO navigation_stations (name, lat, lng, type, frequency) VALUES (?, ?, ?, ?, ?)',
      [name, lat, lng, type, frequency]
    );

    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const newId = idResult[0].values[0][0];

    res.status(201).json({
      id: newId,
      name,
      lat,
      lng,
      type,
      frequency,
    });
  } catch (error) {
    console.error('Error creating navigation station:', error);
    res.status(500).json({ error: 'Failed to create navigation station' });
  }
});

router.post('/exercises', async (req: Request, res: Response) => {
  try {
    const { name, targetRadial, targetDistance, startLat, startLng, navigationStationId } = req.body;
    
    if (!name || targetRadial === undefined || targetDistance === undefined || 
        startLat === undefined || startLng === undefined || !navigationStationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDatabase();
    
    const stationResult = db.exec(
      'SELECT id FROM navigation_stations WHERE id = ?',
      [navigationStationId]
    );
    
    if (stationResult.length === 0 || stationResult[0].values.length === 0) {
      return res.status(400).json({ error: 'Navigation station not found' });
    }

    db.run(
      'INSERT INTO navigation_exercises (name, target_radial, target_distance, start_lat, start_lng, navigation_station_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, targetRadial, targetDistance, startLat, startLng, navigationStationId]
    );

    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const newId = idResult[0].values[0][0];

    res.status(201).json({
      id: newId,
      name,
      targetRadial,
      targetDistance,
      startLat,
      startLng,
      navigationStationId,
    });
  } catch (error) {
    console.error('Error creating navigation exercise:', error);
    res.status(500).json({ error: 'Failed to create navigation exercise' });
  }
});

export default router;
