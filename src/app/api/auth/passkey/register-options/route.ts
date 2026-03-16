import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import connectToDatabase from '@/lib/mongodb';
import Authenticator from '@/models/Authenticator';
import { cookies } from 'next/headers';
import { getWebAuthnConfig } from '@/lib/webauthn-config';

const rpName = 'AulaCheck';

export async function GET(req: Request) {
    try {
        const { rpID } = getWebAuthnConfig(req);
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        await connectToDatabase();

        // Obtener los autenticadores existentes del usuario para excluirlos
        const userAuthenticators = await Authenticator.find({ userId: session.user.id });

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: Buffer.from(session.user.id),
            userName: session.user.email!,
            userDisplayName: session.user.name || session.user.email!,
            excludeCredentials: userAuthenticators.map((auth: any) => ({
                id: auth.credentialID.toString('base64url'),
                type: 'public-key' as const,
                transports: auth.transports as any,
            })),
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'platform',
            },
        });

        // Guardar el challenge en una cookie para verificarlo luego
        const cookieStore = await cookies();
        cookieStore.set('registrationChallenge', options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 300, // 5 minutos
            path: '/',
        });

        return NextResponse.json(options);
    } catch (error: any) {
        console.error('Error al generar opciones de registro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
