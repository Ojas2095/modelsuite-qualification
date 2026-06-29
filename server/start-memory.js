require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');
const { spawn } = require('child_process');

(async () => {
  const mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  console.log('MongoDB Memory Server running on', process.env.MONGO_URI);
  
  const seed = spawn('node', ['scripts/seed.js'], { env: process.env, stdio: 'inherit', shell: true });
  seed.on('close', (code) => {
    if (code === 0) {
      console.log('Seeded successfully. Starting server...');
      spawn('npm', ['run', 'dev'], { env: process.env, stdio: 'inherit', shell: true });
    } else {
      console.error('Seed failed with code', code);
    }
  });
})();
