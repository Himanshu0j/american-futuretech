const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/american_futuretech';
    if (uri && uri.trim() !== '') {
      console.log(`Connecting to MongoDB at: ${uri}...`);
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[MongoDB Connected Successfully]: ${conn.connection.host}`);
      return;
    }

    // Zero-config fallback to MongoMemoryServer
    console.log('No MONGODB_URI provided. Initializing fast embedded In-Memory MongoDB engine...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'american_futuretech'
      }
    });
    const memoryUri = mongod.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`[In-Memory MongoDB Connected]: ${memoryUri}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // If external failed, try memory server fallback
    try {
      console.log('Attempting fallback to embedded In-Memory MongoDB engine...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'american_futuretech'
        }
      });
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[Fallback In-Memory MongoDB Connected]: ${memoryUri}`);
    } catch (fallbackErr) {
      console.error(`Fatal DB Failure: ${fallbackErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
