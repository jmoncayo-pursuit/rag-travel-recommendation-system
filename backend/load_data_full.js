// backend/load_data_full.js
import 'dotenv/config'; // **Import dotenv**
import fs from 'fs'; // **Import fs**
import csvParser from 'csv-parser'; // **Import csv-parser**
import pg from 'pg'; // **Import pg**

console.warn(
  'WARNING: Running load_data_full.js will attempt to process the entire CSV dataset and store data in PostgreSQL.'
);
console.warn(
  'This script now uses batched insertions for efficiency.'
);
console.warn(
  'It does NOT generate or store embeddings in this version.'
);
console.warn(
  '----------------------------------------------------------------------------------------------------'
);

// Global database configuration (moved outside function for consistency with load_data_sample.js)
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'travel_recommendation_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
};

async function loadAndProcessFullData() {
  // Function name remains loadAndProcessFullData
  const results = [];
  console.log(
    'Proceeding with FULL data loading and storing to PostgreSQL (batched insertions, no embeddings)...'
  );

  const batchSize = 100; // Batch size for database insertions
  let batch = [];
  let processedCount = 0;

  const dbClient = new pg.Client(dbConfig); // Create dbClient instance here

  try {
    await dbClient.connect();
    console.log('Successfully connected to PostgreSQL database.');

    const stream = fs
      .createReadStream(
        '../data/mountains_vs_beaches_preferences.csv'
      )
      .pipe(csvParser());

    for await (const row of stream) {
      batch.push([
        // Values array for batch insert
        parseInt(row.Age),
        row.Gender,
        parseInt(row.Income),
        row.Education_Level,
        parseInt(row.Travel_Frequency),
        row.Preferred_Activities,
        parseInt(row.Vacation_Budget),
        row.Location,
        parseInt(row.Proximity_to_Mountains),
        parseInt(row.Proximity_to_Beaches),
        row.Favorite_Season,
        parseInt(row.Pets),
        parseInt(row.Environmental_Concerns),
        parseInt(row.Preference),
      ]);

      if (batch.length >= batchSize) {
        await insertBatch(dbClient, batch); // Call insertBatch function
        processedCount += batch.length;
        // console.log(`Processed ${processedCount} rows (batched).`);
        batch = []; // Clear the batch after insertion
      }
    }

    if (batch.length > 0) {
      // Insert any remaining rows in the final batch
      await insertBatch(dbClient, batch);
      processedCount += batch.length;
    }

    console.log(
      'Full CSV processing and database insertion complete (batched, no embeddings).'
    );
    console.log(
      `Processed and inserted ${processedCount} rows (full dataset - no embeddings).`
    );
    // You can inspect 'results' array (sample data with IDs from database).
    console.log('Database connection closed.');
  } catch (connectionError) {
    console.error('Database connection failed:', connectionError);
  } finally {
    await dbClient.end(); // Ensure database connection is closed in finally block
  }
}

async function insertBatch(dbClient, batch) {
  // Reusable insertBatch function
  const query = `
        INSERT INTO travel_profiles (
            age, gender, income, education_level, travel_frequency,
            preferred_activities, vacation_budget, location,
            proximity_to_mountains, proximity_to_beaches,
            favorite_season, pets, environmental_concerns, preference
        ) VALUES ${batch
          .map(
            (_, i) =>
              `($${i * 14 + 1}, $${i * 14 + 2}, $${i * 14 + 3}, $${
                i * 14 + 4
              }, $${i * 14 + 5}, $${i * 14 + 6}, $${i * 14 + 7}, $${
                i * 14 + 8
              }, $${i * 14 + 9}, $${i * 14 + 10}, $${i * 14 + 11}, $${
                i * 14 + 12
              }, $${i * 14 + 13}, $${i * 14 + 14})`
          )
          .join(',')}
    `;
  await dbClient.query(query, batch.flat());
}

loadAndProcessFullData(); // Call the full data function
