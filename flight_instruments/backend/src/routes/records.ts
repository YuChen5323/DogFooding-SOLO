import express, { Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../database';

const router = express.Router();

interface FlightRecordRequestBody {
  name: string;
  startTime: number;
  endTime: number;
  dataPoints: any[];
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT id, name, start_time, end_time, data_points, created_at FROM flight_records ORDER BY created_at DESC');
    
    if (result.length === 0) {
      return res.json([]);
    }

    const records = result[0].values.map(row => ({
      id: row[0],
      name: row[1],
      startTime: row[2],
      endTime: row[3],
      dataPoints: JSON.parse(row[4] as string),
      createdAt: row[5],
    }));

    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const result = db.exec(
      'SELECT id, name, start_time, end_time, data_points, created_at FROM flight_records WHERE id = ?',
      [parseInt(id)]
    );
    
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const row = result[0].values[0];
    const record = {
      id: row[0],
      name: row[1],
      startTime: row[2],
      endTime: row[3],
      dataPoints: JSON.parse(row[4] as string),
      createdAt: row[5],
    };

    res.json(record);
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

router.post('/', async (req: Request<{}, {}, FlightRecordRequestBody>, res: Response) => {
  try {
    const { name, startTime, endTime, dataPoints } = req.body;
    
    if (!name || startTime === undefined || endTime === undefined || !dataPoints) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDatabase();
    
    db.run(
      'INSERT INTO flight_records (name, start_time, end_time, data_points) VALUES (?, ?, ?, ?)',
      [name, startTime, endTime, JSON.stringify(dataPoints)]
    );

    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const newId = idResult[0].values[0][0];

    saveDatabase();

    res.status(201).json({
      id: newId,
      name,
      startTime,
      endTime,
      dataPoints,
    });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

router.put('/:id', async (req: Request<{ id: string }, {}, Partial<FlightRecordRequestBody>>, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDatabase();
    
    const result = db.exec('SELECT id FROM flight_records WHERE id = ?', [parseInt(id)]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    db.run(
      'UPDATE flight_records SET name = ? WHERE id = ?',
      [name, parseInt(id)]
    );

    saveDatabase();

    res.json({ message: 'Record updated successfully' });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const result = db.exec('SELECT id FROM flight_records WHERE id = ?', [parseInt(id)]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    db.run('DELETE FROM flight_records WHERE id = ?', [parseInt(id)]);
    saveDatabase();

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

export default router;
