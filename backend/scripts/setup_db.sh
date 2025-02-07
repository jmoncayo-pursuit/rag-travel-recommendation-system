#!/bin/bash
set -e

echo "🔄 Setting up database..."

# Run SQL setup
psql -h localhost -p 5432 -U postgres -d travel_recommendation_db -f ../create_travel_profiles_table.sql

echo "📥 Loading data..."
cd ../ && npm run load:full

echo "✅ Setup complete!"