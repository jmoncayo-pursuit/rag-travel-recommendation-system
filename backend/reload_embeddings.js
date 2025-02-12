import 'dotenv/config';
import { dbClient } from './db/index.js';
import { generateEmbedding } from './load_data_full.js';

async function reloadEmbeddings() {
  let count = 0;
  try {
    await dbClient.connect();
    console.log(
      'Connected to database, starting embedding reload...'
    );

    const result = await dbClient.query(
      'SELECT id, preferred_activities FROM travel_profiles'
    );
    const total = result.rows.length;

    for (const row of result.rows) {
      const newEmbedding = generateEmbedding(
        row.preferred_activities
      );
      await dbClient.query(
        'UPDATE travel_profiles SET embedding = $1::vector WHERE id = $2',
        [newEmbedding, row.id]
      );
      count++;
      if (count % 100 === 0) {
        console.log(`Progress: ${count}/${total} records updated`);
      }
    }

    console.log(
      `Completed: ${count} embeddings updated successfully`
    );
  } catch (error) {
    console.error('Error updating embeddings:', error.message);
  } finally {
    await dbClient.end();
  }
}

reloadEmbeddings();
