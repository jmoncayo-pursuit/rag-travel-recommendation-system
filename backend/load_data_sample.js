import 'dotenv/config';
import fs from 'fs';
import csvParser from 'csv-parser';

async function loadAndProcessSampleData() {
  const results = [];
  console.log(
    'Proceeding with sample data loading (without embedding generation yet - using robust stream control)...'
  );

  let processedRowCount = 0;
  const readableStream = fs.createReadStream(
    '../data/mountains_vs_beaches_preferences.csv'
  );
  const csvParserStream = readableStream.pipe(csvParser()); // Capture stream

  csvParserStream
    .on('data', (row) => {
      if (processedRowCount >= 20) {
        console.log(
          'Reached sample row limit (20) for this run. Stopping CSV processing.'
        );
        csvParserStream.unpipe(readableStream); // Unpipe to stop data flow
        readableStream.unpipe(csvParserStream); // Ensure both directions are unpiped
        csvParserStream.pause(); // Pause the parser as well (precautionary)
        readableStream.pause(); // Pause the readable stream too
        return false; // **Return false to signal pause to csv-parser**
      }

      const textToEmbed = row['Preferred_Activities'];
      if (textToEmbed) {
        results.push(row);
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
      processedRowCount++;
    })
    .on('end', () => {
      console.log('Sample CSV processing complete.');
      console.log(`Processed ${results.length} rows (sample).`);
      // You can inspect 'results' (sample data - without embeddings for now).
    })
    .on('error', (error) => {
      console.error('Error reading CSV file:', error);
    });
}

loadAndProcessSampleData();
