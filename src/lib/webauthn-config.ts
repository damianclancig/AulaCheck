import { NextRequest } from 'next/server';

/**
 * Obtiene la configuración de WebAuthn (rpID y origin) de forma dinámica
 * basada en la petición actual o variables de entorno.
 */
export function getWebAuthnConfig(req?: Request) {
    const envRpID = process.env.NEXT_PUBLIC_RP_ID;
    const envOrigin = process.env.NEXT_PUBLIC_ORIGIN;

    // En producción, si tenemos variables de entorno, las priorizamos estrictamente
    if (process.env.NODE_ENV === 'production' && envRpID && envOrigin) {
        return { rpID: envRpID, origin: envOrigin };
    }

    // En desarrollo o si faltan variables, detectamos dinámicamente
    let host = '';
    if (req) {
        const url = new URL(req.url);
        host = url.hostname;
    }

    // El rpID NO puede incluir el protocolo ni el puerto. Debe ser solo el dominio.
    const rpID = host || envRpID || 'localhost';
    
    let origin = envOrigin;
    if (!origin && req) {
        const url = new URL(req.url);
        // El origin SÍ incluye protocolo y puerto (ej: http://localhost:3000)
        origin = `${url.protocol}//${url.host}`;
    } else if (!origin) {
        origin = `http://${rpID}`;
    }

    return { rpID, origin };
}
