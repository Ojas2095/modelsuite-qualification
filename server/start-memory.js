const { MongoMemoryServer } = require('mongodb-memory-server');
// mongoose not needed

(async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'supersecretjwt';
  process.env.PORT = '5000';
  
  console.log('🌱 Starting MongoDB Memory Server...');
  console.log(`📡 URI: ${uri}`);
  
  console.log('🌱 Seeding database...');
  // We can't require seed.js directly because it calls process.exit()
  // So we will replicate the seed logic here
  const bcrypt = require('bcryptjs');
  const User = require('./models/User');
  const Task = require('./models/Task');
  const connectDB = require('./config/db');
  
  await connectDB();
  
  const salt = await bcrypt.genSalt(8);
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@taskpipeline.com',
    password: await bcrypt.hash('admin123', salt),
    role: 'Admin',
  });
  
  const talent1 = await User.create({
    name: 'Alice Johnson',
    email: 'alice@taskpipeline.com',
    password: await bcrypt.hash('talent123', salt),
    role: 'Talent',
  });

  const talent2 = await User.create({
    name: 'Bob Smith',
    email: 'bob@taskpipeline.com',
    password: await bcrypt.hash('talent123', salt),
    role: 'Talent',
  });
  
  // Create an overdue task and a due soon task
  const createdTasks = await Task.create([
    {
      title: 'Complete Brand Identity Kit (Overdue)',
      description: 'This task is overdue.',
      status: 'Open',
      assignedTo: talent1._id,
      dueDate: '2023-01-01', // Overdue
      createdBy: admin._id,
    },
    {
      title: 'Write Q2 Market Analysis Report (Due Soon)',
      description: 'This task is due very soon.',
      status: 'Claimed',
      assignedTo: talent1._id,
      dueDate: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(), // Due in 10 hours
      createdBy: admin._id,
    },
    {
      title: 'Secret Task for Bob',
      description: 'Bob has already submitted this.',
      status: 'Submitted',
      assignedTo: talent2._id,
      dueDate: '2025-01-01',
      createdBy: admin._id,
    }
  ]);
  
  const bobTask = createdTasks[2];
  
  const Submission = require('./models/Submission');
  await Submission.create({
    taskId: bobTask._id,
    talentId: talent2._id,
    notes: 'Bob secret submission notes',
    reviewStatus: 'Pending'
  });
  
  console.log('✅ Database seeded with Admin, Talents, tasks, and 1 submission!');
  console.log(`🔑 Bob Task ID for IDOR test: ${bobTask._id}`);
  console.log('🚀 Starting Express server...');
  
  require('./index.js');
})();
