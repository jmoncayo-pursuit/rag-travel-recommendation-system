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

export async function connectToDatabase() {
  try {
    await dbClient.connect();
    console.log(
      chalk.cyan.bold(
        emoticons.ROCKET_EMOJI + ' Connected to the database'
      )
    );
  } catch (error) {
    console.error(
      chalk.red(
        emoticons.ERROR_EMOJI + ' Database connection error:'
      ),
      error
    );
    throw error;
  }
}

export { dbClient };