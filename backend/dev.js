import express from 'express';
import 'dotenv/config'; // Load environment variables

const app = express();
const port = process.env.PORT || 3001; // Use PORT from .env or default to 3001

app.get('/', (req, res) => {
  res.send('Hello from your Travel Recommendation Backend!');
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
