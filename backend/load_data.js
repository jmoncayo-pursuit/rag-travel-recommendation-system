const fs = require('fs');
const csvParser = require('csv-parser');

async function loadAndProcessData() {
  const results = [];

  fs.createReadStream(
    '../data/mountains_vs_beaches_preferences.csv'
  )
    .pipe(csvParser())
    .on('data', (row) => {
      results.push(row);
    })
    .on('end', () => {
      console.log('CSV file successfully processed');
      console.log(`Number of rows: ${results.length}`);
      // For now, just log the first 5 rows to get a glimpse of the data
      console.log('First 5 rows:');
      for (let i = 0; i < Math.min(5, results.length); i++) {
        console.log(results[i]);
      }
      // You can add further processing of the 'results' array here
    })
    .on('error', (error) => {
      console.error('Error reading CSV file:', error);
    });
}

loadAndProcessData();
