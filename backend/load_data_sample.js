import 'dotenv/config';
import fs from 'fs';
import csvParser from 'csv-parser';
import pg from 'pg';
import winkNLP from 'wink-nlp';
import winkEngLiteWebModel from 'wink-eng-lite-web-model';
import chalk from 'chalk';
import * as emoticons from './emoticons.js';

// Add database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'travel_recommendation_db',
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000
};

// Instantiate winkNLP with the language model
const nlp = winkNLP(winkEngLiteWebModel);

function generateEmbedding(text) {
  if (!text) {
    return `[${new Array(384).fill(0).join(',')}]`;
  }

  const doc = nlp.readDoc(text);
  const tokens = doc.tokens().out();
  let embeddingVector = new Array(384).fill(0);
  let wordCount = 0;

  try {
    for (const token of tokens) {
      if (!token) continue;
      const wordVector = nlp.model.wordVector(token);
      if (!wordVector) continue;
      
      for (let i = 0; i < Math.min(384, wordVector.length); i++) {
        embeddingVector[i] += wordVector[i];
      }
      wordCount++;
    }

    if (wordCount > 0) {
      embeddingVector = embeddingVector.map(val => val / wordCount);
    }
    return `[${embeddingVector.join(',')}]`;
  } catch (error) {
    return `[${new Array(384).fill(0).join(',')}]`;
  }
}

async function loadAndProcessSampleData() {
  const results = [];
  const errorCounts = new Map();
  let processedRowCount = 0;
  
  const dbClient = new pg.Client(dbConfig);

  try {
    await dbClient.connect();
    console.log(chalk.cyan.bold(emoticons.ROCKET_EMOJI + 'Processing sample data...'));

    const stream = fs.createReadStream('../data/mountains_vs_beaches_preferences.csv')
      .pipe(csvParser());

    for await (const row of stream) {
      if (processedRowCount >= 20) break;

      try {
        const textToEmbed = row['Preferred_Activities'] || '';
        const embeddingVector = generateEmbedding(textToEmbed);
        
        const insertQuery = `
          INSERT INTO travel_profiles (
            age, gender, income, education_level, travel_frequency,
            preferred_activities, vacation_budget, location, proximity_to_mountains,
            proximity_to_beaches, favorite_season, pets, environmental_concerns, preference,
            embedding
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING id;`;

        const values = [
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
          embeddingVector
        ];

        const result = await dbClient.query(insertQuery, values);
        results.push({ id: result.rows[0].id });
        processedRowCount++;
      } catch (error) {
        const errorKey = error.message;
        errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);
      }
    }

    // Log unique errors with their counts at the end
    if (errorCounts.size > 0) {
      console.error(chalk.red('\nErrors encountered:'));
      for (const [errorMessage, count] of errorCounts) {
        console.error(chalk.red(emoticons.ERROR_EMOJI + `Error occurred ${count} times: ${errorMessage}`));
      }
    }

    console.log(chalk.green(emoticons.SUCCESS_EMOJI + `Successfully processed ${processedRowCount} sample rows`));
  } catch (error) {
    console.error(chalk.red(emoticons.ERROR_EMOJI + 'Database Error:'), error.message);
  } finally {
    await dbClient.end();
    console.log(chalk.cyan(emoticons.INFO_EMOJI + 'Database connection closed.'));
  }
}

loadAndProcessSampleData();
