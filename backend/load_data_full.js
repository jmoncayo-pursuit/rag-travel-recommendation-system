// backend/load_data_full.js
import 'dotenv/config';
import fs from 'fs';
import csvParser from 'csv-parser';

console.warn(
  'WARNING: Running load_data_full.js will attempt to process the entire CSV dataset (without embedding generation in this version).'
);
console.warn(
  'This version is modified to NOT call Hugging Face API for embedding generation.'
);
console.warn(
  'It is intended to be used for setting up data loading and database storage before adding local embeddings.'
);
console.warn(
  '----------------------------------------------------------------------------------------------------'
);

async function loadAndProcessFullData() {
  // Renamed function to be specific to full data
  const results = [];

  console.log(
    'Proceeding with FULL data loading (WITHOUT embedding generation in this version)...'
  );

  fs.createReadStream('../data/mountains_vs_beaches_preferences.csv')
    .pipe(csvParser())
    .on('data', (row) => {
      const textToEmbed = row['Preferred_Activities'];

      if (textToEmbed) {
        results.push(row); // For now, just store the row in results
        console.log(
          `Processing activities: "${textToEmbed.substring(
            0,
            50
          )}..."`
        );
      } else {
        console.warn(
          'Skipping row due to empty Preferred_Activities field.'
        );
      }
    })
    .on('end', () => {
      console.log(
        'Full CSV processing complete (without embedding generation).'
      );
      console.log(
        `Processed ${results.length} rows (full dataset - embeddings NOT generated in this version).`
      );
      // You can inspect 'results' (full data - without embeddings).
    })
    .on('error', (error) => {
      console.error('Error reading CSV file:', error);
    });
}

loadAndProcessFullData(); // Call the full data function
