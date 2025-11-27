import * as admin from 'firebase-admin';
import { App } from 'firebase-admin/app';

if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error('FIREBASE_PROJECT_ID is not set');
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error('FIREBASE_CLIENT_EMAIL is not set');
}

if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('FIREBASE_PRIVATE_KEY is not set');
}

// Singleton pattern para evitar múltiples inicializaciones
let app: App;

function getFirebaseAdmin(): App {
  if (!app) {
    // Verificar si ya existe una app inicializada
    if (admin.apps.length > 0) {
      app = admin.apps[0] as App;
    } else {
      // Inicializar nueva app
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Reemplazar \n literales con saltos de línea reales
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
      });
    }
  }
  return app;
}

// Función para verificar ID token
export async function verifyIdToken(token: string) {
  const app = getFirebaseAdmin();
  const auth = admin.auth(app);
  
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid or expired token');
  }
}

// Exportar auth para uso directo si es necesario
export function getAuth() {
  const app = getFirebaseAdmin();
  return admin.auth(app);
}
