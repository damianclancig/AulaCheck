import { verifyIdToken } from '../firebase/admin';

export interface AuthenticatedUser {
  uid: string;
  email: string;
}

/**
 * Verifica el token de autenticación en el header Authorization
 * @param request - Request object de Next.js
 * @returns Usuario autenticado o null si no está autenticado
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    
    const decodedToken = await verifyIdToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Middleware helper para proteger rutas API
 * Retorna una respuesta 401 si no está autenticado
 */
export function requireAuth(user: AuthenticatedUser | null): user is AuthenticatedUser {
  return user !== null;
}
