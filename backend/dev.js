import express from 'express';
import 'dotenv/config';
import { connectToDatabase, dbClient } from './db/index.js';
import { generateEmbedding } from './load_data_full.js';
import chalk from 'chalk';
import * as emoticons from './emoticons.js';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello from your Travel Recommendation Backend!');
});

app.post('/api/recommendations', async (req, res) => {
  try {
    const { preferred_activities } = req.body;
    console.log(chalk.cyan(emoticons.INFO_EMOJI + 'Received request:'), { preferred_activities });
    
    if (!preferred_activities) {
      return res.status(400).json({ error: 'Preferred activities are required' });
    }

    const embedding = generateEmbedding(preferred_activities);
    
    const query = `
      SELECT 
        id,
        preferred_activities,
        age,
        location,
        vacation_budget,
        (embedding <=> $1::vector) as similarity_score
      FROM travel_profiles
      WHERE preferred_activities IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 5;
    `;
    
    const results = await dbClient.query(query, [embedding]);
    console.log(chalk.cyan(emoticons.INFO_EMOJI + 'Found matches:'), results.rows.length);
    res.json(results.rows);
  } catch (error) {
    console.error(chalk.red(emoticons.ERROR_EMOJI + ' Error:'), error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect to database when server starts
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(chalk.cyan.bold(emoticons.ROCKET_EMOJI + ` Backend server listening on port ${port}`));
  });
}).catch(error => {
  console.error(chalk.red(emoticons.ERROR_EMOJI + ' Server startup failed:'), error);
  process.exit(1);
});
