import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`SAP Payment Validation Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});