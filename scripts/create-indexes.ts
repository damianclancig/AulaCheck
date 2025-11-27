import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.local ANTES de importar el cliente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function createIndexes() {
  try {
    // Importación dinámica para asegurar que las variables de entorno estén cargadas
    const { getDatabase } = await import('../src/lib/mongodb/client');

    console.log('Connecting to MongoDB...');
    const db = await getDatabase();

    console.log('Creating indexes...');

    // Índices para courses
    await db.collection('courses').createIndex({ ownerId: 1 });
    console.log('✓ Created index on courses.ownerId');

    // Índices para enrollments
    await db.collection('enrollments').createIndex({ courseId: 1, studentId: 1 }, { unique: true });
    await db.collection('enrollments').createIndex({ studentId: 1 });
    await db.collection('enrollments').createIndex({ courseId: 1, status: 1 });
    console.log('✓ Created indexes on enrollments');

    // Índices para attendance
    await db.collection('attendance').createIndex({ courseId: 1, date: 1 });
    await db.collection('attendance').createIndex({ studentId: 1 });
    await db.collection('attendance').createIndex({ courseId: 1, studentId: 1, date: 1 }, { unique: true });
    console.log('✓ Created indexes on attendance');

    // Índices para grades
    await db.collection('grades').createIndex({ courseId: 1, studentId: 1 });
    await db.collection('grades').createIndex({ studentId: 1 });
    console.log('✓ Created indexes on grades');

    console.log('\n✅ All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
