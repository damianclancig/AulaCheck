import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error('Por favor define la variable MONGODB_URI dentro de .env.local');
}

/**
 * Caché global para la conexión de mongoose en desarrollo.
 * Previene que las recargas de HMR (Hot Module Replacement) creen múltiples conexiones.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            dbName: process.env.MONGODB_DB_NAME || 'aulacheck', // Asegurar el nombre de la DB
            serverSelectionTimeoutMS: 5000, // 5 segundos de timeout
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        }).catch(err => {
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default connectToDatabase;
