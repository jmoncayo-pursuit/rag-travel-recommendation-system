// backend/load_data_full.js
import 'dotenv/config';
import fs from 'fs';
import csvParser from 'csv-parser';
import pg from 'pg';
import chalk from 'chalk'; // Import chalk for colors
import * as emoticons from './emoticons.js'; // Import emoticons
import winkNLP from 'wink-nlp';
import winkEngLiteWebModel from 'wink-eng-lite-web-model';

// Instantiate winkNLP
const nlp = winkNLP(winkEngLiteWebModel);

// Add embedding generation function
export function generateEmbedding(text) {
  if (!text) {
    return `[${new Array(384).fill(0).join(',')}]`;
  }

  try {
    // Normalize the text
    const normalizedText = text.toLowerCase().trim();

    // Define activity categories and their related terms
    const activityCategories = {
      beach: [
        'beach',
        'tropical',
        'swimming',
        'snorkel',
        'surf',
        'sun',
        'sand',
        'ocean',
        'coast',
        'island',
      ],
      mountain: [
        'hiking',
        'climbing',
        'mountain',
        'trek',
        'ski',
        'snow',
        'alpine',
        'peak',
      ],
      urban: [
        'city',
        'museum',
        'shopping',
        'restaurant',
        'cafe',
        'cultural',
      ],
      nature: [
        'park',
        'forest',
        'wildlife',
        'camping',
        'outdoor',
        'adventure',
      ],
      relaxation: [
        'relax',
        'spa',
        'resort',
        'peaceful',
        'quiet',
        'calm',
      ],
    };

    // Initialize the embedding vector
    let embeddingVector = new Array(384).fill(0);
    const words = normalizedText.split(/\s+/);

    // Calculate category matches
    const categoryScores = {};
    for (const [category, terms] of Object.entries(
      activityCategories
    )) {
      categoryScores[category] =
        terms.reduce((score, term) => {
          return score + (normalizedText.includes(term) ? 1 : 0);
        }, 0) / terms.length;
    }

    // Generate embedding components based on category scores
    words.forEach((word, wordIndex) => {
      const hash = word.split('').reduce((h, c) => {
        h = (h << 5) - h + c.charCodeAt(0);
        return h & h;
      }, 0);

      // Weight the vector components based on category scores
      for (let i = 0; i < 384; i++) {
        let componentValue = Math.sin(
          hash * (i + 1) * 0.01 + wordIndex * 0.1
        );

        // Apply category weights
        for (const [category, score] of Object.entries(
          categoryScores
        )) {
          if (score > 0) {
            const categoryHash = category
              .split('')
              .reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
            componentValue +=
              Math.sin(categoryHash * (i + 1) * 0.01) * score * 2;
          }
        }

        embeddingVector[i] += componentValue;
      }
    });

    // Normalize the vector
    const magnitude = Math.sqrt(
      embeddingVector.reduce((sum, val) => sum + val * val, 0)
    );
    embeddingVector = embeddingVector.map(
      (val) => val / (magnitude || 1)
    );

    return `[${embeddingVector.join(',')}]`;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return `[${new Array(384).fill(0).join(',')}]`;
  }
}

console.warn(
  chalk.yellow.bold(
    emoticons.WARNING_EMOJI +
      'WARNING: Running load_data_full.js will attempt to process the entire CSV dataset.'
  )
);
console.warn(
  chalk.yellow(
    emoticons.WARNING_EMOJI +
      'This script uses batched insertions for efficiency.'
  )
);

// PostgreSQL connection setup
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'travel_recommendation_db',
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
};

async function loadAndProcessFullData() {
  const batchSize = 100;
  let batch = [];
  let totalProcessed = 0;
  const dbClient = new pg.Client(dbConfig);

  try {
    await dbClient.connect();
    console.log('Loading data...');

    // Check if data exists
    const existingCount = await dbClient.query(
      'SELECT COUNT(*) FROM travel_profiles'
    );
    if (parseInt(existingCount.rows[0].count) > 0) {
      console.log(
        `Database contains ${existingCount.rows[0].count} records`
      );
      console.log('Use --force to reload');
      return;
    }

    // Clear existing data
    await dbClient.query(
      'TRUNCATE TABLE travel_profiles RESTART IDENTITY'
    );

    const stream = fs
      .createReadStream(
        '../data/mountains_vs_beaches_preferences.csv'
      )
      .pipe(csvParser());

    for await (const row of stream) {
      const embeddingVector = generateEmbedding(
        row.Preferred_Activities || ''
      );
      batch.push({
        values: [
          parseInt(row.Age) || 0,
          row.Gender || '',
          parseInt(row.Income) || 0,
          row.Education_Level || '',
          parseInt(row.Travel_Frequency) || 0,
          row.Preferred_Activities || '',
          parseInt(row.Vacation_Budget) || 0,
          row.Location || '',
          parseInt(row.Proximity_to_Mountains) || 0,
          parseInt(row.Proximity_to_Beaches) || 0,
          row.Favorite_Season || '',
          parseInt(row.Pets) || 0,
          parseInt(row.Environmental_Concerns) || 0,
          parseInt(row.Preference) || 0,
          embeddingVector,
        ],
      });

      if (batch.length >= batchSize) {
        await processBatch(dbClient, batch);
        totalProcessed += batch.length;
        process.stdout.write(`\rProcessed: ${totalProcessed}`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await processBatch(dbClient, batch);
      totalProcessed += batch.length;
    }

    console.log(`\nCompleted: ${totalProcessed} records loaded`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

async function processBatch(client, batch) {
  const query = `
    INSERT INTO travel_profiles (
      age, gender, income, education_level, travel_frequency,
      preferred_activities, vacation_budget, location, proximity_to_mountains,
      proximity_to_beaches, favorite_season, pets, environmental_concerns, preference,
      embedding
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `;

  await Promise.all(
    batch.map((item) => client.query(query, item.values))
  );
}

loadAndProcessFullData();
