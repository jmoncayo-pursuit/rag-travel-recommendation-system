// backend/db/index.js
import pg from 'pg';
import chalk from 'chalk';
import * as emoticons from '../emoticons.js';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'travel_recommendation_db',
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
};

const dbClient = new pg.Client(dbConfig);

// Only log critical errors
dbClient.on('error', (err) => {
  console.error(chalk.red('Database error:'), err.message);
});

export async function connectToDatabase() {
  try {
    await dbClient.connect();
    console.log(chalk.green('Database connected'));
  } catch (error) {
    console.error(
      chalk.red('Database connection failed:'),
      error.message
    );
    throw error;
  }
}

export { dbClient };
