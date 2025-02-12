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
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite's default port
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  })
);

app.get('/', (req, res) => {
  res.send('Hello from your Travel Recommendation Backend!');
});

app.post('/api/recommendations', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const {
      preferred_activities,
      min_age,
      max_age,
      min_budget,
      max_budget,
      location,
    } = req.body;

    // Parse budget as integer and set default if invalid
    const parsedMaxBudget = parseInt(max_budget);
    const effectiveMaxBudget =
      !isNaN(parsedMaxBudget) && parsedMaxBudget > 0
        ? parsedMaxBudget
        : 5000;

    const embedding = generateEmbedding(preferred_activities);

    const query = `
      WITH base_scores AS (
        SELECT 
          id,
          preferred_activities,
          age,
          location,
          vacation_budget,
          gender,
          travel_frequency,
          (1 - (embedding <=> $1::vector)) * 150 as vector_score,  -- Increased weight
          CASE 
            -- Direct matches
            WHEN preferred_activities ILIKE '%beach vacation%' OR 
                 preferred_activities ILIKE '%tropical vacation%' OR
                 preferred_activities ILIKE '%beach holiday%'
            THEN 100
            -- Strong activity combinations
            WHEN preferred_activities ILIKE ALL(ARRAY['%beach%', '%swimming%']) OR
                 preferred_activities ILIKE ALL(ARRAY['%tropical%', '%swimming%']) OR
                 preferred_activities ILIKE ALL(ARRAY['%beach%', '%tropical%'])
            THEN 90
            -- Single strong matches
            WHEN preferred_activities ILIKE ANY(ARRAY['%beach%', '%tropical%'])
            THEN 80
            -- Related water activities
            WHEN preferred_activities ILIKE ANY(ARRAY['%swimming%', '%surfing%', '%snorkeling%'])
            THEN 70
            -- General outdoor/water activities
            WHEN preferred_activities ILIKE ANY(ARRAY['%water%', '%ocean%', '%coast%'])
            THEN 60
            ELSE 0
          END as activity_score,
          CASE
            WHEN location ILIKE '%coastal%' OR location ILIKE '%beach%' THEN 30
            WHEN location ILIKE '%tropical%' OR location ILIKE '%island%' THEN 25
            WHEN location ILIKE '%resort%' OR location ILIKE '%seaside%' THEN 20
            ELSE 0
          END as location_score
        FROM travel_profiles
        WHERE vacation_budget <= $2
          AND ($3::integer IS NULL OR age >= $3)
          AND ($4::integer IS NULL OR age <= $4)
          AND ($5::integer IS NULL OR vacation_budget >= $5)
      )
      SELECT 
        id,
        preferred_activities,
        age,
        location,
        vacation_budget,
        gender,
        travel_frequency,
        CASE
          WHEN activity_score > 0 AND location_score > 0 
          THEN (vector_score * 0.4 + activity_score + location_score) * 1.2
          WHEN activity_score > 0 
          THEN vector_score * 0.4 + activity_score + location_score
          ELSE vector_score * 0.6 + location_score
        END::float as match_percentage
      FROM base_scores
      WHERE vector_score > 20 OR activity_score > 0 OR location_score > 0
      ORDER BY match_percentage DESC, vacation_budget DESC
      LIMIT 5;
    `;

    const params = [
      embedding,
      effectiveMaxBudget,
      parseInt(min_age) || null,
      parseInt(max_age) || null,
      parseInt(min_budget) || null,
    ];

    const results = await dbClient.query(query, params);

    if (results.rows.length === 0) {
      const fallbackQuery = `
        SELECT 
          id,
          preferred_activities,
          age,
          location,
          vacation_budget,
          gender,
          travel_frequency,
          GREATEST(
            (1 - (embedding <=> $1::vector)) * 100,
            CASE 
              WHEN preferred_activities ILIKE ALL (array['%beach%', '%tropical%']) THEN 100.0
              WHEN preferred_activities ILIKE '%beach%' AND (
                preferred_activities ILIKE '%vacation%' OR 
                preferred_activities ILIKE '%resort%' OR 
                preferred_activities ILIKE '%island%'
              ) THEN 90.0
              -- ...existing CASE conditions...
            END
          )::float as match_percentage
        FROM travel_profiles
        ORDER BY match_percentage DESC
        LIMIT 5;
      `;

      const fallbackResults = await dbClient.query(fallbackQuery, [
        embedding,
      ]);

      if (fallbackResults.rows.length > 0) {
        return res.json({
          message:
            'No exact matches found. Showing broader recommendations.',
          matches: fallbackResults.rows,
        });
      }

      if (
        results.rows.length === 0 &&
        !fallbackResults?.rows.length
      ) {
        return res.json({
          message: `No matching travel profiles found for "${preferred_activities}". 
                    Try different activities or broaden your search criteria.`,
          matches: [],
          suggestions: [
            'hiking',
            'beach activities',
            'sightseeing',
            'cultural experiences',
            'outdoor adventures',
          ],
        });
      }

      return res.json({
        message:
          'No matching travel profiles found. Try broadening your search criteria.',
        matches: [],
      });
    }

    res.json({
      matches: results.rows,
    });
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect to database when server starts
connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(
        chalk.cyan.bold(
          emoticons.ROCKET_EMOJI +
            ` Backend server listening on port ${port}`
        )
      );
    });
  })
  .catch((error) => {
    console.error(
      chalk.red(emoticons.ERROR_EMOJI + ' Server startup failed:'),
      error
    );
    process.exit(1);
  });
