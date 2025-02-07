import 'dotenv/config';
import fs from 'fs';
import csvParser from 'csv-parser';
import pg from 'pg';

// Global database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'travel_recommendation_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
};

function generateEmbedding(text) {
    const hash = text.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
    }, 0);
    
    const values = new Array(384).fill(0).map((_, i) => {
        const value = Math.sin(hash + i) * 0.5;
        return Number(value.toFixed(6));
    });
    
    // Format vector string for pgvector
    return `[${values.join(',')}]`;
}

async function loadAndProcessSampleData() {
    const client = new pg.Client(dbConfig);

    try {
        await client.connect();
        console.log('Connected to database');

        // Verify pgvector extension
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
        
        const testText = 'skiing';
        const embedding = generateEmbedding(testText);
        
        // Debug log
        console.log('Embedding format:', embedding.substring(0, 50) + '...');

        const insertQuery = `
            INSERT INTO travel_profiles (
                preferred_activities,
                embedding
            ) VALUES ($1, $2)
            RETURNING id, preferred_activities, vector_dims(embedding) as dims;
        `;

        const result = await client.query(insertQuery, [testText, embedding]);
        console.log('Insertion result:', result.rows[0]);

        // Verify with simple query
        const verifyQuery = `
            SELECT id, 
                   preferred_activities, 
                   vector_dims(embedding) as dims
            FROM travel_profiles
            WHERE id = $1;
        `;

        const verification = await client.query(verifyQuery, [result.rows[0].id]);
        console.log('Verification:', verification.rows[0]);

    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            detail: error.detail,
            hint: error.hint
        });
    } finally {
        await client.end();
    }
}

loadAndProcessSampleData().catch(console.error);
