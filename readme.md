# RAG Travel Recommendation System

## Overview

This project is a travel recommendation system built using the PERN stack (PostgreSQL, Express.js, React.js, Node.js) and Tailwind CSS. It leverages AI-powered search using `pgvector` for efficient vector retrieval to provide personalized travel recommendations. This is a learning project exploring Retrieval-Augmented Generation (RAG) systems and vector databases.

## Features

- **Enhanced AI-Powered Recommendations:** Uses a sophisticated multi-factor scoring system:
  - Vector similarity search with 150% boost for semantic matching
  - Activity cluster matching for direct and related activities
  - Location relevance scoring
  - Compound activity scoring for complementary activities
  - Smart budget filtering and normalization
- **Intelligent Scoring System:**
  - Category-weighted embeddings for better semantic understanding
  - Compound score boosting for matching multiple criteria
  - Activity cluster recognition (e.g., beach-related, mountain-related activities)
  - Location-based relevance bonuses
- **Vector Similarity Search:** Uses `pgvector` in PostgreSQL with normalized vectors and weighted scoring
- **REST API:** Express.js backend provides a RESTful API for data interaction.
- **(Future) User Interface:** A React.js frontend will provide an intuitive user interface.
- **(Future) RAG Integration:** Plans to integrate a Large Language Model (LLM) for richer, context-aware recommendations.

## Tech Stack

- **Frontend:** React.js, Tailwind CSS, Vite
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL with `pgvector` extension
- **Vector Embeddings:** winkNLP (using `wink-eng-lite-web-model`)
- **(Future) LLM:** [Researching suitable LLM for response generation - e.g., Gemini, local models]

## How Recommendations Work

The system uses a sophisticated multi-layered approach to generate recommendations:

1. **Vector Similarity (40-60% weight):**

   - Generates category-weighted embeddings from user activities
   - Uses normalized vectors for consistent scoring
   - Applies a 150% boost to strong vector matches

2. **Activity Matching:**

   - Direct matches (100 points)
   - Strong activity combinations (90 points)
   - Single strong matches (80 points)
   - Related activities (70 points)
   - General category matches (60 points)

3. **Location Relevance:**

   - Coastal/beach locations (30 points)
   - Tropical/island locations (25 points)
   - Resort/seaside locations (20 points)

4. **Compound Scoring:**
   - Additional 20% boost for matches with both high activity and location scores
   - Smart budget filtering with flexible ranges
   - Age and budget range filtering

## Development Status

- **Phase 1: Database Setup and Data Loading - COMPLETE**
  - PostgreSQL with `pgvector` extension is set up and running.
  - `travel_profiles` table is created with appropriate columns, including a `vector` column for embeddings.
  - Backend scripts (`load_data_sample.js` and `load_data_full.js`) are implemented to:
    - Read data from `mountains_vs_beaches_preferences.csv`.
    - Connect to the PostgreSQL database.
    - Generate vector embeddings using winkNLP.
    - Insert data (either a sample or the full dataset) into the `travel_profiles` table.
    - Include robust error handling and detailed logging (using `chalk` and emoticons).
    - Provide a preview of inserted data and embeddings.
      34
- **Phase 1.5: Improved Logging and Embedding Preview - COMPLETE**

  - Implemented `format_embedding` SQL function for a concise embedding preview.
  - Enhanced logging with colors and emoticons for better readability.
  - Added a preview table after data loading to show the first 5 rows, including formatted embeddings.

- **Phase 2: Backend API Development - COMPLETE**

  - Basic Express.js server setup
  - Implemented recommendations endpoint with vector similarity search
  - Added CORS support for frontend integration
  - Enhanced error handling and logging

- **Phase 3: Frontend Development - COMPLETE**

  - Implemented React.js frontend using Vite and Tailwind CSS
  - Created accessible dark mode UI with form validation
  - Added loading states and error handling
  - Implemented responsive recommendation cards
  - Added keyboard navigation support

- **(Future) Phase 4: RAG Integration**
  - Integrate a Large Language Model (LLM) for more sophisticated, context-aware recommendations.

## Frontend Features

- **Dark Mode UI:** Clean, modern interface optimized for reduced eye strain
- **Accessibility:** Full keyboard navigation, ARIA labels, and screen reader support
- **Responsive Design:** Optimized for mobile, tablet, and desktop views
- **Real-time Feedback:** Loading states and error messages
- **Match Scoring:** Visual representation of recommendation relevance

## Setup Instructions

1.  **Prerequisites:**

    - Node.js (v18 or later recommended) and npm installed.
    - PostgreSQL (v13 or later recommended) installed and running.
    - Basic familiarity with SQL and command-line interfaces.

2.  **Database Setup:**

    - **Install PostgreSQL:** Follow the official PostgreSQL installation instructions for your operating system.
    - **Install `pgvector`:** Follow the instructions on the [pgvector GitHub repository](https://github.com/pgvector/pgvector) to install the extension. This usually involves:
      - Downloading the `pgvector` source code.
      - Compiling the extension (you may need development tools like `make` and a C compiler).
      - Installing the extension files into your PostgreSQL installation.
      - Running `CREATE EXTENSION vector;`
    - **Create Database and Table:**
      - Connect to your PostgreSQL server using `psql` or a GUI client (like pgAdmin).
      - Create a database named `travel_recommendation_db`:
        ```sql
        CREATE DATABASE travel_recommendation_db;
        ```
      - Connect to the newly created database:
        ```sql
        \c travel_recommendation_db
        ```
      - Enable the `vector` extension:
        ```sql
        CREATE EXTENSION vector;
        ```
      - Run the SQL script `backend/create_travel_profiles_table.sql` to create the `travel_profiles` table and the helper function:
        ```bash
        psql -h localhost -p 5432 -U postgres -d travel_recommendation_db -f backend/create_travel_profiles_table.sql
        ```
        Or, from the `backend` directory, you can use the npm script:
        ```bash
        npm run db:create-table
        ```

3.  **Backend Setup:**

    - Navigate to the `backend` directory:
      ```bash
      cd backend
      ```
    - Install dependencies:
      ```bash
      npm install
      ```
    - Create a `.env` file:
      - Copy the `.env.example` file to a new file named `.env`:
        ```bash
        cp .env.example .env
        ```
      - Edit the `.env` file and update the database connection details ( `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) if they differ from the defaults.
    - **Load Data:**
      - **Load Sample Data (for testing):**
        ```bash
        npm run load:sample
        ```
        This loads the first 20 rows of the CSV data.
      - **Load Full Data:**
        ```bash
        npm run load:full
        ```
        This loads the _entire_ CSV dataset. Be aware this might take longer.

4.  **Running the Backend (Basic Server):**

    - Start the backend development server:
      ```bash
        npm run dev
      ```
      This starts a basic Express server (defined in `index.js`). It doesn't have any API endpoints yet, but it confirms that the server can start. You should see a message like:
      `Backend server listening on port 3001`

5.  **Frontend Setup:**

```bash
cd frontend
npm install
npm run dev
```

## Scripts

The `backend/package.json` file defines the following scripts:

- `npm run dev`: Starts the backend development server using `nodemon` for automatic reloading.
- `npm run load:sample`: Loads a sample of the data (first 20 rows) into the database.
- `npm run load:full`: Loads the _entire_ dataset into the database.
- `npm run db:create-table`: Executes the SQL script to create the database table and helper function.
- `npm run setup:db`: (Currently a placeholder) Intended to automate the entire database setup process.
