import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { cookies } from 'next/headers';
import { getWebAuthnConfig } from '@/lib/webauthn-config';

export async function GET(req: Request) {
    try {
        const { rpID } = getWebAuthnConfig(req);
        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: 'preferred',
        });

        const cookieStore = await cookies();
        cookieStore.set('authenticationChallenge', options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 300, // 5 minutos
            path: '/',
        });

        return NextResponse.json(options);
    } catch (error: any) {
        console.error('Error al generar opciones de autenticación:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
