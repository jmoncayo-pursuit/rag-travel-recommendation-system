# RAG Travel Recommendation System

## Overview

This project is a travel recommendation system built using the PERN stack (PostgreSQL, Express.js, React.js, Node.js) and Tailwind CSS for styling. It leverages AI-powered search using pgvector for efficient vector retrieval to provide personalized travel recommendations.

This system is a learning project to explore Retrieval-Augmented Generation (RAG) systems and vector databases for recommendation engines.

## Features (Planned)

- AI-powered search for travel destinations based on user preferences.
- Vector similarity search using pgvector for relevant recommendations.
- REST API for backend logic and data retrieval.
- React frontend for user interface and displaying recommendations.

## Tech Stack

- **Frontend:** React.js, Tailwind CSS, Vite
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL with pgvector extension
- **Vector Database:** pgvector (for final implementation, initially using VectorDB.js in-memory for development)
- **Embeddings:** **Placeholder Embeddings (sine wave hash function) - to be replaced with winkNLP**
- **AI Model (for potential response generation):** [researching an AI model to for response generation ]

## Development Status

**Phase 1: Database Setup and Data Loading - COMPLETE**

- PostgreSQL with `pgvector` extension is successfully set up and running.
- `travel_profiles` table is created in the database.
- Backend script (`load_data_sample.js`) is implemented to:
    - Read data from the `mountains_vs_beaches_preferences.csv` dataset.
    - Connect to the PostgreSQL database.
    - Insert sample data (currently loading the full dataset, but designed for sample loading) into the `travel_profiles` table.
    - Basic error handling and logging are implemented.

**Next Phase: Embedding Generation (Local JavaScript with winkNLP)**

- Implement local vector embedding generation using **winkNLP** JavaScript library.
- Modify `load_data_sample.js` to generate embeddings for the "preferred_activities" text using winkNLP.
- Store the generated embeddings (initially placeholder, then winkNLP) in the `embedding` column of the `travel_profiles` table.


## Setup Instructions (Initial - will be expanded)

1. **Prerequisites:**
    - Node.js and npm installed
    - PostgreSQL installed (See "Database Setup" below)

2. **Database Setup:**
    - **Install PostgreSQL:** Follow the PostgreSQL installation instructions for your operating system (e.g., using Homebrew on macOS, or from the PostgreSQL website).
    - **Install `pgvector` extension:**  Follow the instructions in the pgvector documentation to install the `vector` extension for PostgreSQL. [Link to detailed pgvector installation instructions once finalized]
    - **Start PostgreSQL server.**
    - **Create the `travel_recommendation_db` database and enable the `vector` extension:**
        - Run the SQL script `backend/create_travel_profiles_table.sql` using `psql` or a PostgreSQL client.  You can use the npm script: `npm run db:create-table` from the `backend` directory (after setting up npm for the backend).

3. **Backend Setup:**
    - Navigate to the `backend` directory in your project: `cd backend`
    - Install backend dependencies: `npm install`
    - Create a `.env` file in the `backend` directory (copy from `.env.example` and adjust database connection details if needed).
    - **Load sample data into the database:** Run `npm run load:sample` from the `backend` directory. This will read a sample of data from the CSV and insert it into the `travel_profiles` table in your PostgreSQL database.

4. **Frontend Setup:**
    - [Instructions for frontend setup will be added as we develop it]