import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

console.log('🔧 MongoDB Config:', {
  hasUri: !!MONGODB_URI,
  hasDb: !!MONGODB_DB,
  dbName: MONGODB_DB
});

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

async function connectDB() {
  console.log('🔄 Connecting to MongoDB...');
  
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔌 Creating new MongoDB connection');
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts)
      .then((client) => {
        console.log('✅ MongoDB connected successfully');
        const db = client.db(MONGODB_DB);
        return db;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection failed:', error);
        cached.promise = null;
        throw error;
      });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;