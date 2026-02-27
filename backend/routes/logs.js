import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, req.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.post('/', authMiddleware, (req, res) => {
  const { profileId, startDate, endDate, type, symptoms, notes } = req.body;
  const db = req.db;
  const userId = req.userId;

  if (!profileId || !startDate || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  db.get(
    `SELECT p.* FROM profiles p 
     JOIN households h ON p.householdId = h.id 
     WHERE p.id = ? AND h.userId = ?`,
    [profileId, userId],
    (err, profile) => {
      if (err || !profile) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const logId = uuidv4();
      
      db.run(
        `INSERT INTO logs (id, profileId, date, type, flow, notes) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [logId, profileId, startDate, type, endDate || null, notes || null],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Failed to create log' });
          }

          if (symptoms && symptoms.length > 0) {
            symptoms.forEach(symptom => {
              db.run(
                'INSERT INTO log_symptoms (logId, symptom) VALUES (?, ?)',
                [logId, symptom]
              );
            });
          }

          res.json({
            id: logId,
            profileId,
            startDate,
            endDate: endDate || null,
            type,
            symptoms,
            notes
          });
        }
      );
    }
  );
});

router.get('/profile/:profileId', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.userId;
  const profileId = req.params.profileId;

  db.get(
    `SELECT p.* FROM profiles p 
     JOIN households h ON p.householdId = h.id 
     WHERE p.id = ? AND h.userId = ?`,
    [profileId, userId],
    (err, profile) => {
      if (err || !profile) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      db.all(
        'SELECT * FROM logs WHERE profileId = ? ORDER BY date DESC',
        [profileId],
        (err, logs) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to fetch logs' });
          }

          const logsWithSymptoms = logs.map(log => {
            return new Promise((resolve) => {
              db.all(
                'SELECT symptom FROM log_symptoms WHERE logId = ?',
                [log.id],
                (err, symptoms) => {
                  resolve({
                    ...log,
                    symptoms: symptoms ? symptoms.map(s => s.symptom) : []
                  });
                }
              );
            });
          });

          Promise.all(logsWithSymptoms).then(results => {
            res.json(results);
          });
        }
      );
    }
  );
});

router.put('/:id', authMiddleware, (req, res) => {
  const { startDate, endDate, type, symptoms, notes } = req.body;
  const db = req.db;
  const userId = req.userId;
  const logId = req.params.id;

  db.get(
    `SELECT l.* FROM logs l
     JOIN profiles p ON l.profileId = p.id
     JOIN households h ON p.householdId = h.id 
     WHERE l.id = ? AND h.userId = ?`,
    [logId, userId],
    (err, log) => {
      if (err || !log) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      db.run(
        `UPDATE logs SET date = ?, type = ?, flow = ?, notes = ? WHERE id = ?`,
        [startDate, type, endDate || null, notes || null, logId],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Failed to update log' });
          }

          db.run('DELETE FROM log_symptoms WHERE logId = ?', [logId]);

          if (symptoms && symptoms.length > 0) {
            symptoms.forEach(symptom => {
              db.run(
                'INSERT INTO log_symptoms (logId, symptom) VALUES (?, ?)',
                [logId, symptom]
              );
            });
          }

          res.json({
            id: logId,
            startDate,
            endDate: endDate || null,
            type,
            symptoms,
            notes
          });
        }
      );
    }
  );
});

router.delete('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.userId;
  const logId = req.params.id;

  db.get(
    `SELECT l.* FROM logs l
     JOIN profiles p ON l.profileId = p.id
     JOIN households h ON p.householdId = h.id 
     WHERE l.id = ? AND h.userId = ?`,
    [logId, userId],
    (err, log) => {
      if (err || !log) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      db.run('DELETE FROM log_symptoms WHERE logId = ?', [logId]);
      
      db.run('DELETE FROM logs WHERE id = ?', [logId], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Failed to delete log' });
        }

        res.json({ message: 'Log deleted' });
      });
    }
  );
});

router.get('/', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.userId;

  db.get(
    'SELECT id FROM households WHERE userId = ?',
    [userId],
    (err, household) => {
      if (err || !household) {
        return res.status(500).json({ message: 'Failed to find household' });
      }

      db.all(
        `SELECT l.* FROM logs l
         JOIN profiles p ON l.profileId = p.id
         WHERE p.householdId = ? 
         ORDER BY l.date DESC`,
        [household.id],
        (err, logs) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to fetch logs' });
          }

          const logsWithSymptoms = logs.map(log => {
            return new Promise((resolve) => {
              db.all(
                'SELECT symptom FROM log_symptoms WHERE logId = ?',
                [log.id],
                (err, symptoms) => {
                  resolve({
                    ...log,
                    symptoms: symptoms ? symptoms.map(s => s.symptom) : []
                  });
                }
              );
            });
          });

          Promise.all(logsWithSymptoms).then(results => {
            res.json(results);
          });
        }
      );
    }
  );
});

export default router;