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
function generateEmbedding(text) {
    if (!text) {
        return `[${new Array(384).fill(0).join(',')}]`;
    }

    try {
        const hash = text.split('').reduce((h, c) => {
            h = ((h << 5) - h) + c.charCodeAt(0);
            return h & h;
        }, 0);

        let embeddingVector = new Array(384).fill(0);
        for (let i = 0; i < 384; i++) {
            embeddingVector[i] = Math.sin(hash * (i + 1) * 0.01);
        }

        return `[${embeddingVector.join(',')}]`;
    } catch (error) {
        return `[${new Array(384).fill(0).join(',')}]`;
    }
}

console.warn(chalk.yellow.bold(emoticons.WARNING_EMOJI + "WARNING: Running load_data_full.js will attempt to process the entire CSV dataset."));
console.warn(chalk.yellow(emoticons.WARNING_EMOJI + "This script uses batched insertions for efficiency."));

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
    const dbClient = new pg.Client(dbConfig);

    try {
        await dbClient.connect();
        console.log(chalk.cyan.bold(emoticons.ROCKET_EMOJI + ' Loading dataset...'));

        const stream = fs.createReadStream('../data/mountains_vs_beaches_preferences.csv')
            .pipe(csvParser());

        for await (const row of stream) {
            const embeddingVector = generateEmbedding(row.Preferred_Activities || '');
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
                    embeddingVector
                ]
            });

            if (batch.length >= batchSize) {
                await processBatch(dbClient, batch);
                batch = [];
            }
        }

        if (batch.length > 0) {
            await processBatch(dbClient, batch);
        }

        // Add preview table at end
        const previewResult = await dbClient.query(`
            SELECT id, preferred_activities, format_embedding(embedding) as embedding_preview 
            FROM travel_profiles 
            WHERE id <= 5
            ORDER BY id
        `);

        console.log(chalk.green(emoticons.SUCCESS_EMOJI + ' Processing completed.'));
        console.table(previewResult.rows);

    } catch (error) {
        console.error(chalk.red(emoticons.ERROR_EMOJI + ' Error:'), error);
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

  await Promise.all(batch.map(item => client.query(query, item.values)));
}

loadAndProcessFullData();