import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (!process.env.MONGODB_DB_NAME) {
  throw new Error('Please add your MongoDB database name to .env.local');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

// Singleton pattern para reutilizar conexión
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // Si ya tenemos una conexión cacheada, reutilizarla
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Crear nueva conexión
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 5,
  });

  await client.connect();
  const db = client.db(dbName);

  // Cachear para próximas requests
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Helper para obtener solo la DB
export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}
