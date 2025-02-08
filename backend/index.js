// backend/index.js
import express from 'express';
import pg from 'pg';
import 'dotenv/config';
import { generateEmbedding } from './load_data_full.js'; // Adjust path if needed
import chalk from 'chalk';
import * as emoticons from './emoticons.js'; // Adjust path if needed

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json()); // Parse JSON request bodies

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
};

const dbClient = new pg.Client(dbConfig);

async function connectToDatabase() {
  try {
    await dbClient.connect();
    console.log(
      chalk.cyan.bold(
        emoticons.ROCKET_EMOJI + ' Connected to the database'
      )
    );
  } catch (error) {
    console.error(
      chalk.red(
        emoticons.ERROR_EMOJI + ' Database connection error:'
      ),
      error
    );
    process.exit(1); // Exit if we can't connect
  }
}

connectToDatabase();

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.post('/api/recommend', async (req, res) => {
  try {
    const {
      age,
      gender,
      income,
      education_level,
      travel_frequency,
      preferred_activities,
      vacation_budget,
      location,
      proximity_to_mountains,
      proximity_to_beaches,
      favorite_season,
      pets,
      environmental_concerns,
      preference,
    } = req.body;

    if (!preferred_activities) {
      return res
        .status(400)
        .json({ error: 'Preferred activities are required' });
    }

    const userEmbedding = generateEmbedding(preferred_activities);

    const query = `
            SELECT id, preferred_activities, (embedding <=> $1::vector) AS distance
            FROM travel_profiles
            ORDER BY distance ASC
            LIMIT 10;
        `;

    const result = await dbClient.query(query, [userEmbedding]);

    const recommendations = result.rows;
    res.status(200).json(recommendations);
  } catch (error) {
    console.error(
      chalk.red(emoticons.ERROR_EMOJI + ' Error in /api/recommend:'),
      error
    );
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

process.on('SIGINT', async () => {
  console.log(chalk.yellow('\nClosing database connection...'));
  await dbClient.end();
  console.log(
    chalk.cyan(
      emoticons.INFO_EMOJI + ' Database connection closed. Exiting.'
    )
  );
  process.exit(0);
});
